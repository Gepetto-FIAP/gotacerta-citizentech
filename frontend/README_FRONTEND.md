# Parte 4 de 6 — Frontend Web Mobile-First (3,0 pontos)
**Projeto Gota Certa — painel do cidadão (Next.js 14 + React 18 + Tailwind CSS 4)**
*Responsável: Danilo*

O painel mostra ao morador o consumo de água em litros e reais, a meta do mês e os alertas de vazamento. O gestor
da comunidade vê os alertas e o consumo de todos os imóveis do bairro. Todas as telas leem e gravam pela API C#
(`backend/`). É um web app responsivo, pensado primeiro para o celular (390 px, navegação inferior) e que se
abre em tablet e computador (menu lateral e telas em grade).

---

## 1. Como rodar

Pré-requisito: a API rodando em `http://localhost:8080` (veja o README principal: `dotnet run` ou
`docker compose up backend-api`).

```bash
cd frontend
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Contas de teste (do seed do banco):

| Perfil | E-mail | Senha |
| :-- | :-- | :-- |
| Morador | `maria.silva@email.com` | `GotaCerta@2026` |
| Gestor (`ADMIN`) | `admin@gotacerta.org.br` | `GotaCerta@2026` |

Se a API estiver em outro endereço, crie `frontend/.env.local` com `NEXT_PUBLIC_API_URL=http://seu-endereco:porta`.

Verificações usadas antes de entregar:

```bash
npm run lint       # ESLint (next/core-web-vitals)
npm run typecheck  # TypeScript sem erros
npm run build      # build de produção
```

---

## 2. Telas e endpoints usados

| Rota | Tela | Endpoints da API |
| :-- | :-- | :-- |
| `/login` | Entrar (e-mail + senha) | `POST /api/auth/login` |
| `/cadastro` | Criar conta de morador | `POST /api/auth/register` |
| `/painel` | **Dashboard do hidrômetro:** vazão agora (L/min), consumo do mês em litros e R$, barra da meta, projeção do mês, leitura do mostrador e alertas ativos | `GET /api/imoveis/{id}/dashboard` |
| `/alertas` | **Central de alertas:** filtros Ativos / Resolvidos / Todos, severidade e botão **Confirmar reparo** | `GET /api/alertas`, `PUT /api/alertas/{id}` |
| `/historico` | **Histórico:** gráfico de barras de litros por dia, com a meta diária e o dia de maior gasto | `GET /api/imoveis/{id}/historico` |
| `/imoveis` | **Imóveis:** lista, edição de dados e meta, sensores (adicionar e remover) e remover imóvel (só gestor) | `GET/PUT/DELETE /api/imoveis`, `POST/DELETE /api/sensores` |
| `/imoveis/novo` | **Cadastro de imóvel e hidrômetro:** o CEP preenche e trava rua, bairro e cidade/UF (ViaCEP); a pessoa digita só número e complemento. Opcional: o sensor `GC-xxx` + `GC-xxx-IR` | `POST /api/imoveis`, `POST /api/sensores`, ViaCEP |
| `/gestor` | **Visão do gestor:** totais, imóveis com alerta por gravidade e ranking de bairros | `GET /api/bairros/alertas` |

A navegação inferior muda pelo perfil: o morador tem Painel, Alertas, Histórico e Imóveis; o gestor ganha a aba
**Bairros**.

---

## 3. Como o frontend atende os critérios do case

**Telas funcionais.** São 8 rotas; as 5 telas pedidas no cartão (login/cadastro, dashboard, alertas, histórico e
cadastro de imóvel) mais a visão do gestor.

**Integração com a API e erros de conexão.** Todas as chamadas passam por `src/lib/api.ts`, que:
- envia o token no header `Authorization: Bearer <token>`;
- desiste depois de 10 s (timeout) e avisa "a API demorou demais";
- transforma falha de rede em "Sem conexão com a API" e mostra a mensagem que a API mandar (`{ erro }` ou os erros
  de validação do ASP.NET);
- quando uma rota protegida responde **401**, limpa a sessão e volta para o login ("sua sessão expirou").

**Layout responsivo, legível e com feedback.**
- Mobile-first: o CSS base é o do celular e os prefixos do Tailwind (`sm:`, `md:`, `lg:`) só acrescentam espaço.
  Abaixo de 768 px: barra no topo e navegação inferior. A partir de 768 px (`md`): menu lateral. A partir de
  1024 px (`lg`): painel, alertas, histórico, imóveis e bairros em 2 colunas.
- Endereço pelo CEP: ao completar os 8 dígitos, o app consulta o ViaCEP (`src/lib/cep.ts`), preenche rua, bairro
  e cidade/UF e trava esses campos (com cadeado). Se o CEP não existir ou o ViaCEP estiver fora do ar, os campos
  destravam para preencher à mão. Na edição, o endereço só aparece, porque a API não permite trocar o CEP.
- Ícones da biblioteca Lucide (`lucide-react`), centralizados em `src/components/Icone.tsx`.
- Identidade visual tirada do hidrômetro: azul-petróleo do mostrador, vermelho do ponteiro de litros (alerta
  crítico) e latão do corpo do medidor (alerta médio). O painel abre com o mostrador (rolos pretos = m³,
  vermelhos = litros) e o ponteiro de litros girando na velocidade real da vazão (1 volta = 1 litro). Quem ativa
  "reduzir movimento" no sistema vê o ponteiro parado.
- Os 4 estados em todas as telas: **carregando** (esqueleto animado), **vazio** (com o próximo passo), **erro**
  (com "Tentar de novo") e **sucesso** (avisos rápidos como "Reparo confirmado").
- Se a API cair com a tela aberta, os últimos dados continuam na tela com um aviso amarelo.
- Campos com rótulo, mensagem de erro ligada ao campo (`aria-describedby`), alvos de toque de 44 px ou mais e
  fonte de 16 px nos campos (evita o zoom automático do iPhone).

---

## 4. Saiba responder (perguntas da banca, pág. 20 do guia)

**Onde o token fica guardado e como vai em cada requisição?**
No `localStorage` do navegador (`src/lib/sessao.ts`), junto com nome, perfil e validade. A função `requisicao` em
`src/lib/api.ts` lê o token e coloca `Authorization: Bearer <token>` em toda chamada. Token vencido é descartado
ao abrir o app, e um 401 da API desloga o usuário.

**O que a tela faz se a API cair?**
Sem dados ainda: mostra "Não foi possível carregar" com o botão "Tentar de novo". Com dados na tela: mantém os
últimos valores e mostra o aviso "Sem conexão com a API… mostrando os últimos dados recebidos". O polling continua
tentando e o aviso some sozinho quando a API volta.

**Como o valor em reais é calculado?**
`valor = litros ÷ 1.000 × tarifa por m³` (pág. 5 do guia). A API calcula com a tarifa de exemplo de R$ 8,50/m³
(`TelemetriaService`), e o painel deixa claro que é um **valor estimado**.

**Por que mobile-first?**
O morador consulta o consumo e recebe o alerta no celular, inclusive de madrugada. Desenhar primeiro para a tela
pequena obriga a priorizar o que importa (vazão agora, alerta e meta). Telas maiores só ganham espaço: o gestor,
que acompanha vários imóveis, costuma usar o computador, e lá as mesmas telas aparecem em grade com menu lateral.

**Como o painel fica sabendo de um alerta novo?**
Por *polling*: a cada 4 s o app consulta `GET /api/alertas` (`src/context/AlertasContext.tsx`). Quando aparece um
id que ainda não conhecia, mostra o aviso "Novo alerta: …" e atualiza o contador na aba Alertas, em qualquer tela.
O painel também consulta o dashboard a cada 4 s. O polling para quando a aba do navegador está escondida.

**O que muda entre a tela do morador e a do gestor?**
O morador vê só os próprios imóveis e alertas. O gestor (`ADMIN`) vê todos os imóveis, tem a aba **Bairros** e é o
único que pode remover um imóvel (a API exige o perfil `ADMIN` no `DELETE /api/imoveis/{id}`).

---

## 5. Estrutura do código

```
src/
├─ app/
│  ├─ layout.tsx              # HTML base, providers de login e avisos
│  ├─ page.tsx                # "/" → manda para /login, /painel ou /gestor
│  ├─ login/ e cadastro/      # telas sem login
│  └─ (app)/                  # telas que exigem login (layout com cabeçalho e navegação)
│     ├─ painel/  alertas/  historico/  gestor/
│     └─ imoveis/ e imoveis/novo/
├─ context/
│  ├─ AuthContext.tsx         # sessão, entrar, cadastrar, sair
│  ├─ ImoveisContext.tsx      # imóveis do usuário e imóvel selecionado
│  ├─ AlertasContext.tsx      # polling de alertas a cada 4 s + aviso de alerta novo
│  └─ ToastContext.tsx        # avisos rápidos de sucesso/erro
├─ hooks/useDadosApi.ts       # busca + carregando/erro/sucesso + polling
├─ lib/
│  ├─ api.ts                  # uma função por endpoint, token e tratamento de erros
│  ├─ types.ts                # tipos iguais aos DTOs da API C#
│  ├─ formato.ts              # litros, reais, datas e textos dos alertas
│  ├─ validacao.ts            # mesmas regras dos DTOs (validação antes de enviar)
│  └─ sessao.ts               # leitura/gravação da sessão no localStorage
└─ components/                # Mostrador (rolos + ponteiro de litros), Navegacao (inferior e lateral), cartões, campos, estados
```

---

## 6. Observações para o time

- **Data dos alertas (Antônio):** a API grava `dataGeracao` com `DateTime.UtcNow`, mas devolve sem o `Z`
  (ex.: `2026-11-13T02:02:53`). O frontend trata esse valor como UTC (`dataUtc` em `src/lib/formato.ts`). Se a API
  passar a mandar o `Z`, continua funcionando. Leituras enviadas sem `dataHora` também caem em UTC e podem aparecer
  no dia seguinte no histórico depois das 21h.
- **Regra do dono (Vitória):** enquanto a API não filtra por dono, o frontend pede `GET /api/imoveis?usuarioId=` e
  filtra os alertas pelos imóveis do morador. Quando a regra do dono entrar na API, nada precisa mudar aqui: o token
  já vai em todas as chamadas, e um 403 vira a mensagem "Seu perfil não tem permissão para esta ação".
