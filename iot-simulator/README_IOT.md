# Parte 6 · Simulação de IoT e telemetria do hidrômetro
**Gota Certa · FIAP Global Solution 2026/2 · Responsável: Luiz**

Um ESP32 simulado no **Wokwi** faz o papel do dispositivo Gota Certa, preso por fora do vidro do hidrômetro. Ele usa dois sensores:

- **Sensor 1 · Leitor óptico (LED infravermelho + fototransistor):** mede a água. O LED ilumina o ponteiro de litros e o fototransistor mede a luz que volta. Cada passagem do ponteiro é um pulso, e cada pulso é 1 litro.
- **Sensor 2 · LDR:** mede a luz dentro da caixa do dispositivo. Se entrar luz, a tampa foi aberta: possível fraude ou vandalismo. O ESP32 publica as leituras em JSON por **MQTT** no broker público **HiveMQ**. O **Node-RED** recebe e entrega na API (`POST /api/leituras`). A API avalia os 3 gatilhos e gera os alertas que aparecem no painel.

```
 [Wokwi: ESP32 + LED IR + LDR]  --MQTT-->  [HiveMQ]  --MQTT-->  [Node-RED]  --HTTP POST-->  [API C#]  -->  [SQLite]  -->  [Painel Next.js]
   conta as voltas do ponteiro             (correio)           (carteiro)                (3 gatilhos)
```

**Por que o Node-RED no meio?** O Wokwi roda na internet e não enxerga o `localhost` do seu computador. Por isso o ESP32 deixa a leitura no HiveMQ, que funciona como um correio público. O Node-RED roda no seu computador, busca a leitura lá e a entrega na API.

**O ESP32 não decide os alertas de água.** Ele só mede e envia. Quem compara cada leitura com as regras é a API (`Services.cs`, `ProcessarLeituraIoTAsync`). O alerta de tampa (Sensor 2) é decidido no Node-RED, que também manda para a API só os campos que ela conhece.

A explicação física dos sensores está em [`sensores.md`](./sensores.md).

| Arquivo | O que tem |
|---|---|
| `wokwi/sketch.ino` | Firmware do ESP32 em C++, em 5 blocos: configuração, sensor, água, envio MQTT e loop do Arduino |
| `wokwi/diagram.json` | Circuito: ESP32, LED IR, LED de pulso, LDR, potenciômetro (registro) e botão (descarga) |
| `wokwi/libraries.txt` | Biblioteca usada: `PubSubClient` (MQTT) |
| `node-red/flow_gotacerta.json` | Fluxo: HiveMQ → validação → POST na API → alertas, com fila se a API cair |
| `sensores.md` | Explicação dos sensores para o PDF da entrega |

---

## 1. Como rodar

### Passo 1 · Subir a API
Siga o README principal. Ela precisa responder em `http://localhost:8080`.

### Passo 2 · Abrir o Node-RED com o fluxo
1. Instale e abra o Node-RED (`npm install -g --unsafe-perm node-red` e depois `node-red`). Acesse `http://localhost:1880`.
2. Abra o menu (☰) e escolha **Import**. Selecione `node-red/flow_gotacerta.json`, clique em **Import** e depois em **Deploy**.
3. Embaixo do nó **Leituras do hidrômetro** deve aparecer **connected**, em verde.
4. Teste sem o Wokwi: clique no quadradinho do nó **Teste sem Wokwi (vazamento 02:30)**. Na aba de debug (🐞) aparece o alerta `VAZAMENTO_OCULTO_MADRUGADA`. Depois clique em **Teste sem Wokwi (tampa aberta)**: aparece `TAMPA_VIOLADA`.

Se a API estiver em outro endereço, abra o Node-RED assim: `API_BASE_URL=http://localhost:5000 node-red`.

### Passo 3 · Rodar o ESP32 no Wokwi
1. Em [wokwi.com](https://wokwi.com), crie um projeto **ESP32** novo.
2. Substitua o conteúdo de `sketch.ino` e `diagram.json` pelos arquivos da pasta `wokwi/`.
3. Na aba **Library Manager**, adicione `PubSubClient`.
4. Clique em ▶. O monitor serial mostra o Wi-Fi e o MQTT conectando.

---

## 2. Como provocar cada alerta

O relógio simulado anda rápido: **1 segundo real = 2 minutos**. A cada **5 segundos reais** (10 minutos simulados), o ESP32 publica uma leitura. Para mudar, edite `SEGUNDOS_ENTRE_ENVIOS` e `MINUTOS_POR_ENVIO` no topo do `sketch.ino`.

A casa que o ESP32 representa é escolhida na linha `#define CASA` do `sketch.ino`.

| Casa (`#define CASA`) | Começa às | O que fazer no Wokwi | Alerta na API |
|---|---|---|---|
| `1` · Dona Maria (`GC-001`) | 02:00 | Nada | Nenhum |
| `1` · Dona Maria | 02:00 | Apertar **DESCARGA** logo no começo, antes de 2 minutos reais (a madrugada termina às 06:00) | `VAZAMENTO_OCULTO_MADRUGADA` a cada leitura |
| `1` · Dona Maria | 02:00 | Girar o **REGISTRO** até o fim e esperar 5 s (60 L/min, e o limite da casa é 20) | `CANO_ROMPIDO_PICO` |
| `4` · Sr. João (`GC-004`) | 08:00 | Girar o **REGISTRO** até o fim e esperar uns 45 s (o consumo do mês passa de 9.000 L) | `META_MENSAL_ULTRAPASSADA` (junto com `CANO_ROMPIDO_PICO`, porque 60 L/min também passa do limite) |
| Qualquer | — | Subir o slider do **LDR** acima de 50 lux (abrir a tampa) | `TAMPA_VIOLADA` no Node-RED, uma vez só. A contagem de água continua certa, porque a histerese segura o ruído |

- O LED verde fica aceso enquanto o ponteiro está girando (pelo menos 1 litro contado na leitura).
- O LED vermelho "LED IR" é o Sensor 1: pisca a cada leitura.
- A Dona Maria é o login de teste do painel (`maria.silva@email.com`). Por isso os alertas de vazamento e de cano aparecem para ela no app.
- A meta da Dona Maria já está estourada no banco de teste, e a API não repete esse alerta enquanto o anterior não for resolvido. Por isso o alerta de meta é demonstrado na casa 4.

### O que aparece no monitor serial
```
Conectando ao HiveMQ... conectado!
>> Descarga pingando: LIGADA

[02:10] SENSOR 1: pulsos 3 | vazão 0.30 L/min | mostrador 1234585 L | luz mín 0.17 | LED piscou 119x
        SENSOR 2: 0 lux | tampa fechada
   ENVIADO para o HiveMQ
```

No Node-RED, embaixo do nó **Interpretar resposta**, aparece `🚨 02:10 VAZAMENTO_OCULTO_MADRUGADA`.

Se aparecer `sem conexão: N leitura(s) esperando na fila`, o ESP32 ainda não conectou ao HiveMQ. Ele tenta de novo a cada 3 s e envia a fila quando conseguir. Se nunca conectar, pare e rode o Wokwi de novo.

---

## 3. O JSON enviado

```json
{
  "codigoDispositivo": "GC-001",
  "dataHora": "2026-11-15T02:10:00",
  "pulsosRegistrados": 3,
  "vazaoInstantaneaLpm": 0.30,
  "leituraAcumuladaLitros": 1234585.0,
  "intensidadeLuz": 0.17,
  "luzExternaLux": 0,
  "tampaAberta": false
}
```

- **`pulsosRegistrados`:** voltas contadas nos últimos 10 minutos simulados.
- **`vazaoInstantaneaLpm`:** vazão média do intervalo (pulsos ÷ 10). O ESP32 envia esse campo porque, numa descarga pingando (0,33 L/min), o último minuto quase sempre tem 0 pulso. Se a API calculasse a vazão só pelo último minuto, o vazamento passaria despercebido.
- **`leituraAcumuladaLitros`:** leitura anotada na instalação + litros contados.
- **`intensidadeLuz`:** menor luz medida no intervalo, de 0 a 1. Abaixo de 0,40 significa que o ponteiro passou embaixo do sensor.
- **`luzExternaLux`** e **`tampaAberta`** (Sensor 2): luz dentro da caixa e se passou de 50 lux. O Node-RED usa esses dois campos e não os repassa para a API.

A rota `POST /api/leituras` é pública (o dispositivo não faz login), conforme a segurança da Vitória.

---

## 4. Robustez

- **Wi-Fi ou HiveMQ caiu:** o ESP32 guarda até 10 leituras numa fila. Ele tenta reconectar a cada 3 s e publica todas, em ordem, quando a conexão volta.
- **Wokwi mais lento que o tempo real:** o ESP32 avisa o HiveMQ que pode ficar até 60 s sem dar sinal (`setKeepAlive(60)`), para a conexão não cair à toa.
- **API fora do ar:** o Node-RED guarda a leitura numa fila e reenvia a cada 15 s. O nó fica vermelho com `API fora do ar · N na fila`.
- **Leitura rejeitada (400 ou 404):** não é reenviada, porque o problema está no dado. Aparece um aviso amarelo no Node-RED.
- **Mensagem que não é da Gota Certa no tópico:** é ignorada pela validação.

### Segurança
O HiveMQ público é aberto: qualquer pessoa que souber o tópico pode ler ou publicar nele. Para a demonstração isso basta, e o tópico tem um nome específico do grupo (`fiap/3esoa/gotacerta/leituras`). Num produto real, o certo seria:

- um broker com usuário e senha por dispositivo;
- conexão com TLS (porta 8883);
- a API conferir se o dispositivo é mesmo quem diz ser.

---

## 5. Testes realizados

O `sketch.ino` foi compilado no computador com imitações das bibliotecas do Arduino. O fluxo rodou num Node-RED 4 de verdade, com um broker MQTT local, contra uma réplica das regras do `POST /api/leituras` carregada com o `database/01_schema_seed.sql`.

| Teste | Resultado |
|---|---|
| Água parada, 1 minuto real (12 leituras) | 0 pulsos, LED piscou 10 vezes por leitura, nenhum alerta |
| Descarga pingando (casa 1) | 3 ou 4 pulsos por leitura (0,30 a 0,40 L/min); mostrador de 1.234.582 para 1.234.622 L em 2 h simuladas; 12 alertas de vazamento |
| Registro todo aberto (casa 1) | 600 pulsos e 60 L/min por leitura; 6 alertas de cano rompido em 30 s |
| Registro todo aberto (casa 4) | Alerta de meta na 9ª leitura, uns 45 s (319.600 L; consumo do mês acima de 9.000 L) |
| HiveMQ fora do ar por 15 s | Leituras na fila, enviadas em ordem ao reconectar |
| API desligada | 5 leituras guardadas pelo Node-RED e reenviadas quando a API subiu |
| Dispositivo `GC-999` | 404, aviso no Node-RED, não reenviado |
| Sensor 2: LDR a 2.209 lux por 10 s e depois de volta | 1 alerta `TAMPA_VIOLADA` (sem repetir); contagem de água continuou certa; a API recebeu só os campos dela |

O Wokwi em si roda no navegador e precisa ser testado lá. Antes da apresentação, repita os testes contra a API real e guarde prints do Wokwi, do Node-RED e do painel como evidência.
