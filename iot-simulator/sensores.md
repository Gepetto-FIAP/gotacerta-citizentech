# Os sensores da Gota Certa
**Simulação de IoT**

Este texto responde ao critério de explicação da Parte 6: **qual sensor, o que mede e como influencia o sistema**. 

---

## 1. A ideia em uma frase

O dispositivo tem **dois sensores com funções diferentes**:

- o **Sensor 1** mede a água;
- o **Sensor 2** protege o próprio medidor.

O Sensor 1 não mede água diretamente: ele **conta voltas**. O ponteiro de litros do hidrômetro (o reloginho marcado `x0,0001`) dá uma volta completa a cada 1 litro. Um leitor óptico colado por fora do vidro percebe cada passagem do ponteiro. Contando as passagens, sabemos quanta água passou.

O princípio é o mesmo do projeto de iniciação científica da Unicamp que fez a telemetria de hidrômetros sem interface elétrica, sensoriando a relojoaria com um par óptico (Perissinotto e Manera, 2019).

---

## 2. Os dois sensores

| | Sensor 1 · Leitor óptico (LED infravermelho + fototransistor) | Sensor 2 · LDR (luz externa) |
|---|---|---|
| **O que mede** | Intensidade da luz refletida pelo reloginho, de 0,0 a 1,0. Vira voltas do ponteiro, ou seja, litros | Luz que entra na caixa do dispositivo, em lux |
| **Como funciona** | O LED ilumina o ponteiro; o fototransistor mede quanta luz volta. Fundo branco reflete muito, ponteiro reflete pouco | A caixa é fechada e escura (cerca de 5 lux). Se passar de **50 lux**, a tampa foi aberta |
| **Campos no JSON** | `pulsosRegistrados`, `vazaoInstantaneaLpm`, `leituraAcumuladaLitros`, `intensidadeLuz` | `luzExternaLux`, `tampaAberta` |
| **Decisão que gera** | Na API: `VAZAMENTO_OCULTO_MADRUGADA`, `CANO_ROMPIDO_PICO` e `META_MENSAL_ULTRAPASSADA` | No Node-RED: `TAMPA_VIOLADA`, um aviso de possível fraude ou vandalismo |
| **Por que importa** | O cidadão descobre o desperdício antes da conta chegar | Mexer no medidor é um problema real das companhias de água. O alerta também avisa que a leitura do Sensor 1 pode estar sendo atrapalhada |

O LED e o fototransistor formam **um único sensor**: um emite a luz, o outro mede. É o mesmo tipo de peça que se compra pronta como módulo (por exemplo, o TCRT5000).

**Como a luz vira um pulso:**

- O fundo branco do mostrador reflete muita luz: o fototransistor lê cerca de **0,82**.
- O ponteiro vermelho reflete pouca: quando ele passa embaixo do sensor, a leitura cai para cerca de **0,18**.
- Cada queda é **1 pulso = 1 volta = 1 litro**.

```
luz que volta
 0,82  ▇▇▇▇▇▇▇▇▇▇      ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇      ▇▇▇▇
 0,18            ▁▁▁▁                  ▁▁▁▁
                 +1 L                  +1 L
```

O sensor fica sobre a marca "5" do reloginho e enxerga o ponteiro quando ele está a até 10° dessa marca.

### Como os dois sensores aparecem no Wokwi

O Wokwi não tem um fototransistor nem um hidrômetro prontos para usar. Por isso o circuito em `wokwi/diagram.json` representa cada parte assim:

| Peça no Wokwi | Representa | O que o código faz com ela |
|---|---|---|
| LED vermelho "LED IR" (pino 26) | Sensor 1, a parte que emite (LED infravermelho) | Pisca a cada leitura |
| Código `lerFototransistor()` | Sensor 1, a parte que mede (fototransistor) | Calcula a luz refletida: 0,82 no fundo branco, 0,18 no ponteiro, mais ruído |
| Módulo LDR (pino 35) | **Sensor 2** | Mede os lux de verdade (fórmula da documentação do Wokwi). Acima de 50 lux, `tampaAberta = true`. A luz que entra também é somada como ruído na leitura do Sensor 1 (no máximo 0,15) |
| Potenciômetro "registro" (pino 34) | A torneira: não é sensor, é o "mundo" que o dispositivo observa | Define a vazão, de 0 a 60 L/min, que faz o ponteiro girar |
| Botão "descarga" (pino 14) | Uma descarga com defeito: também é o "mundo" | Liga ou desliga 0,33 L/min a mais |
| LED verde (pino 27) | Saída de diagnóstico | Fica aceso enquanto o ponteiro está girando |

O LDR começa em 5 lux, com a caixa fechada. Para "abrir a tampa" na demonstração, suba o slider dele.

A contagem usa histerese, amostragem adaptativa e fator de calibração, explicados a seguir.

---

## 3. Dois cuidados que o dispositivo toma

**Histerese (dois limiares).** Um pulso só é contado quando a luz cai abaixo de **0,40**, e o leitor só se "rearma" quando ela volta acima de **0,60**. Com um único limiar, o ruído elétrico perto dele faria a mesma passagem do ponteiro ser contada duas vezes.

**Amostragem adaptativa (economia de bateria).** O LED pisca a cada 10° de giro do ponteiro, ou seja, 36 vezes por volta. Como o ponteiro fica visível por 20° (±10°), ele nunca passa sem ser visto. Sem água passando, uma leitura por minuto basta. No Wokwi, a cada 10 minutos simulados o LED pisca 10 vezes com a água parada, cerca de 120 com a descarga pingando e mais de 20 mil com o registro todo aberto. O projeto da Unicamp usou a mesma ideia: o sensor fica ligado só o tempo necessário para o sinal estabilizar.

Na instalação, o dispositivo lê uma vez a posição do ponteiro, sem contar isso como pulso, e alguém anota o número do mostrador.

---

## 4. Do pulso ao dado que a API usa

| Grandeza | Unidade | Como é calculada | Campo enviado |
|---|---|---|---|
| Pulsos no intervalo | voltas | Quedas de luz contadas | `pulsosRegistrados` |
| Vazão | L/min | pulsos × fator de calibração ÷ minutos do intervalo | `vazaoInstantaneaLpm` |
| Volume acumulado | litros | leitura da instalação + pulsos × fator | `leituraAcumuladaLitros` |
| Consumo do mês | litros | volume atual − menor volume do mês (calculado pela API) | — |
| Valor estimado | R$ | consumo ÷ 1.000 × tarifa por m³ (calculado pela API) | — |

O **fator de calibração** (`fator_calibracao_pulsos_litro`) existe porque nem todo hidrômetro tem 1 litro por volta. Ele fica cadastrado para cada sensor.

**Exemplo:** leitura na instalação de 1.234.582 L. Em 30 minutos de descarga pingando, o sensor conta 10 pulsos. A vazão é 10 ÷ 30 = **0,33 L/min** e a nova leitura é **1.234.592 L**, igual ao mostrador.

---

## 5. Como os dados influenciam o sistema

A cada leitura, a API avalia três gatilhos com os dados do Sensor 1, e o Node-RED avalia um com os dados do Sensor 2:

| Gatilho | Condição | Alerta | Severidade | O que o cidadão faz |
|---|---|---|---|---|
| Cano rompido | Vazão acima do limite do imóvel (`limite_vazao_alerta_lpm`, ex.: 45 L/min na escola) | `CANO_ROMPIDO_PICO` | CRITICA | Fecha o registro e chama o encanador na hora |
| Vazamento oculto | Vazão de pelo menos 0,1 L/min entre 0h e 5h | `VAZAMENTO_OCULTO_MADRUGADA` | MEDIA | Confere a descarga e a boia da caixa |
| Meta do mês | Consumo do mês acima da meta do imóvel | `META_MENSAL_ULTRAPASSADA` | BAIXA | Revê o consumo antes da conta chegar |
| Tampa violada (Sensor 2) | Luz dentro da caixa acima de 50 lux | `TAMPA_VIOLADA` (no Node-RED) | — | A companhia confere o medidor; o cidadão sabe que alguém mexeu |

**Por que olhar a madrugada:** entre 0h e 5h quase ninguém usa água. Se o ponteiro continua girando nesse horário, há água passando sem ninguém usar. Uma descarga pingando perde cerca de 20 litros por hora (0,33 L/min), e o limite de 0,1 L/min foi escolhido para não deixar esse caso passar.

---

## 6. Como seria o dispositivo real

| Aspecto | Solução |
|---|---|
| Energia | Microcontrolador que dorme quase o tempo todo, bateria de longa duração e, onde o hidrômetro pega sol, um painel solar pequeno |
| Fixação | Por fora do vidro, com abraçadeira de aço inox e parafuso antivandalismo, sem abrir o hidrômetro nem romper o lacre |
| Transmissão | Publicação MQTT, como no Wokwi; se a conexão cair, o dispositivo guarda as leituras e reenvia depois (a fila do ESP32 faz isso). Num produto, broker com senha por dispositivo e TLS |
| Memória | Guarda a própria leitura do mostrador e uma fila de leituras não enviadas (no ESP32, até 10) |

---

## 7. Limitações conhecidas

- **Um par óptico não sabe o sentido do giro.** Com dois pares lado a lado, defasados, daria para detectar fluxo reverso, uma fraude conhecida.
- **Luz do sol pode atrapalhar.** A carcaça precisa bloquear a luz externa; no Wokwi, o slider do LDR controla quanta luz de fora entra como ruído.
- **O vidro envelhece e embaça,** o que reduz o contraste entre fundo e ponteiro. Os limiares precisariam ser recalibrados de tempos em tempos.
- **O Sensor 2 só percebe luz.** Quem abrir a tampa no escuro, à noite, não é detectado. Um interruptor magnético na tampa (reed switch) resolveria isso no produto real.

---

## 8. Robustez da simulação

- **Wi-Fi ou HiveMQ caiu:** o ESP32 guarda até 10 leituras numa fila. Ele tenta reconectar a cada 3 s e publica todas, em ordem, quando a conexão volta.
- **Wokwi mais lento que o tempo real:** o ESP32 avisa o HiveMQ que pode ficar até 60 s sem dar sinal (`setKeepAlive(60)`), para a conexão não cair à toa.
- **API fora do ar:** o Node-RED guarda a leitura numa fila e reenvia a cada 15 s.
- **Leitura rejeitada (400 ou 404):** não é reenviada, porque o problema está no dado.
- **Mensagem que não é da Gota Certa no tópico:** é ignorada pela validação.
- **Segurança:** o HiveMQ público é aberto, e qualquer pessoa que souber o tópico (`fiap/3esoa/gotacerta/leituras`) pode ler ou publicar nele. Para a demonstração isso basta. Num produto real, seriam necessários um broker com usuário e senha por dispositivo, conexão com TLS (porta 8883) e a API conferindo se o dispositivo é mesmo quem diz ser.

## 9. Testes realizados

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

---

## Referência

PERISSINOTTO, Lucas da Silva; MANERA, Leandro Tiago. Projeto de um sistema para aquisição de dados de medidores volumétricos residenciais (hidrômetros) com telemetria, aplicando o conceito de IoT. *Revista dos Trabalhos de Iniciação Científica da UNICAMP*, Campinas, n. 27, 2019. Disponível em: https://econtents.sbu.unicamp.br/eventos/index.php/pibic/article/view/1923/1980
