using GotaCerta.Api.Models;
using GotaCerta.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace GotaCerta.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Imovel> Imoveis => Set<Imovel>();
    public DbSet<SensorIoT> SensoresIoT => Set<SensorIoT>();
    public DbSet<LeituraHidrometro> LeiturasHidrometro => Set<LeituraHidrometro>();
    public DbSet<AlertaConsumo> AlertasConsumo => Set<AlertaConsumo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Imovel>()
            .HasIndex(i => i.NumeroSerieHidrometro)
            .IsUnique();

        modelBuilder.Entity<SensorIoT>()
            .HasIndex(s => s.CodigoDispositivo)
            .IsUnique();
    }
}

public static class DbInitializer
{
    public static void Seed(AppDbContext context)
    {
        context.Database.EnsureCreated();

        if (context.Usuarios.Any())
            return;

        var senhaPadraoHash = PasswordHasher.HashPassword("GotaCerta@2026");

        var admin = new Usuario
        {
            Nome = "Antônio Schappo (Admin Defesa Hídrica)",
            Email = "admin@gotacerta.org.br",
            SenhaHash = senhaPadraoHash,
            Perfil = "ADMIN",
            Telefone = "11999990001"
        };

        var maria = new Usuario
        {
            Nome = "Dona Maria Aparecida Silva",
            Email = "maria.silva@email.com",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR",
            Telefone = "11988881122"
        };

        var escola = new Usuario
        {
            Nome = "Carlos Eduardo Santos (Diretor Escolar)",
            Email = "diretoria@emeluzdosaber.edu.br",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR",
            Telefone = "11977773344"
        };

        var padaria = new Usuario
        {
            Nome = "Padaria Comunitária Pão da Vila",
            Email = "contato@paodavila.com.br",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR",
            Telefone = "11966665566"
        };

        context.Usuarios.AddRange(admin, maria, escola, padaria);
        context.SaveChanges();

        var imovelMaria = new Imovel
        {
            UsuarioId = maria.Id,
            ApelidoLocal = "Residência Dona Maria",
            TipoImovel = "RESIDENCIAL",
            Endereco = "Rua das Acácias, 142",
            Bairro = "Jardim Pantanal",
            Cep = "08090-100",
            NumeroSerieHidrometro = "HIDRO-LAO-2024-8891",
            MetaConsumoMensalLitros = 12000m,
            CapacidadeCaixaLitros = 1000m,
            MoradoresAtendidos = 4
        };

        var imovelEscola = new Imovel
        {
            UsuarioId = escola.Id,
            ApelidoLocal = "EMEI Luz do Saber",
            TipoImovel = "ESCOLA_PUBLICA",
            Endereco = "Av. Esperança, 850",
            Bairro = "Jardim Pantanal",
            Cep = "08090-210",
            NumeroSerieHidrometro = "HIDRO-SABESP-2023-4410",
            MetaConsumoMensalLitros = 85000m,
            CapacidadeCaixaLitros = 10000m,
            MoradoresAtendidos = 320
        };

        var imovelPadaria = new Imovel
        {
            UsuarioId = padaria.Id,
            ApelidoLocal = "Padaria Pão da Vila",
            TipoImovel = "COMERCIO",
            Endereco = "Rua Central, 55",
            Bairro = "Vila Itaim",
            Cep = "08110-030",
            NumeroSerieHidrometro = "HIDRO-ELSTER-2024-1102",
            MetaConsumoMensalLitros = 25000m,
            CapacidadeCaixaLitros = 2000m,
            MoradoresAtendidos = 12
        };

        context.Imoveis.AddRange(imovelMaria, imovelEscola, imovelPadaria);
        context.SaveChanges();

        var sensorMariaRelojoaria = new SensorIoT
        {
            ImovelId = imovelMaria.Id,
            CodigoDispositivo = "ESP32-UNICAMP-REED-001",
            TipoSensor = "PULSO_RELOJOARIA_HIDROMETRO",
            ModeloHardware = "Reed Switch + Hall A3144 Acoplado à Relojoaria (Ref. PIBIC/UNICAMP)",
            FatorPulsosPorLitro = 1.0m,
            LimiteVazaoAlertaLpm = 18.0m,
            Ativo = true
        };

        var sensorMariaCaixa = new SensorIoT
        {
            ImovelId = imovelMaria.Id,
            CodigoDispositivo = "ESP32-SONAR-CAIXA-001",
            TipoSensor = "ULTRASSONICO_CAIXA_DAGUA",
            ModeloHardware = "Ultrassônico Impermeável JSN-SR04T + Pressão",
            FatorPulsosPorLitro = 1.0m,
            LimiteVazaoAlertaLpm = 18.0m,
            Ativo = true
        };

        var sensorEscola = new SensorIoT
        {
            ImovelId = imovelEscola.Id,
            CodigoDispositivo = "ESP32-UNICAMP-REED-002",
            TipoSensor = "PULSO_RELOJOARIA_HIDROMETRO",
            ModeloHardware = "Sensor Óptico/Magnético Relojoaria TCRT5000 + Hall",
            FatorPulsosPorLitro = 1.0m,
            LimiteVazaoAlertaLpm = 45.0m,
            Ativo = true
        };

        var sensorPadaria = new SensorIoT
        {
            ImovelId = imovelPadaria.Id,
            CodigoDispositivo = "ESP32-UNICAMP-REED-003",
            TipoSensor = "PULSO_RELOJOARIA_HIDROMETRO",
            ModeloHardware = "Reed Switch + Hall A3144 Acoplado à Relojoaria",
            FatorPulsosPorLitro = 1.0m,
            LimiteVazaoAlertaLpm = 25.0m,
            Ativo = true
        };

        context.SensoresIoT.AddRange(sensorMariaRelojoaria, sensorMariaCaixa, sensorEscola, sensorPadaria);
        context.SaveChanges();

        var leituraVazamentoMadrugada = new LeituraHidrometro
        {
            SensorId = sensorMariaRelojoaria.Id,
            PulsosRegistrados = 144,
            VazaoInstantaneaLpm = 2.40m,
            VolumeAcumuladoLitros = 14808.00m,
            NivelCaixaPercentual = 82.00m,
            PressaoRuaBar = 2.05m,
            DataHoraLeitura = DateTime.UtcNow.AddHours(-4)
        };

        var leituraCanoRompido = new LeituraHidrometro
        {
            SensorId = sensorEscola.Id,
            PulsosRegistrados = 3510,
            VazaoInstantaneaLpm = 58.50m,
            VolumeAcumuladoLitros = 65610.00m,
            NivelCaixaPercentual = 48.00m,
            PressaoRuaBar = 1.80m,
            DataHoraLeitura = DateTime.UtcNow.AddHours(-2)
        };

        var leituraCaixaCritica = new LeituraHidrometro
        {
            SensorId = sensorPadaria.Id,
            PulsosRegistrados = 480,
            VazaoInstantaneaLpm = 8.00m,
            VolumeAcumuladoLitros = 18880.00m,
            NivelCaixaPercentual = 16.50m,
            PressaoRuaBar = 0.00m,
            DataHoraLeitura = DateTime.UtcNow.AddHours(-1)
        };

        context.LeiturasHidrometro.AddRange(leituraVazamentoMadrugada, leituraCanoRompido, leituraCaixaCritica);
        context.SaveChanges();

        context.AlertasConsumo.AddRange(
            new AlertaConsumo
            {
                ImovelId = imovelMaria.Id,
                LeituraId = leituraVazamentoMadrugada.Id,
                TipoAlerta = "VAZAMENTO_OCULTO_MADRUGADA",
                Severidade = "MEDIA",
                Mensagem = "Fluxo contínuo de 2.4 L/min detectado na relojoaria durante a madrugada. Verifique boia da caixa d'água e válvula de descarga.",
                DesperdicioEstimadoLitros = 432.00m,
                Resolvido = false
            },
            new AlertaConsumo
            {
                ImovelId = imovelEscola.Id,
                LeituraId = leituraCanoRompido.Id,
                TipoAlerta = "CANO_ROMPIDO_PICO",
                Severidade = "CRITICA",
                Mensagem = "Vazão crítica de 58.5 L/min ultrapassou o limite da escola (45 L/min). Possível rompimento de tubulação no pátio!",
                DesperdicioEstimadoLitros = 3510.00m,
                Resolvido = false
            },
            new AlertaConsumo
            {
                ImovelId = imovelPadaria.Id,
                LeituraId = leituraCaixaCritica.Id,
                TipoAlerta = "CAIXA_DAGUA_CRITICA",
                Severidade = "CRITICA",
                Mensagem = "Pressão da rede pública caiu a 0.0 bar e reservatório atingiu 16.5%. Autonomia estimada: menos de 2 horas.",
                DesperdicioEstimadoLitros = 0.00m,
                Resolvido = false
            }
        );

        context.SaveChanges();
    }
}
