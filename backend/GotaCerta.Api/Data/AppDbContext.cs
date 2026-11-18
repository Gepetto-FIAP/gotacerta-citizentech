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
            Nome = "Antônio Schappo (Gestor da Comunidade)",
            Email = "admin@gotacerta.org.br",
            SenhaHash = senhaPadraoHash,
            Perfil = "ADMIN"
        };

        var maria = new Usuario
        {
            Nome = "Dona Maria Aparecida Silva",
            Email = "maria.silva@email.com",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR"
        };

        var escola = new Usuario
        {
            Nome = "Carlos Eduardo Santos (EMEI Luz do Saber)",
            Email = "diretoria@emeiluzdosaber.edu.br",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR"
        };

        var padaria = new Usuario
        {
            Nome = "Padaria Comunitária Pão da Vila",
            Email = "contato@paodavila.com.br",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR"
        };

        var joao = new Usuario
        {
            Nome = "João Pereira (Morador Vila Itaim)",
            Email = "joao.pereira@email.com",
            SenhaHash = senhaPadraoHash,
            Perfil = "MORADOR"
        };

        context.Usuarios.AddRange(admin, maria, escola, padaria, joao);
        context.SaveChanges();

        var imovelMaria = new Imovel
        {
            UsuarioId = maria.Id,
            ApelidoLocal = "Residência Dona Maria",
            Endereco = "Rua das Acácias, 142",
            Bairro = "Jardim Pantanal",
            Cep = "08090-100",
            NumeroSerieHidrometro = "HIDRO-LAO-2024-8891",
            MetaConsumoMensalLitros = 10000m
        };

        var imovelEscola = new Imovel
        {
            UsuarioId = escola.Id,
            ApelidoLocal = "EMEI Luz do Saber",
            Endereco = "Av. Esperança, 850",
            Bairro = "Jardim Pantanal",
            Cep = "08090-210",
            NumeroSerieHidrometro = "HIDRO-SABESP-2023-4410",
            MetaConsumoMensalLitros = 80000m
        };

        var imovelPadaria = new Imovel
        {
            UsuarioId = padaria.Id,
            ApelidoLocal = "Padaria Pão da Vila",
            Endereco = "Rua Central, 55",
            Bairro = "Vila Itaim",
            Cep = "08110-030",
            NumeroSerieHidrometro = "HIDRO-ELSTER-2024-1102",
            MetaConsumoMensalLitros = 20000m
        };

        var imovelJoao = new Imovel
        {
            UsuarioId = joao.Id,
            ApelidoLocal = "Casa do Sr. João Pereira",
            Endereco = "Travessa União, 19",
            Bairro = "Vila Itaim",
            Cep = "08110-080",
            NumeroSerieHidrometro = "HIDRO-ITRON-2022-9920",
            MetaConsumoMensalLitros = 9000m
        };

        context.Imoveis.AddRange(imovelMaria, imovelEscola, imovelPadaria, imovelJoao);
        context.SaveChanges();

        var sensorMariaFoto = new SensorIoT
        {
            ImovelId = imovelMaria.Id,
            CodigoDispositivo = "GC-001",
            TipoSensor = "FOTOTRANSISTOR",
            FatorCalibracaoPulsosLitro = 1.0m,
            LimiteVazaoAlertaLpm = 20.0m,
            StatusAtivo = true
        };

        var sensorMariaIr = new SensorIoT
        {
            ImovelId = imovelMaria.Id,
            CodigoDispositivo = "GC-001-IR",
            TipoSensor = "LED_IR",
            FatorCalibracaoPulsosLitro = 1.0m,
            LimiteVazaoAlertaLpm = 20.0m,
            StatusAtivo = true
        };

        var sensorEscola = new SensorIoT
        {
            ImovelId = imovelEscola.Id,
            CodigoDispositivo = "GC-002",
            TipoSensor = "FOTOTRANSISTOR",
            FatorCalibracaoPulsosLitro = 1.0m,
            LimiteVazaoAlertaLpm = 45.0m,
            StatusAtivo = true
        };

        var sensorPadaria = new SensorIoT
        {
            ImovelId = imovelPadaria.Id,
            CodigoDispositivo = "GC-003",
            TipoSensor = "FOTOTRANSISTOR",
            FatorCalibracaoPulsosLitro = 1.0m,
            LimiteVazaoAlertaLpm = 25.0m,
            StatusAtivo = true
        };

        var sensorJoao = new SensorIoT
        {
            ImovelId = imovelJoao.Id,
            CodigoDispositivo = "GC-004",
            TipoSensor = "FOTOTRANSISTOR",
            FatorCalibracaoPulsosLitro = 1.0m,
            LimiteVazaoAlertaLpm = 20.0m,
            StatusAtivo = true
        };

        context.SensoresIoT.AddRange(sensorMariaFoto, sensorMariaIr, sensorEscola, sensorPadaria, sensorJoao);
        context.SaveChanges();

        var lMariaInicio = new LeituraHidrometro
        {
            SensorId = sensorMariaFoto.Id,
            PulsosRegistrados = 0,
            VazaoInstantaneaLpm = 0.00m,
            VolumeAcumuladoLitros = 1224432.00m,
            IntensidadeLuz = 0.85m,
            DataHoraLeitura = new DateTime(2026, 11, 1, 0, 5, 0, DateTimeKind.Utc)
        };

        var lMariaMadrugada1 = new LeituraHidrometro
        {
            SensorId = sensorMariaFoto.Id,
            PulsosRegistrados = 72,
            VazaoInstantaneaLpm = 1.20m,
            VolumeAcumuladoLitros = 1230100.00m,
            IntensidadeLuz = 0.18m,
            DataHoraLeitura = new DateTime(2026, 11, 8, 2, 0, 0, DateTimeKind.Utc)
        };

        var lMariaMadrugada2 = new LeituraHidrometro
        {
            SensorId = sensorMariaFoto.Id,
            PulsosRegistrados = 72,
            VazaoInstantaneaLpm = 1.20m,
            VolumeAcumuladoLitros = 1230172.00m,
            IntensidadeLuz = 0.17m,
            DataHoraLeitura = new DateTime(2026, 11, 8, 3, 0, 0, DateTimeKind.Utc)
        };

        var lMariaMadrugada3 = new LeituraHidrometro
        {
            SensorId = sensorMariaFoto.Id,
            PulsosRegistrados = 72,
            VazaoInstantaneaLpm = 1.20m,
            VolumeAcumuladoLitros = 1230244.00m,
            IntensidadeLuz = 0.18m,
            DataHoraLeitura = new DateTime(2026, 11, 8, 4, 0, 0, DateTimeKind.Utc)
        };

        var lMariaMeta = new LeituraHidrometro
        {
            SensorId = sensorMariaFoto.Id,
            PulsosRegistrados = 350,
            VazaoInstantaneaLpm = 5.80m,
            VolumeAcumuladoLitros = 1234582.00m,
            IntensidadeLuz = 0.82m,
            DataHoraLeitura = new DateTime(2026, 11, 9, 18, 0, 0, DateTimeKind.Utc)
        };

        var lEscolaInicio = new LeituraHidrometro
        {
            SensorId = sensorEscola.Id,
            PulsosRegistrados = 0,
            VazaoInstantaneaLpm = 0.00m,
            VolumeAcumuladoLitros = 500000.00m,
            IntensidadeLuz = 0.88m,
            DataHoraLeitura = new DateTime(2026, 11, 1, 0, 5, 0, DateTimeKind.Utc)
        };

        var lEscolaMeioDia = new LeituraHidrometro
        {
            SensorId = sensorEscola.Id,
            PulsosRegistrados = 600,
            VazaoInstantaneaLpm = 10.00m,
            VolumeAcumuladoLitros = 542100.00m,
            IntensidadeLuz = 0.80m,
            DataHoraLeitura = new DateTime(2026, 11, 8, 12, 0, 0, DateTimeKind.Utc)
        };

        var lEscolaPico = new LeituraHidrometro
        {
            SensorId = sensorEscola.Id,
            PulsosRegistrados = 3510,
            VazaoInstantaneaLpm = 58.50m,
            VolumeAcumuladoLitros = 545610.00m,
            IntensidadeLuz = 0.15m,
            DataHoraLeitura = new DateTime(2026, 11, 8, 13, 0, 0, DateTimeKind.Utc)
        };

        var lPadariaInicio = new LeituraHidrometro
        {
            SensorId = sensorPadaria.Id,
            PulsosRegistrados = 0,
            VazaoInstantaneaLpm = 0.00m,
            VolumeAcumuladoLitros = 800000.00m,
            IntensidadeLuz = 0.86m,
            DataHoraLeitura = new DateTime(2026, 11, 1, 0, 5, 0, DateTimeKind.Utc)
        };

        var lPadariaMeta = new LeituraHidrometro
        {
            SensorId = sensorPadaria.Id,
            PulsosRegistrados = 540,
            VazaoInstantaneaLpm = 9.00m,
            VolumeAcumuladoLitros = 821400.00m,
            IntensidadeLuz = 0.79m,
            DataHoraLeitura = new DateTime(2026, 11, 8, 16, 0, 0, DateTimeKind.Utc)
        };

        var lJoaoInicio = new LeituraHidrometro
        {
            SensorId = sensorJoao.Id,
            PulsosRegistrados = 0,
            VazaoInstantaneaLpm = 0.00m,
            VolumeAcumuladoLitros = 310000.00m,
            IntensidadeLuz = 0.87m,
            DataHoraLeitura = new DateTime(2026, 11, 1, 0, 5, 0, DateTimeKind.Utc)
        };

        var lJoaoMadrugada = new LeituraHidrometro
        {
            SensorId = sensorJoao.Id,
            PulsosRegistrados = 24,
            VazaoInstantaneaLpm = 0.40m,
            VolumeAcumuladoLitros = 314200.00m,
            IntensidadeLuz = 0.20m,
            DataHoraLeitura = new DateTime(2026, 11, 9, 3, 30, 0, DateTimeKind.Utc)
        };

        context.LeiturasHidrometro.AddRange(
            lMariaInicio, lMariaMadrugada1, lMariaMadrugada2, lMariaMadrugada3, lMariaMeta,
            lEscolaInicio, lEscolaMeioDia, lEscolaPico,
            lPadariaInicio, lPadariaMeta,
            lJoaoInicio, lJoaoMadrugada);
        context.SaveChanges();

        context.AlertasConsumo.AddRange(
            new AlertaConsumo
            {
                ImovelId = imovelMaria.Id,
                LeituraId = lMariaMadrugada3.Id,
                TipoAlerta = "VAZAMENTO_OCULTO_MADRUGADA",
                Severidade = "MEDIA",
                Mensagem = "Água passando sem parar desde a meia-noite, cerca de 1,2 L/min. Confira a descarga e a boia da caixa.",
                DesperdicioEstimadoLitros = 216.00m,
                Resolvido = false
            },
            new AlertaConsumo
            {
                ImovelId = imovelMaria.Id,
                LeituraId = lMariaMeta.Id,
                TipoAlerta = "META_MENSAL_ULTRAPASSADA",
                Severidade = "BAIXA",
                Mensagem = "Você passou da meta do mês: já foram 10.150 litros, acima da meta de 10.000 litros.",
                DesperdicioEstimadoLitros = 0.00m,
                Resolvido = false
            },
            new AlertaConsumo
            {
                ImovelId = imovelEscola.Id,
                LeituraId = lEscolaPico.Id,
                TipoAlerta = "CANO_ROMPIDO_PICO",
                Severidade = "CRITICA",
                Mensagem = "Surto de vazão de 58,5 L/min ultrapassou o limite do imóvel (45,0 L/min). Possível cano rompido ou torneira aberta!",
                DesperdicioEstimadoLitros = 3510.00m,
                Resolvido = false
            },
            new AlertaConsumo
            {
                ImovelId = imovelPadaria.Id,
                LeituraId = lPadariaMeta.Id,
                TipoAlerta = "META_MENSAL_ULTRAPASSADA",
                Severidade = "BAIXA",
                Mensagem = "Consumo acumulado no mês atingiu 21.400 litros, ultrapassando a meta de 20.000 litros.",
                DesperdicioEstimadoLitros = 0.00m,
                Resolvido = false
            },
            new AlertaConsumo
            {
                ImovelId = imovelJoao.Id,
                LeituraId = lJoaoMadrugada.Id,
                TipoAlerta = "VAZAMENTO_OCULTO_MADRUGADA",
                Severidade = "MEDIA",
                Mensagem = "Fluxo contínuo de 0,40 L/min na madrugada (24 L/h). Verifique se há válvula de descarga pingando.",
                DesperdicioEstimadoLitros = 96.00m,
                Resolvido = false
            }
        );

        context.SaveChanges();
    }
}
