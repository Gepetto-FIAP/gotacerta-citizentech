# 💧 GotaCerta — Telemetria Acessível para Hidrômetros e Combate ao Desperdício
**FIAP · Global Solution 2026/2 — CitizenTech (3º Ano Engenharia de Software · Turma 3ESOA)**
**Organização GitHub:** [https://github.com/Gepetto-FIAP](https://github.com/Gepetto-FIAP)

---

## 🎯 1. Visão Geral da Proposta (Critérios CitizenTech)

1. **Quem é o cidadão beneficiado:** Famílias de baixa renda, moradores de regiões sujeitas a rodízio/falta d'água, escolas públicas e pequenos comércios locais.
2. **Qual problema será resolvido:** No Brasil, quase 40% da água tratada é perdida em vazamentos, e 95%+ dos hidrômetros residenciais são analógicos/mecânicos e lacrados pela concessionária. O cidadão só descobre um vazamento oculto (em válvula de descarga, boia de caixa d'água ou tubulação subterrânea) **30 dias depois**, quando chega uma conta impagável, além de ficar sem aviso prévio quando a pressão da rede pública cai a zero no bairro.
3. **Como a solução funciona:** Inspirado em pesquisa de Iniciação Científica da **UNICAMP** ([Perissinotto & Manera, 2019](https://econtents.sbu.unicamp.br/eventos/index.php/pibic/article/view/1923/1980)), o **GotaCerta** acopla um sensor de pulso magnético/óptico **não-invasivo** por fora do visor da relojoaria do hidrômetro convencional (sem cortar canos nem violar o lacre) combinado a um sensor ultrassônico na caixa d'água. As leituras são enviadas via JSON para a nossa **API RESTful em C# ASP.NET Core 8**, que detecta anomalias em tempo real e alerta o morador na interface **Mobile-First**.
4. **Conexão com os ODS da ONU:**
   * **ODS 11 (Cidades e Comunidades Sustentáveis):** Redução de perdas hídricas urbanas e resiliência comunitária em crises de abastecimento.
   * **ODS 9 (Indústria, Inovação e Infraestrutura):** Modernização acessível de infraestrutura de medição legada com IoT de baixo custo.
   * **ODS 13 (Ação Contra a Mudança Global do Clima):** Adaptação a eventos extremos de seca e escassez hídrica.

---

## 👥 2. Integrantes do Grupo (Gepetto-FIAP) e Divisão

| Integrante | RM | Responsabilidade Principal no Projeto | Diretório Principal |
| :--- | :---: | :--- | :--- |
| **Antônio Aloísio Schappo Neto** | `556429` | **Parte 1 (Banco de Dados SQLite/MySQL)** & **Parte 2 (API RESTful C# .NET 8 + Docker)** | [`database/`](./database) e [`backend/`](./backend) |
| **Luiz** | `[PREENCHER]` | **Parte 6 (Simulação de IoT & Telemetria da Relojoaria do Hidrômetro)** | [`iot-simulator/`](./iot-simulator) |
| **Vitória** | `[PREENCHER]` | **Parte 5 (Segurança: Login com Hash PBKDF2, RBAC JWT e Proteção SQLi/XSS)** | [`backend/GotaCerta.Api/Services/`](./backend/GotaCerta.Api/Services) |
| **Danilo** | `[PREENCHER]` | **Parte 4 (Frontend Web Mobile-First em Next.js + Tailwind CSS)** | [`frontend/`](./frontend) |
| **João** | `[PREENCHER]` | **Parte 3 (Plano e Automação de Testes QA)**, Documentação PDF & **Vídeo Pitch** | [`tests-and-docs/`](./tests-and-docs) |

* **Link do Vídeo Pitch (Até 3 min):** `[INSERIR LINK PÚBLICO DO YOUTUBE/DRIVE AQUI]`

---

## 🗂️ 3. Arquitetura do Repositório (Um Único Domínio)

```text
globalsolution/
├── README.md                           # Este guia de execução completo
├── integrantes.txt                     # Identificação do grupo, RMs e link do Vídeo Pitch
├── docker-compose.yml                  # Orquestração Docker (MySQL 8, API .NET 8 e Frontend Next.js)
├── database/                           # [PARTE 1 - 2,0 pts] Modelo Relacional, Script SQL e 5 Consultas
│   ├── README_DATABASE.md              # Diagrama ER (5 entidades normalizadas)
│   ├── 01_schema_seed.sql              # CREATE TABLE + PK/FK/Constraints + INSERTs iniciais (SQLite)
│   ├── 01_schema_seed_mysql.sql        # Script compatível com MySQL 8 (Docker init)
│   └── 02_consultas_uso.sql            # 5 SELECTs reais com JOIN, GROUP BY, SUM, AVG, COUNT, MIN, MAX
├── backend/                            # [PARTE 2 - 4,0 pts & PARTE 5 - 2,0 pts] API RESTful C# .NET 8
│   ├── Dockerfile
│   └── GotaCerta.Api/
│       ├── Controllers/                # AuthController, ImoveisController, TelemetriaAlertasController
│       ├── Services/                   # AuthService (Hash PBKDF2 + JWT), TelemetriaService (Regras IoT)
│       ├── Repositories/               # ImovelRepository, SensorRepository, LeituraAlertaRepository
│       ├── Models/                     # Usuario, Imovel, SensorIoT, LeituraHidrometro, AlertaConsumo
│       ├── DTOs/                       # Validação estrita de entrada (DataAnnotations)
│       └── Data/                       # AppDbContext + DbInitializer (Auto-Seed)
├── iot-simulator/                      # [PARTE 6 - 2,0 pts] Simulador de Sensores IoT (Ref. PIBIC/UNICAMP)
│   ├── README_IOT.md                   # Explicação técnica dos sensores e gatilhos
│   └── simulator.py                    # Simula pulsos da relojoaria + ultrassônico e envia POST JSON
├── frontend/                           # [PARTE 4 - 3,0 pts] Interface Mobile-First (Next.js)
│   ├── README_FRONTEND.md
│   └── src/app/page.tsx                # 5 telas integradas à API (Login, Lista, Telemetria, Alertas, Cadastro)
└── tests-and-docs/                     # [PARTE 3 - 2,0 pts & PITCH - 5,0 pts] Testes, Postman e Roteiro
    ├── PLANO_DE_TESTES.md              # 10 casos de teste + Documentação de Segurança
    ├── postman_collection.json         # Coleção Postman pronta para importação
    ├── test_api.py                     # Script automatizado de testes gerando log de evidências
    └── ROTEIRO_PITCH_E_PDF.md          # Roteiro de 3 min do Pitch e checklist do PDF
```

---

## 🚀 4. Como Executar Cada Parte do Projeto (Passo a Passo)

### Opção 1 — Subindo Tudo com Docker Compose (Recomendado)
Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

* **Swagger da API RESTful (.NET 8):** [http://localhost:8080/swagger](http://localhost:8080/swagger)
* **Frontend Mobile-First (Next.js):** [http://localhost:3000](http://localhost:3000)
* **Banco MySQL 8:** porta `3306` (usuário `gotacerta`, senha `gotacerta123`, banco `gotacerta_db`) e **SQLite** persistido em volume Docker.

---

### Opção 2 — Executando Cada Parte Individualmente

#### Parte 1: Banco de Dados (`.sql`)
O script roda do início ao fim sem erros no SQLite3 (já pré-instalado no macOS/Linux) ou MySQL:
```bash
sqlite3 /tmp/gotacerta.db < database/01_schema_seed.sql
sqlite3 -header -column /tmp/gotacerta.db < database/02_consultas_uso.sql
```

#### Parte 2 e Parte 5: API RESTful C# (.NET 8) + Segurança JWT
```bash
cd backend/GotaCerta.Api
dotnet run --urls "http://localhost:8080"
```
* Acesse a documentação interativa **Swagger** em `http://localhost:8080/swagger`.
* Ou importe o arquivo [`tests-and-docs/postman_collection.json`](./tests-and-docs/postman_collection.json) no Postman.
* **Credenciais de Teste (Seed Inicial):**
  * **Perfil Morador:** `maria.silva@email.com` | Senha: `GotaCerta@2026`
  * **Perfil Administrador (`ADMIN`):** `admin@gotacerta.org.br` | Senha: `GotaCerta@2026`

#### Parte 6: Simulação de IoT (Hidrômetro Relojoaria + Ultrassônico)
Com a API rodando em `http://localhost:8080`, abra outro terminal e rode:
```bash
python3 iot-simulator/simulator.py --mode demo
```
O script enviará leituras simuladas para `POST /api/leituras` e exibirá no terminal os alertas disparados automaticamente na aplicação.

#### Parte 3: Execução Automatizada do Plano de Testes
Com a API rodando em `http://localhost:8080`, execute:
```bash
python3 tests-and-docs/test_api.py
```
O relatório de evidências é gerado automaticamente em `tests-and-docs/relatorio_execucao_testes.txt`.

#### Parte 4: Frontend Mobile-First (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Acesse `http://localhost:3000`.

---

## 🤖 5. Declaração de Uso de IA Generativa (Regra Obrigatória — Pág. 15 do Edital)

Em conformidade com as diretrizes de integridade acadêmica da FIAP para a Global Solution 2026/2, declaramos que ferramentas de Inteligência Artificial Generativa (**Google Gemini / Antigravity IDE**) foram utilizadas **exclusivamente como apoio** para:
1. **Pesquisa e Ideação Inicial:** Estruturação do brainstorming temático alinhado aos ODS da ONU e ao estudo de telemetria de hidrômetros da UNICAMP (PIBIC).
2. **Padronização de Templates e Revisão Textual:** Organização dos templates de documentação Markdown (`README.md`, estrutura do Plano de Testes e roteiro cronometrado do Pitch).
3. **Apoio de Boilerplate e Explicação de Configurações:** Geração de estrutura base de configuração Docker (`docker-compose.yml`) e revisão de sintaxe SQL/C#, sendo todo o código-fonte, regras de negócio, modelagem de dados e testes integralmente revisados, compreendidos e validados pelos 5 integrantes do grupo.
