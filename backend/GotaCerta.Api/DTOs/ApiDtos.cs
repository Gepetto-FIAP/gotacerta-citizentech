using System.ComponentModel.DataAnnotations;

namespace GotaCerta.Api.DTOs;

public record LoginRequestDto(
    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Formato de e-mail inválido.")]
    string Email,

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A senha deve ter no mínimo 6 caracteres.")]
    string Senha
);

public record RegisterUsuarioDto(
    [Required(ErrorMessage = "O nome é obrigatório.")]
    [StringLength(120, MinimumLength = 3)]
    string Nome,

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress]
    string Email,

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [MinLength(6, ErrorMessage = "A senha deve ter ao menos 6 caracteres.")]
    string Senha,

    [RegularExpression("^(MORADOR|ADMIN)$", ErrorMessage = "O perfil deve ser MORADOR ou ADMIN.")]
    string Perfil = "MORADOR",

    string? Telefone = null
);

public record AuthResponseDto(
    int UsuarioId,
    string Nome,
    string Email,
    string Perfil,
    string TokenJwt,
    DateTime ExpiraEm
);

public record CreateImovelDto(
    [Required] int UsuarioId,
    [Required, StringLength(100, MinimumLength = 3)] string ApelidoLocal,
    [Required, RegularExpression("^(RESIDENCIAL|ESCOLA_PUBLICA|COMERCIO|COMUNITARIO)$")] string TipoImovel,
    [Required, StringLength(200, MinimumLength = 5)] string Endereco,
    [Required, StringLength(80, MinimumLength = 2)] string Bairro,
    [Required, StringLength(15, MinimumLength = 8)] string Cep,
    [Required, StringLength(50, MinimumLength = 4)] string NumeroSerieHidrometro,
    [Range(100, 10000000)] decimal MetaConsumoMensalLitros,
    [Range(100, 5000000)] decimal CapacidadeCaixaLitros,
    [Range(1, 10000)] int MoradoresAtendidos = 1
);

public record UpdateImovelDto(
    [Required, StringLength(100, MinimumLength = 3)] string ApelidoLocal,
    [Range(100, 10000000)] decimal MetaConsumoMensalLitros,
    [Range(100, 5000000)] decimal CapacidadeCaixaLitros,
    [Range(1, 10000)] int MoradoresAtendidos
);

public record CreateSensorDto(
    [Required] int ImovelId,
    [Required, StringLength(60, MinimumLength = 4)] string CodigoDispositivo,
    [Required, RegularExpression("^(PULSO_RELOJOARIA_HIDROMETRO|ULTRASSONICO_CAIXA_DAGUA)$")] string TipoSensor,
    [Required, StringLength(120)] string ModeloHardware,
    [Range(0.1, 1000)] decimal FatorPulsosPorLitro = 1.0m,
    [Range(1.0, 500.0)] decimal LimiteVazaoAlertaLpm = 20.0m
);

public record CreateLeituraIoTDto(
    [Required] string CodigoDispositivo,
    [Range(0, 1000000)] int PulsosRegistrados,
    [Range(0, 5000)] decimal VazaoInstantaneaLpm,
    [Range(0, 999999999)] decimal VolumeAcumuladoLitros,
    [Range(0, 100)] decimal NivelCaixaPercentual,
    [Range(0, 20)] decimal PressaoRuaBar,
    DateTime? DataHoraLeitura = null
);

public record LeituraProcessedResponseDto(
    int LeituraId,
    string CodigoDispositivo,
    decimal VazaoInstantaneaLpm,
    decimal VolumeAcumuladoLitros,
    decimal NivelCaixaPercentual,
    decimal PressaoRuaBar,
    bool AlertaGerado,
    string? TipoAlertaGerado,
    string? MensagemAlerta
);

public record DashboardResumoDto(
    int TotalImoveisMonitorados,
    int TotalSensoresAtivos,
    int TotalAlertasAtivos,
    decimal TotalDesperdicioEstimadoLitros,
    int CidadaosProtegidos
);
