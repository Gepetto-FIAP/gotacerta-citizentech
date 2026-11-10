# Parte 3 de 6 — Plano de Testes (2,0 Pontos) & Parte 5 — Segurança (2,0 Pontos)
**Projeto GotaCerta — Qualidade de Software (QA) e Segurança DevSecOps**
*Responsáveis principais: João (QA / Plano de Testes) & Vitória (Segurança da Informação)*

---

## 1. Plano de Testes da Aplicação (10 Casos — Critério 01: 1,0 pt)

A tabela abaixo documenta **10 casos de teste funcionais e de segurança** (superando o mínimo de 8 casos exigidos pelo edital), cobrindo fluxos de sucesso (`200`, `201`, `204`) e fluxos de exceção/erro (`400`, `401`, `403`, `404`):

| ID | Cenário de Teste | Endpoint / Ação | Entrada (Payload / Parâmetros) | Saída Esperada | Status HTTP | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **CT-01** | **Login seguro com credenciais válidas (Cidadão)** | `POST /api/auth/login` | `{"email": "maria.silva@email.com", "senha": "GotaCerta@2026"}` | Retorna JSON com `tokenJwt`, `perfil: "MORADOR"` e dados do usuário (sem expor `senhaHash`). | `200 OK` | ✅ Aprovado |
| **CT-02** | **Bloqueio de login com senha incorreta (Caso de Erro)** | `POST /api/auth/login` | `{"email": "maria.silva@email.com", "senha": "SenhaErrada123"}` | Rejeita autenticação após verificação de Hash PBKDF2 e retorna mensagem de erro amigável. | `401 Unauthorized` | ✅ Aprovado |
| **CT-03** | **Cadastro de usuário com validação de entrada inválida (Caso de Erro)** | `POST /api/auth/register` | `{"nome": "A", "email": "email-invalido", "senha": "123"}` | Validação `DataAnnotations` bloqueia entrada fora do padrão antes de acessar o banco. | `400 Bad Request` | ✅ Aprovado |
| **CT-04** | **Listagem de imóveis e hidrômetros monitorados** | `GET /api/imoveis` | Query opcional `?bairro=Jardim Pantanal` | Retorna lista JSON de imóveis com seus sensores IoT e alertas ativos aninhados. | `200 OK` | ✅ Aprovado |
| **CT-05** | **Consulta de imóvel inexistente (Caso de Erro)** | `GET /api/imoveis/9999` | `id = 9999` | Retorna JSON `{"erro": "Imóvel com ID 9999 não encontrado."}`. | `404 Not Found` | ✅ Aprovado |
| **CT-06** | **Cadastro de novo imóvel e hidrômetro** | `POST /api/imoveis` | JSON válido com `apelidoLocal`, `numeroSerieHidrometro`, `metaConsumoMensalLitros`, etc. | Persiste o imóvel no banco relacional e retorna o recurso criado com `id` gerado. | `201 Created` | ✅ Aprovado |
| **CT-07** | **Atualização de meta mensal de consumo de um imóvel** | `PUT /api/imoveis/1` | `{"apelidoLocal": "Residência Dona Maria", "metaConsumoMensalLitros": 11000, "capacidadeCaixaLitros": 1000, "moradoresAtendidos": 4}` | Atualiza os dados no banco e retorna o objeto atualizado. | `200 OK` | ✅ Aprovado |
| **CT-08** | **Controle de Acesso RBAC: Morador tentando excluir imóvel sem perfil ADMIN (Caso de Erro)** | `DELETE /api/imoveis/1` | Header `Authorization: Bearer <TOKEN_MORADOR>` | Middleware JWT bloqueia a exclusão pois a rota exige `[Authorize(Roles = "ADMIN")]`. | `403 Forbidden` | ✅ Aprovado |
| **CT-09** | **Telemetria IoT disparando Alerta Automático de Cano Rompido** | `POST /api/leituras` | `{"codigoDispositivo": "ESP32-UNICAMP-REED-002", "pulsosRegistrados": 3720, "vazaoInstantaneaLpm": 62.0, "volumeAcumuladoLitros": 69330, "nivelCaixaPercentual": 41, "pressaoRuaBar": 1.7}` | Grava leitura e retorna `alertaGerado: true`, `tipoAlertaGerado: "CANO_ROMPIDO_PICO"`. | `201 Created` | ✅ Aprovado |
| **CT-10** | **Resolução de alerta de vazamento pelo morador** | `PUT /api/alertas/1/resolver` | `id = 1` | Atualiza campo `resolvido = true` no banco de dados e retorna o alerta atualizado. | `200 OK` | ✅ Aprovado |

---

## 2. Como Executar os Testes Automatizados e Gerar Evidências (Critérios 02 e 03: 1,0 pt)

Com a API rodando em `http://localhost:8080`, execute:

```bash
python3 tests-and-docs/test_api.py
```

O script executa automaticamente os casos de teste contra a API, exibe os resultados no terminal e salva o arquivo de evidências/logs em `tests-and-docs/relatorio_execucao_testes.txt` para inclusão no PDF final.

---

## 3. Documentação de Segurança da Informação (Parte 5 — Vitória: 2,0 pts)

1. **Login Seguro com Senha em Hash (0,5 pt):**
   * Implementado na classe [`PasswordHasher`](../backend/GotaCerta.Api/Services/Services.cs) usando o algoritmo **PBKDF2 com HMAC-SHA256 (`Rfc2898DeriveBytes`)**, **100.000 iterações** e **Salt criptográfico aleatório de 16 bytes** (`RandomNumberGenerator`).
   * A comparação no login utiliza `CryptographicOperations.FixedTimeEquals` para mitigar ataques de *Timing Attack*, e a propriedade `SenhaHash` possui `[JsonIgnore]` para jamais vazar em respostas JSON.
2. **Controle de Acesso por Perfis — RBAC (0,5 pt):**
   * Autenticação baseada em **Tokens JWT Bearer** assinados com `HMAC-SHA256` contendo a claim `ClaimTypes.Role` (`MORADOR` ou `ADMIN`).
   * Operações administrativas críticas (como `DELETE /api/imoveis/{id}`) exigem `[Authorize(Roles = "ADMIN")]`.
3. **Boas Práticas contra Vulnerabilidades Comuns — OWASP Top 10 (1,0 pt):**
   * **Proteção contra SQL Injection (SQLi):** Todas as consultas ao banco SQLite/MySQL utilizam **queries parametrizadas** via Entity Framework Core LINQ, impedindo concatenação de strings SQL.
   * **Validação Estrita de Entrada (Input Validation):** Todos os DTOs (`ApiDtos.cs`) aplicam `DataAnnotations` (`[Required]`, `[EmailAddress]`, `[Range]`, `[RegularExpression]`, `[StringLength]`) rejeitando payloads malformados com `400 Bad Request`.
   * **Prevenção contra XSS (Cross-Site Scripting):** A API retorna exclusivamente `application/json` serializado pelo `System.Text.Json` e o frontend React/Next.js escapa automaticamente qualquer conteúdo renderizado no DOM.
   * **Princípio do Menor Privilégio & Ocultação de Dados Sensíveis:** Uso de DTOs específicos para leitura/escrita e `[JsonIgnore]` em credenciais.
