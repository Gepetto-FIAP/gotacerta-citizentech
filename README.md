# 💧 Gota Certa — Telemetria Acessível para Hidrômetros Convencionais e Detecção Ágil de Vazamentos
**FIAP · Global Solution 2026/2 — CitizenTech (3º Ano Engenharia de Software · Turma 3ESOA)**
**Organização GitHub:** [https://github.com/Gepetto-FIAP](https://github.com/Gepetto-FIAP)

> **"Não trocamos o hidrômetro. Ensinamos ele a falar."**
> *"Hoje o vazamento só aparece na conta. Com a Gota Certa, ele aparece no celular, no mesmo dia."*

---

## 🛠️ Guia Rápido para os Integrantes do Grupo
👉 **Leia primeiro:** [**`GUIA_MODIFICACOES_EQUIPE.md`**](./GUIA_MODIFICACOES_EQUIPE.md) — explica exatamente o que já está implementado na base e o que **Luiz, Vitória, Danilo e João** devem revisar, personalizar e commitar em suas respectivas pastas!

---

## 🎯 1. Visão Geral da Proposta (Critérios CitizenTech)

1. **Quem é o cidadão beneficiado:** Moradores (que acompanham o consumo em litros e reais estimados, definem meta mensal e recebem alerta imediato de vazamento) e Gestores comunitários/municipais de pequenas cidades.
2. **Qual problema será resolvido (com dados auditados):**
   * **39,53%** da água tratada no Brasil é perdida antes de chegar às torneiras (*Instituto Trata Brasil, 2026 / dados 2024*) — volume suficiente para abastecer **77 milhões de pessoas**.
   * Enquanto grandes companhias como a **Sabesp** investem **R\$ 3,8 bilhões** para trocar 4,4 milhões de hidrômetros por modelos NB-IoT ($\approx \text{R\$ } 860\text{ por imóvel}$), centenas de municípios menores, escolas e comunidades ficam de fora. Nessas casas com hidrômetros mecânicos, uma descarga com defeito ou cano enterrado vazando só é descoberto **30 dias depois, quando chega a conta**.
3. **Como a solução funciona:** Baseada em pesquisa de Iniciação Científica da **UNICAMP** ([Perissinotto & Manera, 2019](https://econtents.sbu.unicamp.br/eventos/index.php/pibic/article/view/1923/1980)), a **Gota Certa** acopla um módulo óptico **não-invasivo** por cima do vidro do hidrômetro existente (sem cortar canos e sem romper o lacre):
   * **Sensor 1 (`LED_IR`):** Ilumina o ponteiro vermelho de litros ($\times 0{,}0001\text{ m}^3$, onde $1\text{ volta} = 1\text{ litro}$).
   * **Sensor 2 (`FOTOTRANSISTOR`):** Mede a luz refletida (`intensidadeLuz`) e conta cada passagem do ponteiro como **1 pulso (1 litro)**.
   * Os dados vão via HTTP POST JSON para a nossa **API RESTful em C# (.NET 8)**, que avalia **3 gatilhos automáticos** (`VAZAMENTO_OCULTO_MADRUGADA`, `CANO_ROMPIDO_PICO` e `META_MENSAL_ULTRAPASSADA`) e notifica o cidadão no painel **Mobile-First**.
4. **Conexão com os ODS da ONU:**
   * **ODS 6 (Água Potável e Saneamento):** Redução direta de perdas hídricas e uso eficiente da água.
   * **ODS 11 (Cidades e Comunidades Sustentáveis):** Serviço acessível para comunidades e pequenas cidades.
   * **ODS 9 (Indústria, Inovação e Infraestrutura):** Modernização da medição (*retrofit*) sem descartar os equipamentos existentes.
   * **ODS 13 (Ação Contra a Mudança Global do Clima):** Consumo consciente e adaptação à escassez hídrica.

---

## 👥 2. Equipe (Gepetto-FIAP) e Responsabilidades

| Integrante | RM | Papel & Parte do Case | Diretório Principal |
| :--- | :---: | :--- | :--- |
| **Antônio Aloísio Schappo Neto** | `556429` | **Parte 1 (Banco SQLite/MySQL)** + **Parte 2 (API RESTful C# .NET 8 e Docker)** | [`database/`](./database) e [`backend/`](./backend) |
| **Luiz** | `[PREENCHER]` | **Parte 6 (Engenharia de IoT e Telemetria Óptica do Hidrômetro)** | [`iot-simulator/`](./iot-simulator) |
| **Vitória** | `[PREENCHER]` | **Parte 5 (Segurança da Informação: BCrypt, JWT, RBAC e OWASP)** | [`backend/GotaCerta.Api/`](./backend/GotaCerta.Api) |
| **Danilo** | `[PREENCHER]` | **Parte 4 (Frontend Web Mobile-First em Next.js + Tailwind)** | [`frontend/`](./frontend) |
| **João** | `[PREENCHER]` | **Parte 3 (QA: Plano e Automação de Testes)**, Docs & **Vídeo Pitch** | [`tests-and-docs/`](./tests-and-docs) |

* **Link do Vídeo Pitch (Até 3 min):** `[INSERIR LINK PÚBLICO DO YOUTUBE/DRIVE AQUI]`

---

## 🔌 3. Os 14 Endpoints da API ("O Acordo entre as Partes" — Pág. 14)

| Método | Rota | Descrição | Quem Usa |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Criar conta (senha salva em hash **BCrypt**) | Tela de cadastro |
| `POST` | `/api/auth/login` | Autenticar e receber token **JWT Bearer** | Tela de login |
| `GET` | `/api/imoveis` | Listar imóveis/hidrômetros monitorados | Dashboard |
| `GET` | `/api/imoveis/{id}` | Detalhes de um imóvel, sensores e alertas | Detalhe |
| `POST` | `/api/imoveis` | Cadastrar novo imóvel e hidrômetro | Tela de cadastro |
| `PUT` | `/api/imoveis/{id}` | Alterar dados e meta mensal de consumo | Tela de cadastro |
| `DELETE` | `/api/imoveis/{id}` | Remover imóvel *(Requer perfil `ADMIN`)* | Admin / Cadastro |
| `GET` / `POST` | `/api/sensores` | Listar ou registrar sensor (`LED_IR` / `FOTOTRANSISTOR`) | Cadastro / Simulador |
| `DELETE` | `/api/sensores/{id}` | Remover sensor | Tela de cadastro |
| `GET` / `POST` | `/api/leituras` | Receber telemetria JSON e disparar os **3 gatilhos** | Simulador do Luiz |
| `GET` | `/api/imoveis/{id}/dashboard` | Vazão (L/min), consumo no mês (L e R\$) e meta | Dashboard do Danilo |
| `GET` | `/api/imoveis/{id}/historico` | Consumo por dia para gráficos | Histórico do Danilo |
| `GET` | `/api/alertas` | Listar alertas gerados | Central de alertas |
| `PUT` | `/api/alertas/{id}` | Confirmar reparo (`resolvido = true`) | Central de alertas |
| `GET` | `/api/bairros/alertas` | Alertas e consumo consolidado por bairro | Painel do Gestor |

---

## 🚀 4. Como Executar o Projeto

### Passo 1 — Banco de Dados (`.sql` puro — Parte 1)
```bash
sqlite3 /tmp/gotacerta_manual.db < database/01_schema_seed.sql
sqlite3 -header -column /tmp/gotacerta_manual.db < database/02_consultas_uso.sql
```

### Passo 2 — API RESTful C# (.NET 8) + SQLite Automático (Partes 2 e 5)
```bash
cd backend/GotaCerta.Api
dotnet run --urls "http://localhost:8080"
```
* **Swagger UI:** [http://localhost:8080/swagger](http://localhost:8080/swagger)
* **Logins de Teste (Seed):**
  * Morador: `maria.silva@email.com` | Senha: `GotaCerta@2026`
  * Gestor (`ADMIN`): `admin@gotacerta.org.br` | Senha: `GotaCerta@2026`

### Passo 3 — Frontend Mobile-First (Next.js — Parte 4)
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
* **App Mobile-First:** [http://localhost:3000](http://localhost:3000)

### Passo 4 — Simulador IoT e Testes Automatizados (Partes 6 e 3)
Com a API rodando em `http://localhost:8080`, em um 3º terminal:
```bash
# Simular os 4 modos dos sensores ópticos (Normal, Vazamento Madrugada, Cano Rompido e Meta Estourada):
python3 iot-simulator/simulator.py --mode demo

# Executar os 10 casos de teste automatizados da API e gerar o relatório de evidências:
python3 tests-and-docs/test_api.py
```

### Opção Alternativa — Subir Tudo com Docker Compose
```bash
docker compose up --build -d
```

---

## 🤖 5. Declaração de Uso de IA Generativa (Página 15 do Edital)

Em conformidade com as regras da Global Solution 2026/2, declaramos o uso de ferramentas de IA Generativa (**Google Gemini / Antigravity IDE** e **Claude**) como apoio para:
1. Pesquisa bibliográfica, levantamento de benchmarks do setor de saneamento e formatação visual do Guia do Grupo.
2. Padronização de templates de documentação (`README.md`, roteiro de testes e contratos OpenAPI/Swagger).
3. Apoio na estruturação inicial de boilerplate e configuração Docker, sendo todo o código-fonte, queries SQL, regras de negócio e testes integralmente revisados, ajustados e validados pelos 5 integrantes do grupo.
