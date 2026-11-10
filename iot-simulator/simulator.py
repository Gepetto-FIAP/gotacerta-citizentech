#!/usr/bin/env python3
"""
FIAP - Global Solution 2026/2 - CitizenTech (3ESOA)
Projeto Gota Certa - Simulador de Telemetria IoT para Hidrômetros (Parte 6)
Responsável: Luiz (Páginas 6, 7, 8, 9, 14 e 18 do Guia do Grupo)

Simula o par óptico acoplado sobre o vidro da relojoaria do hidrômetro:
- Sensor 1: LED_IR (emissor infravermelho que ilumina o ponteiro vermelho x0,0001)
- Sensor 2: FOTOTRANSISTOR (mede a luz refletida 'intensidadeLuz' e conta cada volta = 1 pulso = 1 L)
"""

import argparse
import datetime
import json
import os
import time
import urllib.error
import urllib.request

DEFAULT_API_URL = os.environ.get("API_BASE_URL", "http://localhost:8080")


def enviar_telemetria(api_url: str, payload: dict) -> dict:
    url = f"{api_url.rstrip('/')}/api/leituras"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    print(f"\n[IoT -> API] POST {url}")
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"[API -> IoT] HTTP {resp.status}:")
            print(json.dumps(body, indent=2, ensure_ascii=False))
            if body.get("alertaGerado"):
                print(
                    f"🚨 [ALERTA CRIADO] Tipos: {body.get('tiposAlertasGerados')} | "
                    f"{body.get('mensagemResumo')}"
                )
            else:
                print("✅ [NORMAL] Nenhum gatilho disparado.")
            return body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"❌ [ERRO HTTP {e.code}] {err_body}")
        return {}
    except Exception as e:
        print(f"⚠️ [SEM CONEXÃO COM A API] ({e})")
        return {}


def obter_cenarios():
    agora_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    madrugada_iso = datetime.datetime.now(datetime.timezone.utc).replace(
        hour=3, minute=0, second=0, microsecond=0
    ).strftime("%Y-%m-%dT%H:%M:%S")

    return {
        "normal": {
            "titulo": "Modo 1: Consumo Normal Durante o Dia (Fundo branco reflete luz alta = 0.82)",
            "payload": {
                "codigoDispositivo": "GC-001",
                "dataHora": agora_iso,
                "pulsosUltimoMinuto": 4,
                "leituraAcumuladaLitros": 1228500.0,
                "intensidadeLuz": 0.82,
            },
        },
        "vazamento-madrugada": {
            "titulo": "Modo 2: Vazamento Oculto às 03h00 da Manhã (Ponteiro passando sem parar, luz cai p/ 0.18)",
            "payload": {
                "codigoDispositivo": "GC-001",
                "dataHora": madrugada_iso,
                "pulsosUltimoMinuto": 1,
                "leituraAcumuladaLitros": 1230300.0,
                "intensidadeLuz": 0.18,
            },
        },
        "cano-rompido": {
            "titulo": "Modo 3: Surto de Vazão / Cano Rompido na Escola (60 voltas/min > limite de 45 L/min)",
            "payload": {
                "codigoDispositivo": "GC-002",
                "dataHora": agora_iso,
                "pulsosUltimoMinuto": 60,
                "leituraAcumuladaLitros": 546000.0,
                "intensidadeLuz": 0.15,
            },
        },
        "meta-estourada": {
            "titulo": "Modo 4: Consumo Acumulado no Mês Ultrapassa a Meta Mensal (Gatilho 3)",
            "payload": {
                "codigoDispositivo": "GC-003",
                "dataHora": agora_iso,
                "pulsosUltimoMinuto": 8,
                "leituraAcumuladaLitros": 822500.0,
                "intensidadeLuz": 0.78,
            },
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Simulador de Telemetria Óptica Gota Certa (LED IR + Fototransistor)"
    )
    parser.add_argument("--api-url", default=DEFAULT_API_URL)
    parser.add_argument(
        "--mode",
        choices=["demo", "normal", "vazamento-madrugada", "cano-rompido", "meta-estourada"],
        default="demo",
    )
    parser.add_argument("--delay", type=float, default=1.5)

    args = parser.parse_args()
    cenarios = obter_cenarios()

    print("=" * 74)
    print("💧 GOTA CERTA — SIMULADOR DE TELEMETRIA ÓPTICA (LED IR + FOTOTRANSISTOR)")
    print("=" * 74)

    if args.mode == "demo":
        for _, item in cenarios.items():
            print(f"\n>>> {item['titulo']}")
            enviar_telemetria(args.api_url, item["payload"])
            time.sleep(args.delay)
    else:
        item = cenarios[args.mode]
        print(f"\n>>> {item['titulo']}")
        enviar_telemetria(args.api_url, item["payload"])


if __name__ == "__main__":
    main()
