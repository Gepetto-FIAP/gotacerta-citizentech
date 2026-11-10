#!/usr/bin/env python3
"""
FIAP - Global Solution 2026/2 - CitizenTech (3ESOA)
Projeto Gota Certa - Suíte Automatizada de Testes de API (Parte 3 - João)
Alinhada às Páginas 14 e 21 do Guia do Grupo (10 casos cobrindo 200, 201, 400, 401, 403, 404).
"""

import datetime
import json
import os
import urllib.error
import urllib.request

API_BASE = os.environ.get("API_BASE_URL", "http://localhost:8080")


def request_api(method: str, path: str, payload=None, token: str = None):
    url = f"{API_BASE.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            body = json.loads(raw) if raw else {}
            return resp.status, body
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore")
        try:
            body = json.loads(raw) if raw else {}
        except Exception:
            body = {"raw": raw}
        return e.code, body


def run_suite():
    logs = []

    def log(msg: str):
        print(msg)
        logs.append(msg)

    log("=" * 78)
    log("RELATÓRIO DE EXECUÇÃO DE TESTES AUTOMATIZADOS - GOTA CERTA API")
    log(f"Data/Hora UTC: {datetime.datetime.now(datetime.timezone.utc).isoformat()}")
    log(f"Target URL:    {API_BASE}")
    log("=" * 78)

    casos = []

    # CT-01: Login válido (MORADOR)
    status, body = request_api(
        "POST", "/api/auth/login", {"email": "maria.silva@email.com", "senha": "GotaCerta@2026"}
    )
    token_morador = body.get("tokenJwt", "")
    casos.append(("CT-01", "Login válido com senha verificada em BCrypt (MORADOR)", 200, status, status == 200 and bool(token_morador)))

    # CT-02: Login inválido (Erro 401)
    status, _ = request_api(
        "POST", "/api/auth/login", {"email": "maria.silva@email.com", "senha": "SenhaIncorreta999"}
    )
    casos.append(("CT-02", "Bloqueio de login com senha incorreta (Erro 401)", 401, status, status == 401))

    # CT-03: Registro inválido (Erro 400)
    status, _ = request_api(
        "POST", "/api/auth/register", {"nome": "A", "email": "invalido", "senha": "123"}
    )
    casos.append(("CT-03", "Validação de entrada inválida no cadastro (Erro 400)", 400, status, status == 400))

    # CT-04: Dashboard do imóvel (GET /api/imoveis/1/dashboard)
    status, body = request_api("GET", "/api/imoveis/1/dashboard")
    casos.append(("CT-04", "Dashboard do imóvel: litros, reais estimados e meta (GET)", 200, status, status == 200 and "valorEstimadoReais" in body))

    # CT-05: Imóvel inexistente (Erro 404)
    status, _ = request_api("GET", "/api/imoveis/99999")
    casos.append(("CT-05", "Consulta de imóvel inexistente (Erro 404)", 404, status, status == 404))

    # CT-06: Atualizar meta mensal (PUT /api/imoveis/1)
    status, _ = request_api(
        "PUT",
        "/api/imoveis/1",
        {
            "apelidoLocal": "Residência Dona Maria",
            "endereco": "Rua das Acácias, 142",
            "bairro": "Jardim Pantanal",
            "metaConsumoMensalLitros": 10000,
        },
    )
    casos.append(("CT-06", "Atualização de meta mensal do imóvel (PUT)", 200, status, status == 200))

    # CT-07: Sem token tentando DELETE restrito (Erro 401)
    status, _ = request_api("DELETE", "/api/imoveis/1")
    casos.append(("CT-07", "Rota protegida sem token JWT retorna 401 (Erro 401)", 401, status, status == 401))

    # CT-08: RBAC - Morador tentando DELETE restrito a ADMIN (Erro 403)
    status, _ = request_api("DELETE", "/api/imoveis/1", token=token_morador)
    casos.append(("CT-08", "Bloqueio RBAC: MORADOR tentando DELETE de ADMIN (Erro 403)", 403, status, status == 403))

    # CT-09: Gatilho 1 e 2 - Telemetria de madrugada gerando alerta de Vazamento Oculto (POST 201)
    status, body = request_api(
        "POST",
        "/api/leituras",
        {
            "codigoDispositivo": "GC-001",
            "dataHora": "2026-11-15T03:00:00Z",
            "pulsosUltimoMinuto": 1,
            "leituraAcumuladaLitros": 1234590,
            "intensidadeLuz": 0.18,
        },
    )
    casos.append(
        (
            "CT-09",
            "Telemetria óptica na madrugada disparando alerta automático (POST)",
            201,
            status,
            status == 201 and body.get("alertaGerado") is True,
        )
    )

    # CT-10: Confirmar reparo de alerta (PUT /api/alertas/1)
    status, body = request_api("PUT", "/api/alertas/1")
    casos.append(("CT-10", "Confirmar reparo de vazamento (PUT /api/alertas/1)", 200, status, status == 200 and body.get("resolvido") is True))

    aprovados = 0
    for cid, desc, esp, obt, ok in casos:
        icone = "PASS" if ok else "FAIL"
        if ok:
            aprovados += 1
        log(f"[{icone}] {cid} | {desc} | Esperado: {esp} | Obtido: {obt}")

    log("-" * 78)
    log(f"TOTAL EXECUTADO: {len(casos)} casos | APROVADOS: {aprovados}/{len(casos)}")
    log("=" * 78)

    out_path = os.path.join(os.path.dirname(__file__), "relatorio_execucao_testes.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(logs) + "\n")
    print(f"\n📄 Relatório salvo em: {out_path}")


if __name__ == "__main__":
    run_suite()
