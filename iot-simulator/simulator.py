#!/usr/bin/env python3
"""
FIAP - Global Solution 2026/2 - CitizenTech (3ESOA)
Projeto GotaCerta - Simulador de Telemetria IoT para Hidrômetros (Parte 6)
Responsável: Luiz

Baseado no artigo PIBIC/UNICAMP (Perissinotto & Manera, 2019):
Simula o sensoriamento não-invasivo acoplado à relojoaria do hidrômetro
(Sensor 1: Pulsos Magnéticos/Ópticos -> Vazão L/min e Volume Acumulado)
combinado ao Sensor 2 (Ultrassônico de Nível da Caixa d'Água + Pressão da Rede).
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
    print(f"\n[IoT -> API] Enviando payload JSON para {url}:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(f"[API -> IoT] Status HTTP {resp.status}:")
            print(json.dumps(body, indent=2, ensure_ascii=False))
            if body.get("alertaGerado"):
                print(
                    f"🚨 [ALERTA DISPARADO NA APLICAÇÃO] Tipo: {body.get('tipoAlertaGerado')} | "
                    f"Mensagem: {body.get('mensagemAlerta')}"
                )
            else:
                print("✅ [STATUS NORMAL] Nenhum alerta disparado.")
            return body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"❌ [ERRO HTTP {e.code}] {err_body}")
        return {}
    except Exception as e:
        print(f"⚠️ [FALHA DE CONEXÃO COM A API] ({e})")
        print("Dica: Certifique-se de que a API C# está rodando em", api_url)
        return {}


def obter_cenarios():
    agora_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    madrugada_iso = datetime.datetime.now(datetime.timezone.utc).replace(
        hour=3, minute=15, second=0, microsecond=0
    ).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "normal": {
            "titulo": "Cenário 1: Consumo Residencial Normal (Dona Maria)",
            "payload": {
                "codigoDispositivo": "ESP32-UNICAMP-REED-001",
                "pulsosRegistrados": 36,
                "vazaoInstantaneaLpm": 6.0,
                "volumeAcumuladoLitros": 15264.0,
                "nivelCaixaPercentual": 84.0,
                "pressaoRuaBar": 2.1,
                "dataHoraLeitura": agora_iso,
            },
        },
        "vazamento-madrugada": {
            "titulo": "Cenário 2: Vazamento Oculto Contínuo às 03h15 da Manhã (Sensor Relojoaria)",
            "payload": {
                "codigoDispositivo": "ESP32-UNICAMP-REED-001",
                "pulsosRegistrados": 168,
                "vazaoInstantaneaLpm": 2.8,
                "volumeAcumuladoLitros": 15432.0,
                "nivelCaixaPercentual": 79.5,
                "pressaoRuaBar": 2.0,
                "dataHoraLeitura": madrugada_iso,
            },
        },
        "cano-rompido": {
            "titulo": "Cenário 3: Surto de Vazão / Cano Rompido na Escola Pública (EMEI Luz do Saber)",
            "payload": {
                "codigoDispositivo": "ESP32-UNICAMP-REED-002",
                "pulsosRegistrados": 3720,
                "vazaoInstantaneaLpm": 62.0,
                "volumeAcumuladoLitros": 69330.0,
                "nivelCaixaPercentual": 41.0,
                "pressaoRuaBar": 1.7,
                "dataHoraLeitura": agora_iso,
            },
        },
        "falta-dagua": {
            "titulo": "Cenário 4: Queda de Pressão na Rua + Caixa d'Água Crítica (Sensor Ultrassônico)",
            "payload": {
                "codigoDispositivo": "ESP32-SONAR-CAIXA-001",
                "pulsosRegistrados": 12,
                "vazaoInstantaneaLpm": 2.0,
                "volumeAcumuladoLitros": 15444.0,
                "nivelCaixaPercentual": 14.5,
                "pressaoRuaBar": 0.0,
                "dataHoraLeitura": agora_iso,
            },
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Simulador de Telemetria IoT GotaCerta (Hidrômetro Relojoaria + Ultrassônico)"
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help=f"URL base da API RESTful (padrão: {DEFAULT_API_URL})",
    )
    parser.add_argument(
        "--mode",
        choices=["demo", "normal", "vazamento-madrugada", "cano-rompido", "falta-dagua"],
        default="demo",
        help="Cenário de simulação a ser enviado para a API",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="Intervalo em segundos entre envios no modo demo",
    )

    args = parser.parse_args()
    cenarios = obter_cenarios()

    print("=" * 72)
    print("💧 GOTACERTA IoT TELEMETRY SIMULATOR (Ref. PIBIC/UNICAMP)")
    print("Sensores: [1] Pulso Relojoaria Hidrômetro | [2] Ultrassônico Caixa d'Água")
    print("=" * 72)

    if args.mode == "demo":
        for chave, item in cenarios.items():
            print(f"\n>>> Executando {item['titulo']}...")
            enviar_telemetria(args.api_url, item["payload"])
            time.sleep(args.delay)
    else:
        item = cenarios[args.mode]
        print(f"\n>>> Executando {item['titulo']}...")
        enviar_telemetria(args.api_url, item["payload"])


if __name__ == "__main__":
    main()
