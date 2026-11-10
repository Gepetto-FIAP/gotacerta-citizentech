"use client";

import React, { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Tab = "dashboard" | "detalhe" | "alertas" | "cadastro" | "login";

export default function GotaCertaMobileApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [leituras, setLeituras] = useState<any[]>([]);
  const [selectedImovel, setSelectedImovel] = useState<any | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados do formulário de Login (Parte 5 - Vitória)
  const [email, setEmail] = useState("maria.silva@email.com");
  const [senha, setSenha] = useState("GotaCerta@2026");

  // Estados do formulário de Cadastro de Imóvel (Parte 4 - Tela de Cadastro)
  const [apelidoLocal, setApelidoLocal] = useState("");
  const [tipoImovel, setTipoImovel] = useState("RESIDENCIAL");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("Jardim Pantanal");
  const [cep, setCep] = useState("08090-100");
  const [hidrometro, setHidrometro] = useState("");

  async function carregarDados() {
    setLoading(true);
    try {
      const [resImoveis, resAlertas, resLeituras] = await Promise.all([
        fetch(`${API_BASE}/api/imoveis`),
        fetch(`${API_BASE}/api/alertas`),
        fetch(`${API_BASE}/api/leituras?limit=15`),
      ]);
      if (!resImoveis.ok) throw new Error("Falha ao consultar API");
      const dataImoveis = await resImoveis.json();
      const dataAlertas = await resAlertas.json();
      const dataLeituras = await resLeituras.json();
      setImoveis(dataImoveis);
      setAlertas(dataAlertas);
      setLeituras(dataLeituras);
      if (!selectedImovel && dataImoveis.length > 0) {
        setSelectedImovel(dataImoveis[0]);
      }
    } catch {
      setFeedback({
        tipo: "erro",
        texto: "Modo Offline / Sem conexão com a API em " + API_BASE,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

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
      setFeedback({ tipo: "sucesso", texto: `Bem-vindo(a), ${data.nome} (${data.perfil})!` });
      setActiveTab("dashboard");
    } catch (err: any) {
      setFeedback({ tipo: "erro", texto: err.message });
    }
  }

  async function handleResolverAlerta(id: number) {
    try {
      const res = await fetch(`${API_BASE}/api/alertas/${id}/resolver`, { method: "PUT" });
      if (!res.ok) throw new Error("Não foi possível atualizar o alerta.");
      setFeedback({ tipo: "sucesso", texto: "Vazamento marcado como reparado com sucesso!" });
      carregarDados();
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
          tipoImovel,
          endereco,
          bairro,
          cep,
          numeroSerieHidrometro: hidrometro,
          metaConsumoMensalLitros: 12000,
          capacidadeCaixaLitros: 1000,
          moradoresAtendidos: 4,
        }),
      });
      if (!res.ok) throw new Error("Erro ao cadastrar hidrômetro. Verifique os campos.");
      setApelidoLocal("");
      setEndereco("");
      setHidrometro("");
      setFeedback({ tipo: "sucesso", texto: "Imóvel e hidrômetro cadastrados na API!" });
      await carregarDados();
      setActiveTab("dashboard");
    } catch (err: any) {
      setFeedback({ tipo: "erro", texto: err.message });
    }
  }

  return (
    <div className="flex flex-col flex-1 justify-between">
      {/* Header Mobile */}
      <header className="bg-cyan-950/80 border-b border-cyan-800/50 p-4 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
            CitizenTech · FIAP GS
          </span>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            💧 GotaCerta
          </h1>
        </div>
        <button
          onClick={() => setActiveTab("login")}
          className="text-xs px-3 py-1.5 rounded-full bg-cyan-800/60 hover:bg-cyan-700 text-cyan-100 border border-cyan-600"
        >
          {usuarioLogado ? `${usuarioLogado.perfil}` : "Entrar (JWT)"}
        </button>
      </header>

      {/* Banner de Feedback de Ações e Conexão */}
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

      {/* Conteúdo Principal das 5 Telas */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* TELA 1: LISTA & DASHBOARD DE HIDRÔMETROS */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Imóveis & Hidrômetros ({imoveis.length})
              </h2>
              <button
                onClick={carregarDados}
                className="text-xs text-cyan-400 hover:underline"
              >
                {loading ? "Atualizando..." : "↻ Atualizar"}
              </button>
            </div>

            {imoveis.map((imovel) => {
              const temAlerta = imovel.alertas && imovel.alertas.length > 0;
              return (
                <div
                  key={imovel.id}
                  onClick={() => {
                    setSelectedImovel(imovel);
                    setActiveTab("detalhe");
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    temAlerta
                      ? "bg-rose-950/30 border-rose-700/70 hover:bg-rose-950/50"
                      : "bg-slate-800/60 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {imovel.tipoImovel}
                      </span>
                      <h3 className="font-bold text-base mt-1 text-white">
                        {imovel.apelidoLocal}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {imovel.endereco} · {imovel.bairro}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        temAlerta
                          ? "bg-rose-600 text-white"
                          : "bg-emerald-800/60 text-emerald-300"
                      }`}
                    >
                      {temAlerta ? `🚨 ${imovel.alertas.length} Alerta` : "Normal"}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex justify-between text-xs text-slate-300">
                    <span>Hidrômetro: {imovel.numeroSerieHidrometro}</span>
                    <span className="text-cyan-400 font-medium">Ver telemetria →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TELA 2: DETALHE DA TELEMETRIA DO HIDRÔMETRO (UNICAMP) */}
        {activeTab === "detalhe" && selectedImovel && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="text-xs text-cyan-400 hover:underline"
            >
              ← Voltar para lista de imóveis
            </button>
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
              <h2 className="text-lg font-bold text-white">{selectedImovel.apelidoLocal}</h2>
              <p className="text-xs text-slate-400">
                Hidrômetro Série: {selectedImovel.numeroSerieHidrometro} ({selectedImovel.bairro})
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <span className="text-[11px] text-slate-400">Meta Mensal</span>
                  <p className="text-base font-bold text-cyan-400">
                    {selectedImovel.metaConsumoMensalLitros} L
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
                  <span className="text-[11px] text-slate-400">Reservatório</span>
                  <p className="text-base font-bold text-emerald-400">
                    {selectedImovel.capacidadeCaixaLitros} L
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Últimas Leituras IoT (Relojoaria + Caixa d&apos;Água)
            </h3>
            <div className="space-y-2">
              {leituras.slice(0, 6).map((l) => (
                <div
                  key={l.id}
                  className="p-3 rounded-lg bg-slate-800/70 border border-slate-700 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">
                      Vazão: {l.vazaoInstantaneaLpm} L/min ({l.pulsosRegistrados} pulsos)
                    </p>
                    <p className="text-slate-400">
                      Acumulado: {l.volumeAcumuladoLitros} L · Rua: {l.pressaoRuaBar} bar
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 font-semibold">
                      Caixa {l.nivelCaixaPercentual}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TELA 3: CENTRAL DE ALERTAS DE VAZAMENTO E FALTA D'ÁGUA */}
        {activeTab === "alertas" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Alertas de Desperdício e Abastecimento
            </h2>
            {alertas.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border ${
                  a.resolvido
                    ? "bg-slate-800/40 border-slate-700 opacity-70"
                    : "bg-rose-950/40 border-rose-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-700 text-white">
                    {a.tipoAlerta} · {a.severidade}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {a.resolvido ? "✅ Resolvido" : "⏳ Pendente"}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-2">{a.mensagem}</p>
                {a.desperdicioEstimadoLitros > 0 && (
                  <p className="text-xs text-amber-300 mt-1 font-medium">
                    Desperdício estimado: {a.desperdicioEstimadoLitros} Litros
                  </p>
                )}
                {!a.resolvido && (
                  <button
                    onClick={() => handleResolverAlerta(a.id)}
                    className="mt-3 w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Confirmar Reparo / Resolver Alerta (PUT)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TELA 4: CADASTRO DE NOVO IMÓVEL E HIDRÔMETRO */}
        {activeTab === "cadastro" && (
          <form onSubmit={handleCadastrarImovel} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Cadastrar Imóvel & Hidrômetro
            </h2>
            <input
              required
              placeholder="Apelido (ex: Casa do Sr. José)"
              value={apelidoLocal}
              onChange={(e) => setApelidoLocal(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            />
            <select
              value={tipoImovel}
              onChange={(e) => setTipoImovel(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            >
              <option value="RESIDENCIAL">Residencial</option>
              <option value="ESCOLA_PUBLICA">Escola Pública</option>
              <option value="COMERCIO">Pequeno Comércio</option>
              <option value="COMUNITARIO">Espaço Comunitário</option>
            </select>
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
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm"
            >
              Salvar Hidrômetro na API (POST)
            </button>
          </form>
        )}

        {/* TELA 5: LOGIN SEGURO COM JWT BEARER */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Autenticação Segura (JWT + Hash PBKDF2)
            </h2>
            <p className="text-xs text-slate-400">
              Teste com <b>maria.silva@email.com</b> (MORADOR) ou{" "}
              <b>admin@gotacerta.org.br</b> (ADMIN). Senha padrão: <b>GotaCerta@2026</b>
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
              Autenticar na API
            </button>
          </form>
        )}
      </main>

      {/* Bottom Navigation Bar (Mobile-First) */}
      <nav className="bg-slate-950 border-t border-slate-800 grid grid-cols-4 text-xs">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "dashboard" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>🏠</span>
          <span>Imóveis</span>
        </button>
        <button
          onClick={() => setActiveTab("detalhe")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "detalhe" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>📟</span>
          <span>Telemetria</span>
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
          onClick={() => setActiveTab("cadastro")}
          className={`py-3 flex flex-col items-center ${
            activeTab === "cadastro" ? "text-cyan-400 font-bold" : "text-slate-400"
          }`}
        >
          <span>➕</span>
          <span>Cadastrar</span>
        </button>
      </nav>
    </div>
  );
}
