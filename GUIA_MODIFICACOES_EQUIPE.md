# 🛠️ Guia da Equipe: O que já está pronto e o que cada integrante deve revisar, evoluir e commitar
**Projeto Gota Certa — FIAP Global Solution 2026/2 (Turma 3ESOA)**

Este documento conecta o **Guia do Grupo (PDF de 27 páginas preparado pelo Luiz)** ao código-base deste repositório.

> [!IMPORTANT]
> **Por que deixamos um código-base funcional em todas as pastas?**
> Para que ninguém fique travado esperando outra parte para testar! Você já pode clonar o repositório, subir a API e ver o fluxo ponta a ponta funcionando hoje.
> **Porém, atenção às 2 regras de ouro do edital (Páginas 2, 16 e 26):**
> 1. **Commits de todos no GitHub (Diferencial de Campeão):** Cada integrante deve criar sua branch (ou fazer commits diretos com seu usuário do GitHub) evoluindo, personalizando e documentando a própria parte.
> 2. **Domínio total do código:** Ninguém pode entregar código sem entender e revisar. Abaixo está o roteiro exato do que cada pessoa deve revisar e modificar na sua pasta!

---

## ✅ O que já está fechado na Parte do Antônio (`database/` e `backend/`)

A base de Banco de Dados e API RESTful já foi atualizada para refletir **100% as Páginas 9, 13 e 14 do Guia do Grupo**:

1. **As 5 Tabelas da Página 13 (`database/01_schema_seed.sql` e `01_schema_seed_mysql.sql`):**
   * `usuarios` (`id`, `nome`, `email`, `senha_hash`, `perfil` [`MORADOR` | `ADMIN`], `criado_em`)
   * `imoveis` (`id`, `usuario_id`, `apelido_local`, `endereco`, `bairro`, `cep`, `numero_serie_hidrometro`, `meta_consumo_mensal_litros`) *(sem caixa d'água e sem pressão, exatamente como na pág. 13)*
   * `sensores_iot` (`id`, `imovel_id`, `codigo_dispositivo`, `tipo_sensor` [`LED_IR` | `FOTOTRANSISTOR`], `fator_calibracao_pulsos_litro`, `limite_vazao_alerta_lpm`, `status_ativo`)
   * `leituras_hidrometro` (`id`, `sensor_id`, `pulsos_registrados`, `vazao_instantanea_lpm`, `volume_acumulado_litros`, `intensidade_luz`, `data_hora_leitura`)
   * `alertas_consumo` (`id`, `imovel_id`, `leitura_id`, `tipo_alerta`, `severidade`, `mensagem`, `desperdicio_estimado_litros`, `resolvido`, `data_geracao`)
2. **As 5 Consultas SQL da Página 13 (`database/02_consultas_uso.sql`):**
   * Consulta 1: Consumo total (litros) e custo estimado (R\$) por imóvel no mês (`JOIN` de 4 tabelas, `MAX - MIN`).
   * Consulta 2: Ranking de bairros com mais alertas e volume desperdiçado (`JOIN`, `COUNT`, `SUM`, `GROUP BY`).
   * Consulta 3: Média de vazão na madrugada (02h às 05h) por hidrômetro (`JOIN`, `AVG`, `HAVING > 0.30`).
   * Consulta 4: Imóveis que passaram da meta de consumo no mês (`JOIN`, `GROUP BY`, `HAVING`).
   * Consulta 5: Total de leituras e alertas por tipo de sensor (`JOIN` de 3 tabelas, `COUNT`).
3. **Os 14 Endpoints da Página 14 (`backend/GotaCerta.Api/Controllers/ApiControllers.cs`):**
   * Todos os 14 endpoints sugeridos na página 14 já estão no ar e documentados no Swagger (`http://localhost:8080/swagger`).

---

## 📋 Roteiro de Modificações por Integrante (Cartões das Páginas 18 a 21)

---

### 🟢 1. Luiz — Engenharia de IoT e Telemetria (`iot-simulator/`)
**Referência:** Cartão da Página 18 + Páginas 6 a 10 do Guia.

* **O que já está na pasta `iot-simulator/` como base:**
  * [`simulator.py`](./iot-simulator/simulator.py): Envia um disparo único para cada um dos 4 modos (`normal`, `vazamento-madrugada`, `cano-rompido`, `meta-estourada`) no formato JSON da página 14 (`codigoDispositivo`, `dataHora`, `pulsosUltimoMinuto`, `leituraAcumuladaLitros`, `intensidadeLuz`).
* **O que você (Luiz) deve revisar, modificar e commitar:**
  1. **Relógio Simulado Acelerado (ex.: 60x) para a Demo do Vídeo:**
     * Hoje o `simulator.py` manda apenas 1 leitura estática por modo. Evolua o modo `vazamento-madrugada` para simular a passagem do tempo (ex.: começando às `02:00`, mandando leituras a cada 1 segundo no terminal representando intervalos de 15 minutos até `04:00`), mostrando o LED infravermelho acendendo, a `intensidadeLuz` caindo de `0.82` (fundo branco) para `0.18` (ponteiro vermelho passando) e os pulsos somando no acumulado!
  2. **Simulação de Múltiplos Imóveis / Bairros:**
     * Adicionar uma opção (ex.: `--mode bairro`) que envia leituras para os dispositivos `GC-001`, `GC-002`, `GC-003` e `GC-004` em sequência para popular o painel do gestor com dados ricos.
  3. **Criar o arquivo `iot-simulator/sensores.md`:**
     * Conforme listado no seu cartão (pág. 18), documentar a explicação física do `LED_IR` + `FOTOTRANSISTOR`, a tabela de conversão de pulsos em `L/min` e `m³` (pág. 6) e a visão do dispositivo real (bateria + abraçadeira inox da pág. 10).

---

### 🟣 2. Vitória — Segurança da Informação e Autenticação (`backend/GotaCerta.Api/`)
**Referência:** Cartão da Página 19 + Página 10 (Ideia Extra de Leitura Assinada).

* **O que já está no código da API como base:**
  * [`PasswordHasher` e `AuthService`](./backend/GotaCerta.Api/Services/Services.cs): Cadastro e login já usam **BCrypt (`BCrypt.Net-Next`, workFactor 11)** e geram o **Token JWT Bearer** com a claim `Role` (`MORADOR` ou `ADMIN`).
  * A rota `DELETE /api/imoveis/{id}` já exige `[Authorize(Roles = "ADMIN")]`.
* **O que você (Vitória) deve revisar, modificar e commitar:**
  1. **Proteger as Rotas pela "Regra do Dono" (Broken Access Control — OWASP):**
     * No arquivo [`ApiControllers.cs`](./backend/GotaCerta.Api/Controllers/ApiControllers.cs), hoje qualquer pessoa consegue chamar `GET /api/imoveis/{id}/dashboard` ou `PUT /api/imoveis/{id}`.
     * Adicione `[Authorize]` e valide a claim `ClaimTypes.NameIdentifier` (ID do usuário logado no JWT): se o perfil for `MORADOR` e o `imovel.UsuarioId != usuarioLogadoId`, retorne **`403 Forbidden` (`Forbid()`)**! Se for `ADMIN` (Gestor), pode acessar todos os imóveis do bairro. *(Isso cumpre o item "Morador acessando imóvel de outro recebe 403" do seu checklist da pág. 19!)*
  2. **Opcional / Diferencial (Página 10 e 19): Leitura Assinada (HMAC) ou Rate Limit no Login:**
     * Validar um header opcional `X-Device-Signature` no `POST /api/leituras` ou contador de tentativas de login.
  3. **Criar o arquivo `backend/seguranca.md`:**
     * Conforme seu cartão (pág. 19), documentar onde estão no código: o hash BCrypt, o JWT, a regra do dono (401 vs 403) e a tabela das práticas OWASP (SQL Injection via EF Core parametrizado, XSS e DataAnnotations), com os exemplos de requisições bloqueadas para o PDF.

---

### 🟠 3. Danilo — Frontend Mobile-First (`frontend/`)
**Referência:** Cartão da Página 20 + Páginas 5 e 14 do Guia.

* **O que já está na pasta `frontend/` como base:**
  * [`src/app/page.tsx`](./frontend/src/app/page.tsx): Esqueleto funcional em Next.js + Tailwind com largura de celular (`max-w-md` / 390px), barra de navegação inferior e integração básica com as rotas da API.
* **O que você (Danilo) deve revisar, modificar e commitar:**
  1. **Guardar o Token JWT e enviá-lo no Header `Authorization`:**
     * Guardar o `tokenJwt` recebido no login (em estado/`localStorage`) e enviá-lo como `Authorization: Bearer <token>` nas chamadas de `GET /api/imoveis`, `POST /api/imoveis`, `PUT /api/alertas/{id}` e `DELETE /api/imoveis/{id}` (para interagir com a proteção da Vitória!).
  2. **Atualização Automática dos Alertas (Polling leve de 3s a 5s):**
     * No seu checklist da página 20 está: *"O alerta do simulador aparece sem recarregar à mão"*. Adicione um `setInterval` de `4000ms` no `useEffect` da tela principal para que, quando o Luiz rodar o simulador no vídeo pitch, o card vermelho de **Possível vazamento oculto** salte na tela do celular automaticamente sem ninguém clicar em atualizar!
  3. **Gráfico Visual na Aba de Histórico + Botão de Excluir (`DELETE`):**
     * Na aba `historico`, transformar a lista de `consumoDiaLitros` em barras visuais proporcionais (CSS/Tailwind) mostrando o dia de maior gasto, e adicionar o botão de remover imóvel/sensor (`DELETE`) para cumprir 100% do seu cartão da página 20.

---

### 🔴 4. João — QA (Plano e Automação de Testes), Documentação e Vídeo Pitch (`tests-and-docs/`)
**Referência:** Cartão da Página 21 + Páginas 23, 25 e 26 do Guia.

* **O que já está na pasta `tests-and-docs/` como base:**
  * [`PLANO_DE_TESTES.md`](./tests-and-docs/PLANO_DE_TESTES.md), [`test_api.py`](./tests-and-docs/test_api.py), [`postman_collection.json`](./tests-and-docs/postman_collection.json) e [`ROTEIRO_PITCH_E_PDF.md`](./tests-and-docs/ROTEIRO_PITCH_E_PDF.md).
* **O que você (João) deve revisar, modificar e commitar:**
  1. **Expandir os Casos de Teste para cobrir os 3 Gatilhos + Regra do Dono (403):**
     * No [`test_api.py`](./tests-and-docs/test_api.py) e no [`PLANO_DE_TESTES.md`](./tests-and-docs/PLANO_DE_TESTES.md), garantir que existam testes explícitos para cada um dos **3 gatilhos da página 9** (`VAZAMENTO_OCULTO_MADRUGADA`, `CANO_ROMPIDO_PICO` e `META_MENSAL_ULTRAPASSADA`), além do teste de SQL Injection falhando no login (`' OR '1'='1`) e do morador tentando acessar imóvel alheio (`403 Forbidden`).
  2. **Rodar a Suíte e Salvar as Evidências em `tests-and-docs/evidencias/`:**
     * Executar `python3 tests-and-docs/test_api.py`, salvar o `relatorio_execucao_testes.txt` e tirar prints do terminal e do Postman/Swagger.
  3. **Documentar a Validação com Gente Real (Página 26):**
     * Registrar no documento do PDF as 3 a 5 frases curtas das conversas com moradores/síndico/setor de saneamento e o que mudou no projeto após ouvi-los.
  4. **Preencher os RMs e o Link do Vídeo no [`integrantes.txt`](./integrantes.txt) e no [`README.md`](./README.md).**
