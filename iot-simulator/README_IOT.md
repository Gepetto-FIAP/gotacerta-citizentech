# Simulação de IoT · Gota Certa

ESP32 no Wokwi → MQTT (HiveMQ) → Node-RED → `POST /api/leituras` → alertas no painel.

- **Wokwi:** https://wokwi.com/projects/480800487744010241
- **Como os sensores funcionam:** [`sensores.md`](./sensores.md)

## Como rodar

1. **API:** suba a API (veja o README principal). Ela precisa responder em `http://localhost:8080`.
2. **Node-RED:**
   ```bash
   npm install -g --unsafe-perm node-red
   node-red
   ```
   Abra `http://localhost:1880`, vá em ☰ → **Import**, escolha `node-red/flow_gotacerta.json` e clique em **Deploy**. O nó **Leituras do hidrômetro** deve mostrar **connected**.
3. **Wokwi:** abra o link acima e clique em ▶.

Para testar sem o Wokwi, clique nos nós **Teste sem Wokwi** do Node-RED e veja o resultado na aba de debug (🐞).

## Como provocar cada alerta

Escolha a casa na linha `#define CASA` do `sketch.ino`. No relógio simulado, 1 s real equivale a 2 min, e uma leitura sai a cada 5 s.

| Casa | O que fazer no Wokwi | Alerta |
|---|---|---|
| `1` (Dona Maria) | Apertar **DESCARGA** nos primeiros 2 min reais | `VAZAMENTO_OCULTO_MADRUGADA` |
| `1` (Dona Maria) | Girar o **REGISTRO** até o fim | `CANO_ROMPIDO_PICO` |
| `4` (Sr. João) | Girar o **REGISTRO** até o fim e esperar uns 45 s | `META_MENSAL_ULTRAPASSADA` |
| Qualquer | Subir o slider do **LDR** acima de 50 lux | `TAMPA_VIOLADA` (no Node-RED) |

Os alertas da casa 1 aparecem no painel com o login `maria.silva@email.com`.
