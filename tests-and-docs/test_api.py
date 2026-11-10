#!/usr/bin/env python3
"""
FIAP - Global Solution 2026/2 - CitizenTech (3ESOA)
Projeto GotaCerta - Suíte Automatizada de Testes de API (Parte 3 - João)
Executa 8+ casos de teste (incluindo casos de erro 400, 401, 403, 404) e gera
relatório de evidências para o PDF da entrega.
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

    log("=" * 76)
    log(f"RELATÓRIO DE EXECUÇÃO DE TESTES AUTOMATIZADOS - GOTACERTA API")
    log(f"Data/Hora UTC: {datetime.datetime.now(datetime.timezone.utc).isoformat()}")
    log(f"Target URL:    {API_BASE}")
    log("=" * 76)

    casos = []

    # CT-01: Login válido (MORADOR)
    status, body = request_api(
        "POST", "/api/auth/login", {"email": "maria.silva@email.com", "senha": "GotaCerta@2026"}
    )
    token_morador = body.get("tokenJwt", "")
    casos.append(("CT-01", "Login seguro com credenciais válidas (MORADOR)", 200, status, status == 200 and bool(token_morador)))

    # CT-02: Login inválido (Caso de Erro 401)
    status, _ = request_api(
        "POST", "/api/auth/login", {"email": "maria.silva@email.com", "senha": "SenhaIncorreta999"}
    )
    casos.append(("CT-02", "Bloqueio de login com senha incorreta (Erro 401)", 401, status, status == 401))

    # CT-03: Registro inválido (Caso de Erro 400)
    status, _ = request_api(
        "POST", "/api/auth/register", {"nome": "A", "email": "invalido", "senha": "123"}
    )
    casos.append(("CT-03", "Validação de entrada no cadastro (Erro 400)", 400, status, status == 400))

    # CT-04: Listar imóveis (GET 200)
    status, body = request_api("GET", "/api/imoveis")
    casos.append(("CT-04", "Listagem de imóveis e hidrômetros (GET)", 200, status, status == 200 and isinstance(body, list)))

    # CT-05: Buscar imóvel inexistente (Caso de Erro 404)
    status, _ = request_api("GET", "/api/imoveis/99999")
    casos.append(("CT-05", "Consulta de imóvel inexistente (Erro 404)", 404, status, status == 404))

    # CT-06: Atualizar imóvel (PUT 200)
    status, _ = request_api(
        "PUT",
        "/api/imoveis/1",
        {
            "apelidoLocal": "Residência Dona Maria",
            "metaConsumoMensalLitros": 11800,
            "capacidadeCaixaLitros": 1000,
            "moradoresAtendidos": 4,
        },
    )
    casos.append(("CT-06", "Atualização de meta do imóvel (PUT)", 200, status, status == 200))

    # CT-07: RBAC - Morador tentando DELETE restrito a ADMIN (Caso de Erro 403)
    status, _ = request_api("DELETE", "/api/imoveis/1", token=token_morador)
    casos.append(("CT-07", "Bloqueio RBAC: MORADOR tentando DELETE de ADMIN (Erro 403)", 403, status, status == 403))

    # CT-08: Telemetria IoT gerando alerta automático de Cano Rompido (POST 201)
    status, body = request_api(
        "POST",
        "/api/leituras",
        {
            "codigoDispositivo": "ESP32-UNICAMP-REED-002",
            "pulsosRegistrados": 3600,
            "vazaoInstantaneaLpm": 60.0,
            "volumeAcumuladoLitros": 70000.0,
            "nivelCaixaPercentual": 40.0,
            "pressaoRuaBar": 1.8,
        },
    )
    casos.append(
        (
            "CT-08",
            "Telemetria IoT disparando alerta automático na API (POST)",
            201,
            status,
            status == 201 and body.get("alertaGerado") is True,
        )
    )

    aprovados = 0
    for cid, desc, esp, obt, ok in casos:
        icone = "PASS" if ok else "FAIL"
        if ok:
            aprovados += 1
        log(f"[{icone}] {cid} | {desc} | Esperado: {esp} | Obtido: {obt}")

    log("-" * 76)
    log(f"TOTAL EXECUTADO: {len(casos)} casos | APROVADOS: {aprovados}/{len(casos)}")
    log("=" * 76)

    out_path = os.path.join(os.path.dirname(__file__), "relatorio_execucao_testes.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(logs) + "\n")
    print(f"\n📄 Relatório salvo em: {out_path}")


if __name__ == "__main__":
    run_suite()
