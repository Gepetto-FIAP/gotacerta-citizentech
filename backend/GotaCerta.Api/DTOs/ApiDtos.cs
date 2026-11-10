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
    string Perfil = "MORADOR"
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
    [Required, StringLength(200, MinimumLength = 5)] string Endereco,
    [Required, StringLength(80, MinimumLength = 2)] string Bairro,
    [Required, StringLength(15, MinimumLength = 8)] string Cep,
    [Required, StringLength(50, MinimumLength = 4)] string NumeroSerieHidrometro,
    [Range(100, 10000000)] decimal MetaConsumoMensalLitros = 10000m
);

public record UpdateImovelDto(
    [Required, StringLength(100, MinimumLength = 3)] string ApelidoLocal,
    [Required, StringLength(200, MinimumLength = 5)] string Endereco,
    [Required, StringLength(80, MinimumLength = 2)] string Bairro,
    [Range(100, 10000000)] decimal MetaConsumoMensalLitros
);

public record CreateSensorDto(
    [Required] int ImovelId,
    [Required, StringLength(60, MinimumLength = 3)] string CodigoDispositivo,
    [Required, RegularExpression("^(LED_IR|FOTOTRANSISTOR)$", ErrorMessage = "O tipoSensor deve ser LED_IR ou FOTOTRANSISTOR.")] string TipoSensor = "FOTOTRANSISTOR",
    [Range(0.1, 1000)] decimal FatorCalibracaoPulsosLitro = 1.0m,
    [Range(1.0, 500.0)] decimal LimiteVazaoAlertaLpm = 25.0m
);

/// <summary>
/// Aceita tanto a nomenclatura sugerida na Página 14 do Guia do Grupo
/// ("pulsosUltimoMinuto", "leituraAcumuladaLitros", "dataHora", "intensidadeLuz")
/// quanto os nomes das colunas do banco ("pulsosRegistrados", "vazaoInstantaneaLpm", "volumeAcumuladoLitros").
/// </summary>
public class CreateLeituraIoTDto
{
    [Required]
    public string CodigoDispositivo { get; set; } = string.Empty;

    [Range(0, 1000000)]
    public int? PulsosUltimoMinuto { get; set; }

    [Range(0, 1000000)]
    public int? PulsosRegistrados { get; set; }

    [Range(0, 5000)]
    public decimal? VazaoInstantaneaLpm { get; set; }

    [Range(0, 999999999)]
    public decimal? LeituraAcumuladaLitros { get; set; }

    [Range(0, 999999999)]
    public decimal? VolumeAcumuladoLitros { get; set; }

    [Range(0, 1.0)]
    public decimal? IntensidadeLuz { get; set; }

    public DateTime? DataHora { get; set; }
    public DateTime? DataHoraLeitura { get; set; }
}

public record LeituraProcessedResponseDto(
    int LeituraId,
    string CodigoDispositivo,
    int PulsosRegistrados,
    decimal VazaoInstantaneaLpm,
    decimal VolumeAcumuladoLitros,
    decimal? IntensidadeLuz,
    bool AlertaGerado,
    List<string> TiposAlertasGerados,
    string MensagemResumo
);

public record ImovelDashboardDto(
    int ImovelId,
    string ApelidoLocal,
    string Bairro,
    string NumeroSerieHidrometro,
    decimal VazaoAtualLpm,
    decimal LeituraAtualMostradorLitros,
    decimal ConsumoMesLitros,
    decimal MetaConsumoMensalLitros,
    decimal PercentualMetaConsumida,
    decimal ValorEstimadoReais,
    int AlertasAtivosCount,
    List<object> AlertasAtivos
);

public record ConsumoDiarioItemDto(
    string Data,
    decimal ConsumoDiaLitros,
    decimal VazaoMaximaDiaLpm,
    int TotalPulsosDia
);

public record BairroAlertaResumoDto(
    string Bairro,
    int TotalImoveisMonitorados,
    int AlertasAtivos,
    decimal VolumeDesperdicadoLitros,
    decimal ConsumoTotalBairroLitros
);
