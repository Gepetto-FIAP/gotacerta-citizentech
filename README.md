# 💧 Gota Certa

**Telemetria acessível para hidrômetros convencionais e detecção ágil de vazamentos**
FIAP · Global Solution 2026/2 · CitizenTech · Turma 3ESOA

> "Hoje o vazamento só aparece na conta. Com a Gota Certa, ele aparece no celular, no mesmo dia."

- **Vídeo pitch:** `[INSERIR LINK]`
- **Simulação do dispositivo no Wokwi:** https://wokwi.com/projects/480800487744010241

---

## 🔑 Usuários de teste

Todos usam a senha **`GotaCerta@2026`**.

| Perfil | E-mail | O que vê |
|---|---|---|
| **Morador (use este)** | **`maria.silva@email.com`** | Dona Maria: o próprio imóvel, consumo, meta e alertas |
| Gestor (ADMIN) | `admin@gotacerta.org.br` | Todos os imóveis, alertas e o painel por bairro |

> O login aceita até 10 tentativas por minuto. Depois disso, a API responde 429 por 1 minuto.

---

## ▶️ Como rodar

**Pré-requisitos:** [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) e [Node.js 20+](https://nodejs.org).

São 3 terminais, todos a partir da raiz do projeto. Para testar só o aplicativo, os dois primeiros bastam.

**Terminal 1: API** (cria e popula o banco SQLite sozinha na primeira execução)
```bash
cd backend/GotaCerta.Api
dotnet run
```

**Terminal 2: aplicativo**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3: simulador IoT** (Node-RED, que liga o dispositivo do Wokwi à API)
```bash
npm install -g --unsafe-perm node-red
node-red
```
1. Abra http://localhost:1880, vá em ☰ → **Import**, escolha o arquivo [`iot-simulator/node-red/flow_gotacerta.json`](./iot-simulator/node-red/flow_gotacerta.json) e clique em **Deploy**. O nó **Leituras do hidrômetro** deve mostrar **connected**.
2. Abra o dispositivo no Wokwi: https://wokwi.com/projects/480800487744010241 e clique em ▶. O ESP32 começa a enviar leituras a cada 5 segundos.

| O quê | Endereço |
|---|---|
| Aplicativo (mobile-first) | http://localhost:3000 |
| API: documentação Swagger | http://localhost:8080/swagger |
| Node-RED (simulador IoT) | http://localhost:1880 |

**Alternativa com Docker:** `docker compose up --build -d` sobe a API e o aplicativo nos mesmos endereços.

---

## ✅ Como testar (5 minutos)

### 1. Ver o painel do morador
1. Abra http://localhost:3000 e entre com **`maria.silva@email.com`** / **`GotaCerta@2026`**.
2. Veja a **vazão agora**, o **consumo do mês** em litros e reais, a **meta** e os alertas.
3. Use a navegação inferior para ver **Alertas**, **Histórico** e **Imóveis**. Para ver o layout de celular, abra o DevTools no modo de dispositivo móvel (390 px).

### 2. Simular um vazamento e ver o alerta chegar
Deixe o painel da Dona Maria aberto. A leitura do sensor é enviada à API, e o alerta aparece no app em até 4 segundos, sem recarregar a página.

1. Em http://localhost:8080/swagger, abra **`POST /api/leituras`** → **Try it out**. Essa rota não precisa de login, porque é a rota que o dispositivo usa.
2. Envie a leitura abaixo, que representa água passando às 3h da manhã:
   ```json
   { "codigoDispositivo": "GC-001", "dataHora": "2026-11-19T03:00:00", "pulsosRegistrados": 30, "vazaoInstantaneaLpm": 0.5 }
   ```
   A resposta traz `"alertaGerado": true` e `VAZAMENTO_OCULTO_MADRUGADA`.
3. No app aparece o aviso de **Possível vazamento oculto**. Em **Alertas**, toque em **Confirmar reparo**.

Para simular um **cano rompido**, envie uma vazão acima do limite do imóvel (20 L/min):
```json
{ "codigoDispositivo": "GC-001", "dataHora": "2026-11-19T14:00:00", "pulsosRegistrados": 2400, "vazaoInstantaneaLpm": 40 }
```

### 3. Ver o painel do gestor
Saia e entre com **`admin@gotacerta.org.br`** / **`GotaCerta@2026`**. O gestor vê os alertas e o consumo de **todos os bairros**.

### 4. Conferir a segurança
No Swagger, faça login em `POST /api/auth/login`, copie o `tokenJwt` e clique em **Authorize**.

| Teste | Resultado esperado |
|---|---|
| `GET /api/alertas` sem token | **401** |
| Dona Maria em `GET /api/imoveis/2/dashboard` (imóvel de outra pessoa) | **403** |
| Login com senha errada | **401** com "Credenciais inválidas" |

Mais detalhes em [`backend/seguranca.md`](./backend/seguranca.md).

### 5. Testes automatizados (opcional, requer Python 3)
Com a API rodando:
```bash
python tests-and-docs/test_api.py
```
O relatório é salvo em `tests-and-docs/relatorio_execucao_testes.txt`. O plano de testes está em [`tests-and-docs/PLANO_DE_TESTES.md`](./tests-and-docs/PLANO_DE_TESTES.md).

### 6. Banco de dados (scripts SQL)
```bash
sqlite3 gotacerta_manual.db < database/01_schema_seed.sql
sqlite3 -header -column gotacerta_manual.db < database/02_consultas_uso.sql
```
O script cria as 5 tabelas com as restrições e a carga inicial. O segundo arquivo roda as 5 consultas de uso. O diagrama ER está em [`database/README_DATABASE.md`](./database/README_DATABASE.md).

### 7. Provocar os alertas pelo simulador IoT
Com o terminal 3 rodando e o painel da Dona Maria aberto, faça isto no Wokwi:

| No Wokwi | Alerta no app |
|---|---|
| Apertar o botão **DESCARGA** nos primeiros 2 minutos | Vazamento oculto de madrugada |
| Girar o **REGISTRO** até o fim | Cano rompido |
| Subir o slider do **LDR** acima de 50 lux | Tampa violada (aparece na aba de debug do Node-RED) |

Sem o Wokwi, dá para testar só o Node-RED: clique nos nós **Teste sem Wokwi** do fluxo. Mais detalhes em [`iot-simulator/README_IOT.md`](./iot-simulator/README_IOT.md).

---

## 💡 Como funciona

**Problema:** 39,53% da água tratada no Brasil se perde antes de chegar às torneiras (Instituto Trata Brasil, 2026). Na maioria das casas, o hidrômetro é mecânico, e um vazamento escondido só aparece 30 dias depois, na conta.

**Solução:** um dispositivo **não invasivo**, preso por fora do vidro do hidrômetro que já existe. Nada é trocado e o lacre não é rompido. Um **LED infravermelho** ilumina o ponteiro de litros e um **fototransistor** conta cada volta (1 volta = 1 litro). A base científica é uma iniciação científica da Unicamp ([Perissinotto & Manera, 2019](https://econtents.sbu.unicamp.br/eventos/index.php/pibic/article/view/1923/1980)).

```
[Sensores no hidrômetro] → MQTT → [Node-RED] → POST /api/leituras → [API C# + 3 gatilhos] → [SQLite] → [App do morador e do gestor]
```

| Alerta | Quando dispara | Severidade |
|---|---|---|
| `VAZAMENTO_OCULTO_MADRUGADA` | Água passando entre 0h e 5h (a partir de 0,1 L/min, para pegar até descarga pingando) | Média |
| `CANO_ROMPIDO_PICO` | Vazão acima do limite do imóvel | Crítica |
| `META_MENSAL_ULTRAPASSADA` | Consumo do mês acima da meta definida pelo morador | Baixa |

O valor em reais é **estimado**: litros ÷ 1.000 × tarifa de exemplo de R$ 8,50/m³.

**ODS:** 6 (água potável e saneamento), 9 (inovação e infraestrutura), 11 (cidades sustentáveis) e 13 (ação climática).

---

## 🗂️ Estrutura

| Pasta | Parte do case | Tecnologia |
|---|---|---|
| [`database/`](./database) | 1 · Banco de dados | SQL (SQLite e MySQL), 5 tabelas, 5 consultas |
| [`backend/`](./backend) | 2 · API e 5 · Segurança | C# .NET 8, camadas Controller/Service/Repository, Swagger, BCrypt, JWT |
| [`tests-and-docs/`](./tests-and-docs) | 3 · Testes | Plano de testes, Postman, suíte em Python |
| [`frontend/`](./frontend) | 4 · Frontend | Next.js + Tailwind, mobile-first |
| [`iot-simulator/`](./iot-simulator) | 6 · IoT | ESP32 no Wokwi, MQTT (HiveMQ), Node-RED |

---

## 👥 Equipe

| Integrante | RM | Funcao |
|---|---|---|
| Antônio Schappo  | 556429 | Banco de dados e API |
| Luiz Gustavo | 558857 | IoT e telemetria |
| Vitória Davi | 556028 | Segurança |
| Daniel Tinois | 555798 | Frontend |
| João Bento | 559081 | Testes, documentação e vídeo |

---

## 🤖 Uso de IA generativa

Usamos ferramentas de IA generativa (Google Gemini / Antigravity IDE e Claude) como apoio para:
1. pesquisa bibliográfica, levantamento de referências do setor de saneamento e formatação do guia do grupo;
2. padronização de templates de documentação (README, roteiro de testes e documentação da API);
3. estrutura inicial do código e configuração do Docker.

Todo o código-fonte, as consultas SQL, as regras de negócio e os testes foram revisados, ajustados e validados pelos integrantes do grupo.
