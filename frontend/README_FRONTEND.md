# Frontend Web Mobile-First — Gota Certa
**Painel do Cidadão e do Gestor (Next.js 14 + React 18 + Tailwind CSS 4)**

O painel mostra ao morador o consumo de água em litros e reais, a meta do mês e os alertas de vazamento. O gestor da comunidade acompanha os alertas e o consumo consolidado de todos os imóveis do bairro. Todas as telas leem e gravam dados pela API C# (`backend/`). É uma aplicação web responsiva, desenhada primeiro para o celular (`390 px`, com navegação inferior) e adaptada para tablet e desktop (menu lateral e layout em grade).

---

## 1. Como rodar

Pré-requisito: a API rodando em `http://localhost:8080` (veja o README principal: `dotnet run` ou `docker compose up backend-api`).

```bash
cd frontend
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Contas de teste (carga inicial do banco):

| Perfil | E-mail | Senha |
| :-- | :-- | :-- |
| Morador | `maria.silva@email.com` | `GotaCerta@2026` |
| Gestor (`ADMIN`) | `admin@gotacerta.org.br` | `GotaCerta@2026` |

Se a API estiver em outro endereço, crie `frontend/.env.local` com `NEXT_PUBLIC_API_URL=http://seu-endereco:porta`.

Scripts de verificação:

```bash
npm run lint       # ESLint (next/core-web-vitals)
npm run typecheck  # TypeScript sem erros
npm run build      # build de produção
```

---

## 2. Telas e endpoints consumidos

| Rota | Tela | Endpoints da API |
| :-- | :-- | :-- |
| `/login` | Entrar (e-mail + senha) | `POST /api/auth/login` |
| `/cadastro` | Criar conta de morador | `POST /api/auth/register` |
| `/painel` | **Dashboard do hidrômetro:** vazão agora (L/min), consumo do mês em litros e R$, barra da meta, projeção do mês, leitura do mostrador e alertas ativos | `GET /api/imoveis/{id}/dashboard` |
| `/alertas` | **Central de alertas:** filtros Ativos / Resolvidos / Todos, severidade e botão **Confirmar reparo** | `GET /api/alertas`, `PUT /api/alertas/{id}` |
| `/historico` | **Histórico:** gráfico de barras de litros por dia, com a meta diária e o dia de maior gasto | `GET /api/imoveis/{id}/historico` |
| `/imoveis` | **Imóveis:** lista, edição de dados e meta, sensores (adicionar e remover) e remover imóvel (exclusivo gestor) | `GET/PUT/DELETE /api/imoveis`, `POST/DELETE /api/sensores` |
| `/imoveis/novo` | **Cadastro de imóvel e hidrômetro:** o CEP preenche rua, bairro e cidade/UF (ViaCEP); opção de cadastrar o par de sensores `GC-xxx` + `GC-xxx-IR` | `POST /api/imoveis`, `POST /api/sensores`, ViaCEP |
| `/gestor` | **Visão do gestor:** totais, imóveis com alerta por gravidade e ranking de bairros | `GET /api/bairros/alertas` |

A navegação inferior muda pelo perfil: o morador visualiza Painel, Alertas, Histórico e Imóveis; o gestor recebe também a aba **Bairros**.

---

## 3. Arquitetura de Interface, Responsividade e Tratamento de Erros

* **Integração com a API (`src/lib/api.ts`):**
  * Envia automaticamente o token no header `Authorization: Bearer <token>` a partir da sessão salva no `localStorage` (`src/lib/sessao.ts`);
  * Aplica timeout de 10 s com `AbortController` e mensagens amigáveis quando o servidor está offline;
  * Exibe as mensagens de erro retornadas pela API (`{ erro }` ou `ValidationProblemDetails` do ASP.NET);
  * Quando uma rota protegida responde **401**, limpa a sessão e redireciona para `/login`.
* **Atualização em tempo real (*Polling*):**
  * O contexto `src/context/AlertasContext.tsx` e a tela `/painel` consultam a API a cada 4 segundos (pausando quando a aba está em segundo plano). Quando surge um alerta novo vindo do simulador IoT, um aviso imediato aparece na tela sem necessidade de recarregar a página.
* **Design Mobile-First e Acessibilidade:**
  * Abaixo de `768 px`: barra superior compacta e navegação inferior fixa. A partir de `768 px` (`md`): menu lateral. A partir de `1024 px` (`lg`): layout em 2 colunas.
  * Identidade visual inspirada no hidrômetro: mostrador com rolos pretos ($\text{m}^3$) e vermelhos (litros) e ponteiro girando proporcionalmente à vazão instantânea ($1\text{ volta} = 1\text{ litro}$), respeitando `prefers-reduced-motion`.
  * Tratamento completo dos 4 estados visuais em todas as telas: **carregando** (skeleton), **vazio**, **erro de conexão** (mantendo os últimos dados em cache na tela com aviso) e **sucesso** (toasts de confirmação).

---

## 4. Estrutura do código

```text
src/
├─ app/
│  ├─ layout.tsx              # HTML base, providers de login e avisos
│  ├─ page.tsx                # "/" → redireciona para /login, /painel ou /gestor
│  ├─ login/ e cadastro/      # telas públicas de autenticação
│  └─ (app)/                  # telas autenticadas (layout com cabeçalho e navegação)
│     ├─ painel/  alertas/  historico/  gestor/
│     └─ imoveis/ e imoveis/novo/
├─ context/
│  ├─ AuthContext.tsx         # sessão, entrar, cadastrar, sair
│  ├─ ImoveisContext.tsx      # imóveis do usuário e imóvel selecionado
│  ├─ AlertasContext.tsx      # polling de alertas a cada 4 s + notificação de alerta novo
│  └─ ToastContext.tsx        # avisos rápidos de sucesso/erro
├─ hooks/useDadosApi.ts       # busca + estados de carregando/erro/sucesso + polling
├─ lib/
│  ├─ api.ts                  # cliente HTTP por endpoint, token JWT e tratamento de erros
│  ├─ types.ts                # interfaces TypeScript alinhadas aos DTOs da API C#
│  ├─ formato.ts              # formatação de litros, reais, datas e rótulos de alertas
│  ├─ validacao.ts            # validação de formulários no cliente
│  └─ sessao.ts               # leitura/gravação da sessão no localStorage
└─ components/                # Mostrador, Navegacao, cartões, campos e estados visuais
```
