# Parte 6 de 6 — Simulação de IoT & Telemetria de Hidrômetros (2,0 Pontos)
**Projeto GotaCerta — Telemetria Não-Invasiva Acoplada à Relojoaria de Hidrômetros**
*Responsável principal: Luiz*

---

## 1. Embasamento Científico (Artigo PIBIC/UNICAMP)

A arquitetura de sensoriamento do **GotaCerta** é diretamente inspirada no estudo de Iniciação Científica desenvolvido na **UNICAMP**:
> **Referência:** PERISSINOTTO, Lucas da Silva; MANERA, Leandro Tiago. *"Projeto de um sistema para aquisição de dados de medidores volumétricos residenciais (hidrômetros) com telemetria, aplicando o conceito de IoT"*. Revista dos Trabalhos de Iniciação Científica da UNICAMP, Campinas, n. 27, 2019. Disponível em: https://econtents.sbu.unicamp.br/eventos/index.php/pibic/article/view/1923/1980

### Por que essa abordagem é ideal para uma CitizenTech?
Mais de 95% dos hidrômetros residenciais e escolares no Brasil são **medidores mecânicos convencionais** sem interface digital nativa. Como o hidrômetro é lacrado pela concessionária de saneamento, o cidadão não pode cortar a tubulação nem substituir o aparelho.
A solução acopla sensores **externamente sobre a cúpula da relojoaria do hidrômetro**, capturando cada giro do ponteiro de litros sem violar o lacre do medidor e com custo acessível (< R\$ 60 por kit com ESP32).

---

## 2. Qual sensor, o que mede e como influencia o sistema (Critério 03 — 0,5 pt)

| Sensor Simulado | Hardware de Referência | O que Mede (Grandezas) | Como Influencia o Sistema (Gatilhos de Decisão na API) |
| :--- | :--- | :--- | :--- |
| **Sensor 1: Leitor de Pulsos da Relojoaria do Hidrômetro** (`ESP32-UNICAMP-REED-001`) | **Reed Switch / Efeito Hall `A3144`** ou **Óptico Reflexivo `TCRT5000`** posicionado sobre o ponteiro magnético de $1\text{ L}$ da relojoaria | • `pulsosRegistrados` (giros do ponteiro)<br>• `vazaoInstantaneaLpm` ($\text{L/min}$)<br>• `volumeAcumuladoLitros` ($\text{L}$ totais do medidor) | 1. **Detecção de Vazamento Oculto Noturno:** Se houver giro contínuo ($\ge 0,4\text{ L/min}$) entre `01h` e `05h` da manhã, a API dispara alerta `VAZAMENTO_OCULTO_MADRUGADA` (boia ou descarga com defeito).<br>2. **Detecção de Cano Rompido / Pico:** Se a vazão ultrapassar o `limiteVazaoAlertaLpm` do imóvel, dispara alerta `CANO_ROMPIDO_PICO` (`CRITICA`). |
| **Sensor 2: Ultrassônico de Reservatório + Pressão de Entrada** (`ESP32-SONAR-CAIXA-001`) | **Ultrassônico Impermeável `JSN-SR04T` (`HC-SR04`)** na tampa da caixa d'água + Transdutor na entrada | • `nivelCaixaPercentual` ($0\%$ a $100\%$)<br>• `pressaoRuaBar` ($\text{bar}$ na rede pública) | 3. **Alerta de Risco de Desabastecimento:** Se `pressaoRuaBar <= 0.1 bar` ou `nivelCaixaPercentual <= 20%`, dispara alerta `CAIXA_DAGUA_CRITICA` / `FALTA_DAGUA_BAIRRO` avisando os moradores para economizarem água. |

---

## 3. Como Executar o Simulador IoT (Critério 01 e 02 — 1,5 pt)

Com a API rodando em `http://localhost:8080`, execute na raiz do projeto:

```bash
# Executa a demonstração completa dos 4 cenários (Normal, Vazamento Madrugada, Cano Rompido e Falta d'Água):
python3 iot-simulator/simulator.py --mode demo

# Ou simule um cenário específico durante a gravação do Vídeo Pitch:
python3 iot-simulator/simulator.py --mode cano-rompido
python3 iot-simulator/simulator.py --mode vazamento-madrugada
python3 iot-simulator/simulator.py --mode falta-dagua
```
