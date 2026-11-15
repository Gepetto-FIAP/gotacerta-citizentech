# Segurança da Informação — Gota Certa (Parte 5)

**Stack:** API C# .NET 8, EF Core, JWT Bearer, BCrypt

**onde cada proteção está no código**, como a API separa **401 de 403** e quais **requisições são bloqueadas** (com os resultados obtidos).

---

## 1. Onde está cada proteção

| Proteção | Onde no código | Como funciona |
|---|---|---|
| Hash de senha (BCrypt) | `Services` → `PasswordHasher` | `BCrypt.Net.BCrypt.HashPassword(senha, workFactor: 11)`. Salt automático; a senha nunca é salva em texto puro. |
| Token JWT | `AuthService.GenerateTokenResponse` e `Program.cs` (`AddJwtBearer`) | Assinado com HMAC-SHA256, validade de 8 horas. A API valida assinatura, issuer, audience e expiração. Claims: `sub`/`NameIdentifier`, `Name`, `Email` e `Role`. |
| Perfil fixo no cadastro | `AuthService.RegisterAsync` | O cadastro público sempre cria `MORADOR`. O perfil enviado no corpo é ignorado, então ninguém vira ADMIN pelo `/register`. |
| Regra do Dono | `Controllers/ApiControllers.cs` → `ApiControllerBase.PodeAcessarImovel` | MORADOR só acessa o imóvel se `imovel.UsuarioId` for igual ao ID do token. ADMIN acessa todos. |
| RBAC por perfil | `[Authorize(Roles = "ADMIN")]` | Restrito ao gestor: `DELETE /api/imoveis/{id}`, `DELETE /api/alertas/{id}` e `GET /api/bairros/alertas`. |
| Limite de tentativas no login | `Program.cs` (`AddRateLimiter`) e `[EnableRateLimiting("login")]` no `AuthController` | 10 tentativas por minuto por IP. Acima disso a API devolve **429**. |
| Cabeçalhos de segurança | `Program.cs` (middleware) | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`. |

---

## 2. 401 vs 403

- **401 Unauthorized** — a API não sabe quem você é: sem token, token inválido, adulterado ou expirado.
- **403 Forbidden** — a API sabe quem você é, mas você não tem permissão para aquilo.

| Rota | Quem acessa | Sem token | Morador sem permissão |
|---|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | Público | — | — |
| `POST /api/leituras` | Público  | — | — |
| `GET/PUT /api/imoveis/{id}` e `/dashboard`, `/historico` | Dono do imóvel ou ADMIN | 401 | 403 (imóvel de outro) |
| `GET /api/imoveis`, `/sensores`, `/alertas` | Logado (morador só vê o que é dele) | 401 | lista filtrada |
| `POST /api/imoveis` | Logado (o dono vem do token) | 401 | — |
| `POST/DELETE /api/sensores`, `PUT /api/alertas/{id}` | Dono do imóvel do sensor/alerta ou ADMIN | 401 | 403 |
| `DELETE /api/imoveis/{id}`, `DELETE /api/alertas/{id}`, `GET /api/bairros/alertas` | Somente ADMIN | 401 | 403 |

---

## 3. A Regra do Dono

```csharp
protected bool PodeAcessarImovel(Imovel imovel)
{
    if (EhAdmin()) return true;                       // Gestor acessa tudo
    var uid = UsuarioLogadoId();                      // ID vindo do JWT 
    return uid.HasValue && imovel.UsuarioId == uid.Value;
}
```

Uso nos endpoints:

```C#
var imovel = await _repo.GetByIdAsync(id);
if (imovel is null) return NotFound(...);             // 404
if (!PodeAcessarImovel(imovel)) return Forbid();      // 403
```

Cuidados extras:
- O filtro de `GET /api/imoveis` vem do **token**, nunca da query string (`?usuarioId=outro` é ignorado para morador).
- No `POST /api/imoveis` o dono do imóvel vem do **token**: o morador não consegue criar imóvel no nome de outro usuário.

---

## 4. Práticas OWASP aplicadas

| Risco | Ameaça no projeto | Mitigação | Onde |
|---|---|---|---|
| Broken Access Control | Morador lê ou altera imóvel de outro  | Regra do Dono + 403; listas filtradas pelo token | `ApiControllers.cs` |
| Escalada de privilégio | Cadastrar-se enviando `"perfil": "ADMIN"` | O cadastro público força `MORADOR` | `AuthService.RegisterAsync` |
| Mass Assignment | Enviar `usuarioId` de outro no `POST /api/imoveis` | Dono vem do token | `ImoveisController.Create` |
| Validação de entrada (DataAnnotations) | Dados malformados ou gigantes nos formulários e na telemetria | `[Required]`, `[MaxLength]`, `[EmailAddress]` nos Models e DTOs, e `[ApiController]` valida o corpo antes do código rodar: dado inválido devolve **400** (ex.: o teste 8 de SQL Injection no login devolveu 400) | Models e DTOs |
| Cryptographic Failures | Vazamento do banco expõe senhas | BCrypt com salt e workFactor 11 | `PasswordHasher` |
| Injection (SQL) | `' OR '1'='1` no login | Consultas via EF Core/LINQ, sempre parametrizadas; sem SQL concatenado | `AuthService`, `TelemetriaService` |
| XSS | Script em `apelidoLocal` ou `endereco` | A API só devolve JSON; os campos têm `[Required]` e `[MaxLength]`; o React/Next.js escapa texto por padrão | Models e DTOs; frontend |
| Authentication Failures | Força bruta no login | Limite de 10 tentativas/min por IP (429); mensagem única "Credenciais inválidas" (não revela se o e-mail existe) | `Program.cs`, `AuthController` |
| Security Misconfiguration | Cabeçalhos ausentes | `nosniff`, `X-Frame-Options`, `Referrer-Policy` | `Program.cs` |

---

## 5. Requisições bloqueadas (evidências para o PDF)

Pré-requisitos: API rodando em `http://localhost:8080`, logins de teste do README e um **segundo morador** cadastrado (por exemplo `teste3.morador@email.com`) com um imóvel próprio. Swagger (botão **Authorize**).

Login (devolve o token no campo `tokenJwt`):

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria.silva@email.com","senha":"GotaCerta@2026"}'
```

| # | Teste | Requisição | Esperado | Obtido (print) |
|---|---|---|---|---|
| 1 | Sem token | `curl -i http://localhost:8080/api/imoveis` | 401 | **401 Unauthorized** (header `www-authenticate: Bearer`) |
| 2 | Token adulterado | `curl -i -H "Authorization: Bearer abc.def.ghi" http://localhost:8080/api/imoveis` | 401 | **401 Unauthorized** (`invalid_token`) |
| 3 | Morador acessando imóvel alheio | `curl -i -H "Authorization: Bearer <TOKEN_MORADOR>" http://localhost:8080/api/imoveis/<ID_IMOVEL_DE_OUTRO>/dashboard` | 403 | **403 Forbidden** (Maria, usuário 2, tentando abrir o dashboard do imóvel 5, do usuário 6) |
| 4 | Morador alterando imóvel alheio | `PUT /api/imoveis/<ID_IMOVEL_DE_OUTRO>` com token de morador | 403 | **403 Forbidden** |
| 5 | Morador removendo imóvel | `DELETE /api/imoveis/<ID>` com token de morador | 403 | **403 Forbidden** |
| 6 | Morador no painel do gestor | `GET /api/bairros/alertas` com token de morador | 403 | **403 Forbidden** |
| 7 | Gestor acessando imóvel de morador | `GET /api/imoveis/<ID>/dashboard` com token ADMIN | 200 | **200 OK** (gestor acessa o imóvel de outro usuário) |
| 8 | SQL Injection no login | corpo `{"email":"' OR '1'='1","senha":"x"}` | 400 ou 401 (nunca 200) | **400 Bad Request** (login não autenticado; nunca 200) |
| 9 | Cadastro tentando virar ADMIN | `POST /api/auth/register` com `"perfil":"ADMIN"` | resposta com `perfil` = `MORADOR` | **201**, com `"perfil":"MORADOR"` no corpo e na claim de role do token, mesmo enviando `"ADMIN"` |
| 10 | Força bruta | 12 logins seguidos com senha errada | os últimos devolvem 429 | **429 Too Many Requests** a partir da 11ª tentativa no minuto |


