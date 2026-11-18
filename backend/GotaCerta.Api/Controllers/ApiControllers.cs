using System.Security.Claims;
using GotaCerta.Api.DTOs;
using GotaCerta.Api.Models;
using GotaCerta.Api.Repositories;
using GotaCerta.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GotaCerta.Api.Controllers;

/// <summary>
/// Base dos controllers protegidos  lê a identidade do JWT e aplica a "Regra do Dono".
/// MORADOR só acessa o que é dele; ADMIN (Gestor) acessa tudo.
/// </summary>
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>ID do usuário logado, vindo da claim NameIdentifier (ou "sub") do JWT.</summary>
    protected int? UsuarioLogadoId()
    {
        var valor = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(valor, out var id) ? id : null;
    }

    /// <summary>True se o token tem o perfil ADMIN.</summary>
    protected bool EhAdmin() =>
        User.IsInRole("ADMIN") ||
        User.HasClaim(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value == "ADMIN");

    /// <summary>Regra do Dono: ADMIN pode tudo; MORADOR só se imovel.UsuarioId == usuário logado.</summary>
    protected bool PodeAcessarImovel(Imovel imovel)
    {
        if (EhAdmin()) return true;
        var uid = UsuarioLogadoId();
        return uid.HasValue && imovel.UsuarioId == uid.Value;
    }
}

/// <summary>
/// Endpoints de Autenticação e Segurança (BCrypt + JWT RBAC).
/// Rotas públicas: é aqui que o token nasce.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>
    /// POST /api/auth/register — Criar conta (senha vira hash BCrypt).
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _authService.RegisterAsync(dto);
            return Created("/api/auth/login", result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { erro = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/auth/login — Entrar; devolve token JWT.
    /// Limite de tentativas (política "login" no Program.cs): acima disso devolve 429 (anti força bruta).
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { erro = "Credenciais inválidas. Verifique seu e-mail e senha." });

        return Ok(result);
    }
}

/// <summary>
/// Endpoints de Imóveis, Dashboard e Histórico de Consumo.
/// Protegidos pela Regra do Dono: sem token = 401; token de outro dono = 403.
/// </summary>
[ApiController]
[Route("api/imoveis")]
[Authorize]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class ImoveisController : ApiControllerBase
{
    private readonly IImovelRepository _repo;
    private readonly ITelemetriaService _telemetriaService;

    public ImoveisController(IImovelRepository repo, ITelemetriaService telemetriaService)
    {
        _repo = repo;
        _telemetriaService = telemetriaService;
    }

    /// <summary>
    /// GET /api/imoveis — MORADOR vê só os seus imóveis; ADMIN vê todos (e pode filtrar por usuarioId ou bairro).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Imovel>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? bairro = null, [FromQuery] int? usuarioId = null)
    {
        // Morador: o filtro vem SEMPRE do token, nunca da query string (evita ?usuarioId=outro).
        if (!EhAdmin() && UsuarioLogadoId() is null)
            return Unauthorized();

        var filtroUsuario = EhAdmin() ? usuarioId : UsuarioLogadoId();
        var lista = await _repo.GetAllAsync(bairro, filtroUsuario);
        return Ok(lista);
    }

    /// <summary>
    /// Busca detalhes completos de um imóvel específico por ID (só o dono ou ADMIN).
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Imovel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var imovel = await _repo.GetByIdAsync(id);
        if (imovel is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        if (!PodeAcessarImovel(imovel))
            return Forbid();

        return Ok(imovel);
    }

    /// <summary>
    /// GET /api/imoveis/{id}/dashboard — Vazão atual, consumo do mês (L e R$), meta do mês e alertas (só o dono ou ADMIN).
    /// </summary>
    [HttpGet("{id:int}/dashboard")]
    [ProducesResponseType(typeof(ImovelDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDashboard(int id)
    {
        var imovel = await _repo.GetByIdAsync(id);
        if (imovel is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        if (!PodeAcessarImovel(imovel))
            return Forbid();

        var dash = await _telemetriaService.ObterDashboardImovelAsync(id);
        if (dash is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        return Ok(dash);
    }

    /// <summary>
    /// GET /api/imoveis/{id}/historico — Consumo agrupado por dia para gráficos (só o dono ou ADMIN).
    /// </summary>
    [HttpGet("{id:int}/historico")]
    [ProducesResponseType(typeof(List<ConsumoDiarioItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHistorico(int id)
    {
        var imovel = await _repo.GetByIdAsync(id);
        if (imovel is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        if (!PodeAcessarImovel(imovel))
            return Forbid();

        var historico = await _telemetriaService.ObterHistoricoDiarioImovelAsync(id);
        return Ok(historico);
    }

    /// <summary>
    /// POST /api/imoveis — Cadastrar imóvel/hidrômetro.
    /// MORADOR sempre cadastra para si mesmo; só ADMIN pode informar outro usuarioId.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Imovel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateImovelDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // o dono vem do token, não do corpo da requisição (exceto ADMIN).
        var donoId = EhAdmin() ? dto.UsuarioId : UsuarioLogadoId();
        if (donoId is null)
            return Unauthorized();

        if (await _repo.ExistsByHidrometroAsync(dto.NumeroSerieHidrometro))
            return Conflict(new { erro = $"Já existe um imóvel cadastrado com o hidrômetro '{dto.NumeroSerieHidrometro.Trim()}'." });

        var novoImovel = new Imovel
        {
            UsuarioId = donoId.Value,
            ApelidoLocal = dto.ApelidoLocal.Trim(),
            Endereco = dto.Endereco.Trim(),
            Bairro = dto.Bairro.Trim(),
            Cep = dto.Cep.Trim(),
            NumeroSerieHidrometro = dto.NumeroSerieHidrometro.Trim(),
            MetaConsumoMensalLitros = dto.MetaConsumoMensalLitros
        };

        var criado = await _repo.CreateAsync(novoImovel);
        return CreatedAtAction(nameof(GetById), new { id = criado.Id }, criado);
    }

    /// <summary>
    /// PUT /api/imoveis/{id} — Alterar dados e meta do mês (só o dono ou ADMIN).
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(Imovel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateImovelDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var existente = await _repo.GetByIdAsync(id);
        if (existente is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        if (!PodeAcessarImovel(existente))
            return Forbid();

        existente.ApelidoLocal = dto.ApelidoLocal.Trim();
        existente.Endereco = dto.Endereco.Trim();
        existente.Bairro = dto.Bairro.Trim();
        existente.MetaConsumoMensalLitros = dto.MetaConsumoMensalLitros;

        var atualizado = await _repo.UpdateAsync(existente);
        return Ok(atualizado);
    }

    /// <summary>
    /// DELETE /api/imoveis/{id} — Remover imóvel (Requer perfil ADMIN no Token JWT).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var removido = await _repo.DeleteAsync(id);
        if (!removido)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        return NoContent();
    }
}

/// <summary>
/// Endpoints de Sensores IoT, Leituras de Telemetria, Alertas e Painel do Gestor.
/// Protegidos pela Regra do Dono. Única rota pública: POST /api/leituras (o simulador/dispositivo não tem login).
/// </summary>
[ApiController]
[Route("api")]
[Authorize]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class TelemetriaAlertasController : ApiControllerBase
{
    private readonly ISensorRepository _sensorRepo;
    private readonly ILeituraAlertaRepository _leituraAlertaRepo;
    private readonly ITelemetriaService _telemetriaService;
    private readonly IImovelRepository _imovelRepo;

    public TelemetriaAlertasController(
        ISensorRepository sensorRepo,
        ILeituraAlertaRepository leituraAlertaRepo,
        ITelemetriaService telemetriaService,
        IImovelRepository imovelRepo)
    {
        _sensorRepo = sensorRepo;
        _leituraAlertaRepo = leituraAlertaRepo;
        _telemetriaService = telemetriaService;
        _imovelRepo = imovelRepo;
    }

    /// <summary>
    /// Confere se o imóvel existe e se o usuário logado pode acessá-lo.
    /// Devolve null quando está tudo certo; senão devolve o 404 ou 403 a ser retornado.
    /// </summary>
    private async Task<IActionResult?> ValidarAcessoAoImovelAsync(int imovelId)
    {
        var imovel = await _imovelRepo.GetByIdAsync(imovelId);
        if (imovel is null)
            return NotFound(new { erro = $"Imóvel com ID {imovelId} não encontrado." });

        return PodeAcessarImovel(imovel) ? null : Forbid();
    }

    /// <summary>IDs dos imóveis do usuário logado (usado para filtrar listas de sensores e alertas).</summary>
    private async Task<List<int>> IdsDosMeusImoveisAsync(int usuarioId)
    {
        var meus = await _imovelRepo.GetAllAsync(null, usuarioId);
        return meus.Select(i => i.Id).ToList();
    }

    /// <summary>
    /// Lista os sensores ópticos (LED_IR e FOTOTRANSISTOR). MORADOR vê só os sensores dos seus imóveis.
    /// </summary>
    [HttpGet("sensores")]
    [ProducesResponseType(typeof(List<SensorIoT>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSensores([FromQuery] int? imovelId = null)
    {
        if (EhAdmin())
            return Ok(await _sensorRepo.GetAllAsync(imovelId));

        var uid = UsuarioLogadoId();
        if (uid is null)
            return Unauthorized();

        if (imovelId.HasValue)
        {
            var erro = await ValidarAcessoAoImovelAsync(imovelId.Value);
            if (erro is not null) return erro;
            return Ok(await _sensorRepo.GetAllAsync(imovelId));
        }

        var meusImoveis = await IdsDosMeusImoveisAsync(uid.Value);
        var sensores = await _sensorRepo.GetAllAsync(null);
        return Ok(sensores.Where(s => meusImoveis.Contains(s.ImovelId)).ToList());
    }

    /// <summary>
    /// POST /api/sensores — Registrar sensor no imóvel (só no imóvel do próprio usuário, ou ADMIN).
    /// </summary>
    [HttpPost("sensores")]
    [ProducesResponseType(typeof(SensorIoT), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateSensor([FromBody] CreateSensorDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var erro = await ValidarAcessoAoImovelAsync(dto.ImovelId);
        if (erro is not null) return erro;

        if (await _sensorRepo.GetByCodigoAsync(dto.CodigoDispositivo.Trim()) is not null)
            return Conflict(new { erro = $"Já existe um sensor cadastrado com o código '{dto.CodigoDispositivo.Trim()}'." });

        var sensor = new SensorIoT
        {
            ImovelId = dto.ImovelId,
            CodigoDispositivo = dto.CodigoDispositivo.Trim(),
            TipoSensor = dto.TipoSensor,
            FatorCalibracaoPulsosLitro = dto.FatorCalibracaoPulsosLitro,
            LimiteVazaoAlertaLpm = dto.LimiteVazaoAlertaLpm,
            StatusAtivo = true
        };

        var criado = await _sensorRepo.CreateAsync(sensor);
        return Created($"/api/sensores/{criado.Id}", criado);
    }

    /// <summary>
    /// DELETE /api/sensores/{id} — Remover sensor (só se o imóvel do sensor for do usuário, ou ADMIN).
    /// </summary>
    [HttpDelete("sensores/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSensor(int id)
    {
        var todos = await _sensorRepo.GetAllAsync(null);
        var sensor = todos.FirstOrDefault(s => s.Id == id);
        if (sensor is null)
            return NotFound(new { erro = $"Sensor com ID {id} não encontrado." });

        var erro = await ValidarAcessoAoImovelAsync(sensor.ImovelId);
        if (erro is not null) return erro;

        var removido = await _sensorRepo.DeleteAsync(id);
        if (!removido)
            return NotFound(new { erro = $"Sensor com ID {id} não encontrado." });

        return NoContent();
    }

    /// <summary>
    /// Consulta as leituras recentes enviadas pelos sensores. MORADOR precisa informar um imovelId que seja dele.
    /// </summary>
    [HttpGet("leituras")]
    [ProducesResponseType(typeof(List<LeituraHidrometro>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetLeituras([FromQuery] int? imovelId = null, [FromQuery] int limit = 30)
    {
        if (!EhAdmin())
        {
            if (imovelId is null)
                return BadRequest(new { erro = "Informe o imovelId para consultar as leituras." });

            var erro = await ValidarAcessoAoImovelAsync(imovelId.Value);
            if (erro is not null) return erro;
        }

        limit = Math.Clamp(limit, 1, 200);
        return Ok(await _leituraAlertaRepo.GetRecentLeiturasAsync(imovelId, limit));
    }

    /// <summary>
    /// POST /api/leituras — Receber leitura de telemetria e rodar os 3 gatilhos (Vazamento Oculto, Cano Rompido e Meta Mensal).
    /// Rota pública para envio pelos dispositivos IoT.
    /// </summary>
    [HttpPost("leituras")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LeituraProcessedResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostLeituraIoT([FromBody] CreateLeituraIoTDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var processado = await _telemetriaService.ProcessarLeituraIoTAsync(dto);
            return Created($"/api/leituras/{processado.LeituraId}", processado);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { erro = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/alertas — Alertas de vazamento e meta estourada. MORADOR vê só os alertas dos seus imóveis.
    /// </summary>
    [HttpGet("alertas")]
    [ProducesResponseType(typeof(List<AlertaConsumo>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertas([FromQuery] bool? apenasAtivos = null, [FromQuery] int? imovelId = null)
    {
        if (EhAdmin())
            return Ok(await _leituraAlertaRepo.GetAlertasAsync(apenasAtivos, imovelId));

        var uid = UsuarioLogadoId();
        if (uid is null)
            return Unauthorized();

        if (imovelId.HasValue)
        {
            var erro = await ValidarAcessoAoImovelAsync(imovelId.Value);
            if (erro is not null) return erro;
            return Ok(await _leituraAlertaRepo.GetAlertasAsync(apenasAtivos, imovelId));
        }

        var meusImoveis = await IdsDosMeusImoveisAsync(uid.Value);
        var alertas = await _leituraAlertaRepo.GetAlertasAsync(apenasAtivos, null);
        return Ok(alertas.Where(a => meusImoveis.Contains(a.ImovelId)).ToList());
    }

    /// <summary>
    /// PUT /api/alertas/{id} — Confirmar reparo (marca resolvido = true). Só o dono do imóvel do alerta, ou ADMIN.
    /// </summary>
    [HttpPut("alertas/{id:int}")]
    [HttpPut("alertas/{id:int}/resolver")]
    [ProducesResponseType(typeof(AlertaConsumo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolverAlerta(int id)
    {
        var alerta = await _leituraAlertaRepo.GetAlertaByIdAsync(id);
        if (alerta is null)
            return NotFound(new { erro = $"Alerta com ID {id} não encontrado." });

        var erro = await ValidarAcessoAoImovelAsync(alerta.ImovelId);
        if (erro is not null) return erro;

        alerta.Resolvido = true;
        var atualizado = await _leituraAlertaRepo.UpdateAlertaAsync(alerta);
        return Ok(atualizado);
    }

    /// <summary>
    /// Exclui um registro de alerta (apenas ADMIN: o histórico de alertas serve de auditoria).
    /// </summary>
    [HttpDelete("alertas/{id:int}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAlerta(int id)
    {
        var removido = await _leituraAlertaRepo.DeleteAlertaAsync(id);
        if (!removido)
            return NotFound(new { erro = $"Alerta com ID {id} não encontrado." });

        return NoContent();
    }

    /// <summary>
    /// GET /api/bairros/alertas — Alertas e consumo consolidado por bairro (Painel do Gestor — apenas ADMIN).
    /// </summary>
    [HttpGet("bairros/alertas")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(typeof(List<BairroAlertaResumoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertasPorBairro()
    {
        return Ok(await _telemetriaService.ObterAlertasPorBairroAsync());
    }
}
