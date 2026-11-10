using GotaCerta.Api.DTOs;
using GotaCerta.Api.Models;
using GotaCerta.Api.Repositories;
using GotaCerta.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GotaCerta.Api.Controllers;

/// <summary>
/// Endpoints de Autenticação e Segurança (Parte 5 - Vitória: BCrypt + JWT RBAC).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>
    /// [1/14] POST /api/auth/register — Criar conta (senha vira hash BCrypt).
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
    /// [2/14] POST /api/auth/login — Entrar; devolve token JWT.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
/// Endpoints de Imóveis, Dashboard e Histórico (Páginas 14 e 17 do Guia do Grupo — Antônio).
/// </summary>
[ApiController]
[Route("api/imoveis")]
public class ImoveisController : ControllerBase
{
    private readonly IImovelRepository _repo;
    private readonly ITelemetriaService _telemetriaService;

    public ImoveisController(IImovelRepository repo, ITelemetriaService telemetriaService)
    {
        _repo = repo;
        _telemetriaService = telemetriaService;
    }

    /// <summary>
    /// [3/14] GET /api/imoveis — Imóveis do usuário (gestor vê todos; permite filtrar por usuarioId ou bairro).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Imovel>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? bairro = null, [FromQuery] int? usuarioId = null)
    {
        var lista = await _repo.GetAllAsync(bairro, usuarioId);
        return Ok(lista);
    }

    /// <summary>
    /// Busca detalhes completos de um imóvel específico por ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Imovel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var imovel = await _repo.GetByIdAsync(id);
        if (imovel is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        return Ok(imovel);
    }

    /// <summary>
    /// [10/14] GET /api/imoveis/{id}/dashboard — Vazão atual, consumo do mês (L e R$), meta do mês e alertas.
    /// </summary>
    [HttpGet("{id:int}/dashboard")]
    [ProducesResponseType(typeof(ImovelDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDashboard(int id)
    {
        var dash = await _telemetriaService.ObterDashboardImovelAsync(id);
        if (dash is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        return Ok(dash);
    }

    /// <summary>
    /// [11/14] GET /api/imoveis/{id}/historico — Consumo agrupado por dia para gráficos.
    /// </summary>
    [HttpGet("{id:int}/historico")]
    [ProducesResponseType(typeof(List<ConsumoDiarioItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHistorico(int id)
    {
        var imovel = await _repo.GetByIdAsync(id);
        if (imovel is null)
            return NotFound(new { erro = $"Imóvel com ID {id} não encontrado." });

        var historico = await _telemetriaService.ObterHistoricoDiarioImovelAsync(id);
        return Ok(historico);
    }

    /// <summary>
    /// [4/14] POST /api/imoveis — Cadastrar imóvel/hidrômetro.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Imovel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateImovelDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var novoImovel = new Imovel
        {
            UsuarioId = dto.UsuarioId,
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
    /// [5/14] PUT /api/imoveis/{id} — Alterar dados e meta do mês.
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

        existente.ApelidoLocal = dto.ApelidoLocal.Trim();
        existente.Endereco = dto.Endereco.Trim();
        existente.Bairro = dto.Bairro.Trim();
        existente.MetaConsumoMensalLitros = dto.MetaConsumoMensalLitros;

        var atualizado = await _repo.UpdateAsync(existente);
        return Ok(atualizado);
    }

    /// <summary>
    /// [6/14] DELETE /api/imoveis/{id} — Remover imóvel (Requer perfil ADMIN no Token JWT — RBAC Parte 5).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
/// Endpoints de Sensores IoT, Leituras de Telemetria, Alertas e Painel do Gestor (Página 14 do Guia).
/// </summary>
[ApiController]
[Route("api")]
public class TelemetriaAlertasController : ControllerBase
{
    private readonly ISensorRepository _sensorRepo;
    private readonly ILeituraAlertaRepository _leituraAlertaRepo;
    private readonly ITelemetriaService _telemetriaService;

    public TelemetriaAlertasController(
        ISensorRepository sensorRepo,
        ILeituraAlertaRepository leituraAlertaRepo,
        ITelemetriaService telemetriaService)
    {
        _sensorRepo = sensorRepo;
        _leituraAlertaRepo = leituraAlertaRepo;
        _telemetriaService = telemetriaService;
    }

    /// <summary>
    /// Lista os sensores ópticos (LED_IR e FOTOTRANSISTOR) instalados nos hidrômetros.
    /// </summary>
    [HttpGet("sensores")]
    [ProducesResponseType(typeof(List<SensorIoT>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSensores([FromQuery] int? imovelId = null)
    {
        return Ok(await _sensorRepo.GetAllAsync(imovelId));
    }

    /// <summary>
    /// [7/14] POST /api/sensores — Registrar sensor no imóvel.
    /// </summary>
    [HttpPost("sensores")]
    [ProducesResponseType(typeof(SensorIoT), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSensor([FromBody] CreateSensorDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

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
    /// [8/14] DELETE /api/sensores/{id} — Remover sensor.
    /// </summary>
    [HttpDelete("sensores/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSensor(int id)
    {
        var removido = await _sensorRepo.DeleteAsync(id);
        if (!removido)
            return NotFound(new { erro = $"Sensor com ID {id} não encontrado." });

        return NoContent();
    }

    /// <summary>
    /// Consulta as leituras recentes enviadas pelos sensores de telemetria.
    /// </summary>
    [HttpGet("leituras")]
    [ProducesResponseType(typeof(List<LeituraHidrometro>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeituras([FromQuery] int? imovelId = null, [FromQuery] int limit = 30)
    {
        return Ok(await _leituraAlertaRepo.GetRecentLeiturasAsync(imovelId, limit));
    }

    /// <summary>
    /// [9/14] POST /api/leituras — Receber leitura do Simulador do Luiz e rodar os 3 gatilhos (Vazamento Oculto, Cano Rompido e Meta Mensal).
    /// </summary>
    [HttpPost("leituras")]
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
    /// [12/14] GET /api/alertas — Alertas de vazamento e meta estourada.
    /// </summary>
    [HttpGet("alertas")]
    [ProducesResponseType(typeof(List<AlertaConsumo>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertas([FromQuery] bool? apenasAtivos = null, [FromQuery] int? imovelId = null)
    {
        return Ok(await _leituraAlertaRepo.GetAlertasAsync(apenasAtivos, imovelId));
    }

    /// <summary>
    /// [13/14] PUT /api/alertas/{id} — Confirmar reparo (marca resolvido = true).
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

        alerta.Resolvido = true;
        var atualizado = await _leituraAlertaRepo.UpdateAlertaAsync(alerta);
        return Ok(atualizado);
    }

    /// <summary>
    /// Exclui um registro de alerta.
    /// </summary>
    [HttpDelete("alertas/{id:int}")]
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
    /// [14/14] GET /api/bairros/alertas — Alertas e consumo consolidado por bairro (Painel do Gestor).
    /// </summary>
    [HttpGet("bairros/alertas")]
    [ProducesResponseType(typeof(List<BairroAlertaResumoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertasPorBairro()
    {
        return Ok(await _telemetriaService.ObterAlertasPorBairroAsync());
    }
}
