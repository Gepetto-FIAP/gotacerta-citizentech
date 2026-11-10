using GotaCerta.Api.DTOs;
using GotaCerta.Api.Models;
using GotaCerta.Api.Repositories;
using GotaCerta.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GotaCerta.Api.Controllers;

/// <summary>
/// Endpoints de Autenticação e Segurança (Parte 5 - Vitória: Login com Hash, Registro e JWT RBAC).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>
    /// Autentica um cidadão ou administrador e retorna um Token JWT Bearer.
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

    /// <summary>
    /// Registra um novo usuário armazenando a senha exclusivamente em Hash PBKDF2-SHA256 com Salt.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
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
            return BadRequest(new { erro = ex.Message });
        }
    }
}

/// <summary>
/// Gerenciamento de Imóveis e Hidrômetros Monitorados (CRUD completo: GET, POST, PUT, DELETE).
/// </summary>
[ApiController]
[Route("api/imoveis")]
public class ImoveisController : ControllerBase
{
    private readonly IImovelRepository _repo;

    public ImoveisController(IImovelRepository repo) => _repo = repo;

    /// <summary>
    /// Lista todos os imóveis e hidrômetros monitorados (permite filtrar por bairro).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<Imovel>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? bairro = null)
    {
        var lista = await _repo.GetAllAsync(bairro);
        return Ok(lista);
    }

    /// <summary>
    /// Retorna os detalhes de um imóvel específico, seus sensores IoT e histórico de alertas.
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
    /// Cadastra um novo imóvel e hidrômetro no sistema.
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
            TipoImovel = dto.TipoImovel,
            Endereco = dto.Endereco.Trim(),
            Bairro = dto.Bairro.Trim(),
            Cep = dto.Cep.Trim(),
            NumeroSerieHidrometro = dto.NumeroSerieHidrometro.Trim(),
            MetaConsumoMensalLitros = dto.MetaConsumoMensalLitros,
            CapacidadeCaixaLitros = dto.CapacidadeCaixaLitros,
            MoradoresAtendidos = dto.MoradoresAtendidos
        };

        var criado = await _repo.CreateAsync(novoImovel);
        return CreatedAtAction(nameof(GetById), new { id = criado.Id }, criado);
    }

    /// <summary>
    /// Atualiza metas de consumo e capacidade do reservatório de um imóvel existente.
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
        existente.MetaConsumoMensalLitros = dto.MetaConsumoMensalLitros;
        existente.CapacidadeCaixaLitros = dto.CapacidadeCaixaLitros;
        existente.MoradoresAtendidos = dto.MoradoresAtendidos;

        var atualizado = await _repo.UpdateAsync(existente);
        return Ok(atualizado);
    }

    /// <summary>
    /// Remove um imóvel monitorado (Requer perfil ADMIN no Token JWT — demonstração RBAC Parte 5).
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
/// Endpoints de Sensores IoT, Telemetria de Hidrômetros (Luiz) e Alertas Automáticos.
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
    /// Retorna os indicadores consolidados para o Dashboard Mobile-First.
    /// </summary>
    [HttpGet("dashboard/resumo")]
    [ProducesResponseType(typeof(DashboardResumoDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetResumoDashboard()
    {
        return Ok(await _telemetriaService.ObterResumoDashboardAsync());
    }

    /// <summary>
    /// Lista os sensores IoT instalados (acoplados à relojoaria e ultrassônicos de caixa d'água).
    /// </summary>
    [HttpGet("sensores")]
    [ProducesResponseType(typeof(List<SensorIoT>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSensores([FromQuery] int? imovelId = null)
    {
        return Ok(await _sensorRepo.GetAllAsync(imovelId));
    }

    /// <summary>
    /// Cadastra um novo sensor IoT acoplado a um hidrômetro ou reservatório.
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
            ModeloHardware = dto.ModeloHardware.Trim(),
            FatorPulsosPorLitro = dto.FatorPulsosPorLitro,
            LimiteVazaoAlertaLpm = dto.LimiteVazaoAlertaLpm,
            Ativo = true
        };

        var criado = await _sensorRepo.CreateAsync(sensor);
        return Created($"/api/sensores/{criado.Id}", criado);
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
    /// Recebe um payload JSON do Simulador IoT (Luiz), grava a leitura da relojoaria do hidrômetro
    /// e dispara alertas automáticos se detectar vazamento oculto, pico ou falta d'água.
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
    /// Lista os alertas de vazamento e desabastecimento gerados na aplicação.
    /// </summary>
    [HttpGet("alertas")]
    [ProducesResponseType(typeof(List<AlertaConsumo>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAlertas([FromQuery] bool? apenasAtivos = null)
    {
        return Ok(await _leituraAlertaRepo.GetAlertasAsync(apenasAtivos));
    }

    /// <summary>
    /// Marca um alerta de vazamento como resolvido após vistoria/reparo pelo morador ou técnico.
    /// </summary>
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
}
