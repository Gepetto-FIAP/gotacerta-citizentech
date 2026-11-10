"use client";

import React, { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Tab = "dashboard" | "historico" | "alertas" | "cadastro" | "gestor" | "login";

export default function GotaCertaMobileApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [selectedImovelId, setSelectedImovelId] = useState<number>(1);
  const [dashImovel, setDashImovel] = useState<any | null>(null);
  const [historicoDiario, setHistoricoDiario] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [bairrosAlertas, setBairrosAlertas] = useState<any[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Login (Página 19 - Vitória)
  const [email, setEmail] = useState("maria.silva@email.com");
  const [senha, setSenha] = useState("GotaCerta@2026");

  // Cadastro de Imóvel/Hidrômetro (Página 20 - Danilo)
  const [apelidoLocal, setApelidoLocal] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("Jardim Pantanal");
  const [cep, setCep] = useState("08090-100");
  const [hidrometro, setHidrometro] = useState("");
  const [metaMensal, setMetaMensal] = useState(10000);

  async function carregarTudo(idImovel = selectedImovelId) {
    setLoading(true);
    try {
      const [resImoveis, resDash, resHist, resAlertas, resBairros] = await Promise.all([
        fetch(`${API_BASE}/api/imoveis`),
        fetch(`${API_BASE}/api/imoveis/${idImovel}/dashboard`),
        fetch(`${API_BASE}/api/imoveis/${idImovel}/historico`),
        fetch(`${API_BASE}/api/alertas`),
        fetch(`${API_BASE}/api/bairros/alertas`),
      ]);
      if (!resImoveis.ok) throw new Error("Sem conexão com a API");
      setImoveis(await resImoveis.json());
      if (resDash.ok) setDashImovel(await resDash.json());
      if (resHist.ok) setHistoricoDiario(await resHist.json());
      if (resAlertas.ok) setAlertas(await resAlertas.json());
      if (resBairros.ok) setBairrosAlertas(await resBairros.json());
    } catch {
      setFeedback({
        tipo: "erro",
        texto: `Erro de conexão com a API (${API_BASE}). Verifique se o back-end está no ar.`,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo(selectedImovelId);
  }, [selectedImovelId]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Credenciais inválidas");
      setUsuarioLogado(data);
      setFeedback({ tipo: "sucesso", texto: `Autenticado como ${data.nome} (${data.perfil})` });
      setActiveTab(data.perfil === "ADMIN" ? "gestor" : "dashboard");
    } catch (err: any) {
      setFeedback({ tipo: "erro", texto: err.message });
    }
  }

  async function handleConfirmarReparo(alertaId: number) {
    try {
      const res = await fetch(`${API_BASE}/api/alertas/${alertaId}`, { method: "PUT" });
      if (!res.ok) throw new Error("Falha ao confirmar reparo.");
      setFeedback({ tipo: "sucesso", texto: "Reparo confirmado! Alerta marcado como resolvido." });
      carregarTudo();
    } catch (err: any) {
      setFeedback({ tipo: "erro", texto: err.message });
    }
  }

  async function handleCadastrarImovel(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/imoveis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuarioLogado?.usuarioId || 2,
          apelidoLocal,
          endereco,
          bairro,
          cep,
          numeroSerieHidrometro: hidrometro,
          metaConsumoMensalLitros: Number(metaMensal),
        }),
      });
      if (!res.ok) throw new Error("Dados inválidos ao cadastrar imóvel.");
      setApelidoLocal("");
      setEndereco("");
      setHidrometro("");
      setFeedback({ tipo: "sucesso", texto: "Hidrômetro cadastrado com sucesso!" });
      await carregarTudo();
      setActiveTab("dashboard");
    } catch (err: any) {
      setFeedback({ tipo: "erro", texto: err.message });
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-between">
      {/* Header */}
      <header className="bg-cyan-950/80 border-b border-cyan-800/50 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
            Não trocamos o hidrômetro · Ensinamos ele a falar
          </span>
          <h1 className="text-xl font-bold text-white">💧 Gota Certa</h1>
        </div>
        <button
          onClick={() => setActiveTab("login")}
          className="text-xs px-3 py-1.5 rounded-full bg-cyan-800/60 hover:bg-cyan-700 text-cyan-100 border border-cyan-600"
        >
          {usuarioLogado ? `${usuarioLogado.perfil}` : "Login JWT"}
        </button>
      </header>

      {/* Banner de Feedback */}
      {feedback && (
        <div
          className={`mx-4 mt-3 p-3 rounded-lg text-xs font-medium flex justify-between items-center ${
            feedback.tipo === "sucesso"
              ? "bg-emerald-950/90 text-emerald-300 border border-emerald-700"
              : "bg-rose-950/90 text-rose-300 border border-rose-700"
          }`}
        >
          <span>{feedback.texto}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Seletor Rápido de Imóvel */}
        {(activeTab === "dashboard" || activeTab === "historico") && (
          <div className="flex items-center justify-between gap-2">
            <select
              value={selectedImovelId}
              onChange={(e) => setSelectedImovelId(Number(e.target.value))}
              className="flex-1 p-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            >
              {imoveis.map((im) => (
                <option key={im.id} value={im.id}>
                  {im.apelidoLocal} ({im.numeroSerieHidrometro})
                </option>
              ))}
            </select>
            <button
              onClick={() => carregarTudo()}
              className="text-xs px-2.5 py-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700"
            >
              {loading ? "..." : "↻"}
            </button>
          </div>
        )}

        {/* TELA 1: DASHBOARD DO HIDRÔMETRO (Litros, Reais estimados, Vazão L/min e Meta) */}
        {activeTab === "dashboard" && dashImovel && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-white">{dashImovel.apelidoLocal}</h2>
                  <p className="text-xs text-slate-400">
                    Hidrômetro: {dashImovel.numeroSerieHidrometro} · {dashImovel.bairro}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold">
                  {dashImovel.vazaoAtualLpm} L/min
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <span className="text-[11px] text-slate-400">Consumo no Mês</span>
                  <p className="text-lg font-bold text-white">{dashImovel.consumoMesLitros} L</p>
                  <span className="text-[10px] text-slate-400">
                    Meta: {dashImovel.metaConsumoMensalLitros} L ({dashImovel.percentualMetaConsumida}%)
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <span className="text-[11px] text-slate-400">Valor Estimado*</span>
                  <p className="text-lg font-bold text-emerald-400">
                    R$ {Number(dashImovel.valorEstimadoReais).toFixed(2)}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Mostrador: {dashImovel.leituraAtualMostradorLitros} L
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                *Cálculo estimado: litros ÷ 1.000 × tarifa de exemplo (R$ 8,50/m³).
              </p>
            </div>

            {/* Alertas Ativos do Imóvel no Painel (Estilo Página 5 do Guia) */}
            {dashImovel.alertasAtivos && dashImovel.alertasAtivos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Alertas Ativos neste Imóvel ({dashImovel.alertasAtivosCount})
                </h3>
                {dashImovel.alertasAtivos.map((al: any) => (
                  <div
                    key={al.id}
                    className="p-4 rounded-xl bg-slate-950 border border-rose-700/80 space-y-2"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      ALERTA NO PAINEL · {al.tipoAlerta} ({al.severidade})
                    </span>
                    <p className="text-xs text-slate-200">{al.mensagem}</p>
                    <button
                      onClick={() => handleConfirmarReparo(al.id)}
                      className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold"
                    >
                      Confirmar reparo
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TELA 2: HISTÓRICO DIÁRIO DE CONSUMO */}
        {activeTab === "historico" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Histórico Diário ({dashImovel?.apelidoLocal})
            </h2>
            {historicoDiario.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-800/70 border border-slate-700 flex justify-between items-center text-xs"
              >
                <div>
                  <p className="font-bold text-white">Dia {item.data}</p>
                  <p className="text-slate-400">Pico de vazão: {item.vazaoMaximaDiaLpm} L/min</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 font-bold">
                    {item.consumoDiaLitros} L
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TELA 3: CENTRAL DE ALERTAS */}
        {activeTab === "alertas" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Central de Alertas ({alertas.length})
            </h2>
            {alertas.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border ${
                  a.resolvido
                    ? "bg-slate-800/40 border-slate-700 opacity-60"
                    : "bg-rose-950/30 border-rose-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-700 text-white">
                    {a.tipoAlerta} · {a.severidade}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {a.resolvido ? "✅ Resolvido" : "⏳ Ativo"}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-2">{a.mensagem}</p>
                {!a.resolvido && (
                  <button
                    onClick={() => handleConfirmarReparo(a.id)}
                    className="mt-3 w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Confirmar reparo (PUT /api/alertas/{a.id})
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TELA 4: VISÃO DO GESTOR DA COMUNIDADE (/api/bairros/alertas) */}
        {activeTab === "gestor" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Painel do Gestor · Consumo e Alertas por Bairro
            </h2>
            {bairrosAlertas.map((b, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <h3 className="font-bold text-white">{b.bairro}</h3>
                  <span className="text-xs text-rose-400 font-semibold">
                    {b.alertasAtivos} alertas ativos
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Imóveis monitorados: {b.totalImoveisMonitorados} · Consumo no mês:{" "}
                  {b.consumoTotalBairroLitros} L
                </p>
                <p className="text-xs text-amber-400">
                  Desperdício estimado em vazamentos: {b.volumeDesperdicadoLitros} L
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TELA 5: CADASTRO DE IMÓVEL E HIDRÔMETRO */}
        {activeTab === "cadastro" && (
          <form onSubmit={handleCadastrarImovel} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Cadastrar Imóvel & Hidrômetro
            </h2>
            <input
              required
              placeholder="Apelido (ex: Casa da Dona Maria)"
              value={apelidoLocal}
              onChange={(e) => setApelidoLocal(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <input
              required
              placeholder="Endereço completo"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <input
              required
              placeholder="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <input
              required
              placeholder="Nº Série do Hidrômetro (ex: HIDRO-2026-900)"
              value={hidrometro}
              onChange={(e) => setHidrometro(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <input
              type="number"
              required
              placeholder="Meta mensal em litros (ex: 10000)"
              value={metaMensal}
              onChange={(e) => setMetaMensal(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm"
            >
              Salvar Hidrômetro (POST /api/imoveis)
            </button>
          </form>
        )}

        {/* TELA DE LOGIN JWT */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Login Seguro (BCrypt + JWT Bearer)
            </h2>
            <p className="text-xs text-slate-400">
              Morador: <b>maria.silva@email.com</b> | Gestor: <b>admin@gotacerta.org.br</b> (Senha:{" "}
              <b>GotaCerta@2026</b>)
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm"
            >
              Entrar
            </button>
          </form>
        )}
      </main>

      {/* Navegação Inferior Mobile-First (5 Abas) */}
      <nav className="bg-slate-950 border-t border-slate-800 grid grid-cols-5 text-[11px]">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "dashboard" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>💧</span>
          <span>Painel</span>
        </button>
        <button
          onClick={() => setActiveTab("alertas")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "alertas" ? "text-rose-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>🚨</span>
          <span>Alertas</span>
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "historico" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>📊</span>
          <span>Histórico</span>
        </button>
        <button
          onClick={() => setActiveTab("gestor")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "gestor" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>🏘️</span>
          <span>Gestor</span>
        </button>
        <button
          onClick={() => setActiveTab("cadastro")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "cadastro" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>➕</span>
          <span>Imóvel</span>
        </button>
      </nav>
    </div>
  );
}
