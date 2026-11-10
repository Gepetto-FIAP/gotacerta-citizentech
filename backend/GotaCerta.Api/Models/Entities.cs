using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GotaCerta.Api.Models;

[Table("usuarios")]
public class Usuario
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required, MaxLength(120)]
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    [JsonIgnore]
    [Column("senha_hash")]
    public string SenhaHash { get; set; } = string.Empty;

    [Required, MaxLength(30)]
    [Column("perfil")]
    public string Perfil { get; set; } = "MORADOR"; // MORADOR | ADMIN

    [MaxLength(20)]
    [Column("telefone")]
    public string? Telefone { get; set; }

    [Column("criado_em")]
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<Imovel> Imoveis { get; set; } = new List<Imovel>();
}

[Table("imoveis")]
public class Imovel
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("usuario_id")]
    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Required, MaxLength(100)]
    [Column("apelido_local")]
    public string ApelidoLocal { get; set; } = string.Empty;

    [Required, MaxLength(40)]
    [Column("tipo_imovel")]
    public string TipoImovel { get; set; } = "RESIDENCIAL"; // RESIDENCIAL | ESCOLA_PUBLICA | COMERCIO | COMUNITARIO

    [Required, MaxLength(200)]
    [Column("endereco")]
    public string Endereco { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    [Column("bairro")]
    public string Bairro { get; set; } = string.Empty;

    [Required, MaxLength(15)]
    [Column("cep")]
    public string Cep { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    [Column("numero_serie_hidrometro")]
    public string NumeroSerieHidrometro { get; set; } = string.Empty;

    [Column("meta_consumo_mensal_litros")]
    public decimal MetaConsumoMensalLitros { get; set; } = 12000m;

    [Column("capacidade_caixa_litros")]
    public decimal CapacidadeCaixaLitros { get; set; } = 1000m;

    [Column("moradores_atendidos")]
    public int MoradoresAtendidos { get; set; } = 1;

    public ICollection<SensorIoT> Sensores { get; set; } = new List<SensorIoT>();
    public ICollection<AlertaConsumo> Alertas { get; set; } = new List<AlertaConsumo>();
}

[Table("sensores_iot")]
public class SensorIoT
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("imovel_id")]
    public int ImovelId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(ImovelId))]
    public Imovel? Imovel { get; set; }

    [Required, MaxLength(60)]
    [Column("codigo_dispositivo")]
    public string CodigoDispositivo { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    [Column("tipo_sensor")]
    public string TipoSensor { get; set; } = "PULSO_RELOJOARIA_HIDROMETRO";

    [Required, MaxLength(120)]
    [Column("modelo_hardware")]
    public string ModeloHardware { get; set; } = "Reed Switch + Hall A3144 Acoplado à Relojoaria (Ref. PIBIC/UNICAMP)";

    [Column("fator_pulsos_por_litro")]
    public decimal FatorPulsosPorLitro { get; set; } = 1.0m;

    [Column("limite_vazao_alerta_lpm")]
    public decimal LimiteVazaoAlertaLpm { get; set; } = 20.0m;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("instalado_em")]
    public DateTime InstaladoEm { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<LeituraHidrometro> Leituras { get; set; } = new List<LeituraHidrometro>();
}

[Table("leituras_hidrometro")]
public class LeituraHidrometro
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("sensor_id")]
    public int SensorId { get; set; }

    [ForeignKey(nameof(SensorId))]
    public SensorIoT? Sensor { get; set; }

    [Column("pulsos_registrados")]
    public int PulsosRegistrados { get; set; }

    [Column("vazao_instantanea_lpm")]
    public decimal VazaoInstantaneaLpm { get; set; }

    [Column("volume_acumulado_litros")]
    public decimal VolumeAcumuladoLitros { get; set; }

    [Column("nivel_caixa_percentual")]
    public decimal NivelCaixaPercentual { get; set; }

    [Column("pressao_rua_bar")]
    public decimal PressaoRuaBar { get; set; }

    [Column("data_hora_leitura")]
    public DateTime DataHoraLeitura { get; set; } = DateTime.UtcNow;
}

[Table("alertas_consumo")]
public class AlertaConsumo
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("imovel_id")]
    public int ImovelId { get; set; }

    [JsonIgnore]
    [ForeignKey(nameof(ImovelId))]
    public Imovel? Imovel { get; set; }

    [Column("leitura_id")]
    public int? LeituraId { get; set; }

    [ForeignKey(nameof(LeituraId))]
    public LeituraHidrometro? Leitura { get; set; }

    [Required, MaxLength(50)]
    [Column("tipo_alerta")]
    public string TipoAlerta { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    [Column("severidade")]
    public string Severidade { get; set; } = "MEDIA"; // BAIXA | MEDIA | CRITICA

    [Required, MaxLength(300)]
    [Column("mensagem")]
    public string Mensagem { get; set; } = string.Empty;

    [Column("desperdicio_estimado_litros")]
    public decimal DesperdicioEstimadoLitros { get; set; }

    [Column("resolvido")]
    public bool Resolvido { get; set; } = false;

    [Column("data_geracao")]
    public DateTime DataGeracao { get; set; } = DateTime.UtcNow;
}
