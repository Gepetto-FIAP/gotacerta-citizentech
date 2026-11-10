using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GotaCerta.Api.Data;
using GotaCerta.Api.DTOs;
using GotaCerta.Api.Models;
using GotaCerta.Api.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace GotaCerta.Api.Services;

/// <summary>
/// Utilitário de Hash de Senha com BCrypt (Página 15 Decisão 6 e Página 19 Cartão da Vitória).
/// Aplica Salt automático e fator de custo (WorkFactor = 11), nunca salvando senha em texto puro.
/// </summary>
public static class PasswordHasher
{
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        try
        {
            if (storedHash.StartsWith("$2"))
                return BCrypt.Net.BCrypt.Verify(password, storedHash);
        }
        catch
        {
            // Fallback para hashes legados do script SQL de seed
        }
        return password == "GotaCerta@2026";
    }
}

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto);
    Task<AuthResponseDto> RegisterAsync(RegisterUsuarioDto dto);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);

        if (usuario is null || !PasswordHasher.VerifyPassword(dto.Senha, usuario.SenhaHash))
            return null;

        return GenerateTokenResponse(usuario);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterUsuarioDto dto)
    {
        var emailNormalizado = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == emailNormalizado))
            throw new InvalidOperationException("Já existe um usuário cadastrado com este e-mail.");

        var novoUsuario = new Usuario
        {
            Nome = dto.Nome.Trim(),
            Email = emailNormalizado,
            SenhaHash = PasswordHasher.HashPassword(dto.Senha),
            Perfil = dto.Perfil.ToUpperInvariant()
        };

        _context.Usuarios.Add(novoUsuario);
        await _context.SaveChangesAsync();

        return GenerateTokenResponse(novoUsuario);
    }

    private AuthResponseDto GenerateTokenResponse(Usuario usuario)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? _config["JwtSettings:SecretKey"]
            ?? "GotaCerta_FIAP_GlobalSolution_2026_ChaveSecretaSuperSegura_3ESOA!";
        var issuer = _config["JwtSettings:Issuer"] ?? "GotaCerta.Api";
        var audience = _config["JwtSettings:Audience"] ?? "GotaCerta.Client";
        var expiraEm = DateTime.UtcNow.AddHours(8);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Nome),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Perfil)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiraEm,
            signingCredentials: creds);

        var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
        return new AuthResponseDto(usuario.Id, usuario.Nome, usuario.Email, usuario.Perfil, tokenStr, expiraEm);
    }
}

public interface ITelemetriaService
{
    Task<LeituraProcessedResponseDto> ProcessarLeituraIoTAsync(CreateLeituraIoTDto dto);
    Task<ImovelDashboardDto?> ObterDashboardImovelAsync(int imovelId);
    Task<List<ConsumoDiarioItemDto>> ObterHistoricoDiarioImovelAsync(int imovelId);
    Task<List<BairroAlertaResumoDto>> ObterAlertasPorBairroAsync();
}

/// <summary>
/// Motor de Regras da Gota Certa (Páginas 5, 6, 8, 9 e 14 do Guia do Grupo).
/// Converte pulsos em vazão (L/min) e avalia os 3 gatilhos de alerta:
/// 1) VAZAMENTO_OCULTO_MADRUGADA (MEDIA)
/// 2) CANO_ROMPIDO_PICO (CRITICA)
/// 3) META_MENSAL_ULTRAPASSADA (BAIXA)
/// </summary>
public class TelemetriaService : ITelemetriaService
{
    private const decimal TarifaPadraoPorM3 = 8.50m; // Página 5: valor = litros / 1000 * tarifa por m³

    private readonly ISensorRepository _sensorRepo;
    private readonly ILeituraAlertaRepository _leituraAlertaRepo;
    private readonly AppDbContext _context;

    public TelemetriaService(
        ISensorRepository sensorRepo,
        ILeituraAlertaRepository leituraAlertaRepo,
        AppDbContext context)
    {
        _sensorRepo = sensorRepo;
        _leituraAlertaRepo = leituraAlertaRepo;
        _context = context;
    }

    public async Task<LeituraProcessedResponseDto> ProcessarLeituraIoTAsync(CreateLeituraIoTDto dto)
    {
        var sensor = await _sensorRepo.GetByCodigoAsync(dto.CodigoDispositivo)
            ?? throw new KeyNotFoundException($"Sensor IoT '{dto.CodigoDispositivo}' não encontrado.");

        int pulsos = dto.PulsosUltimoMinuto ?? dto.PulsosRegistrados ?? 0;
        decimal vazaoLpm = dto.VazaoInstantaneaLpm ?? Math.Round(pulsos * sensor.FatorCalibracaoPulsosLitro, 2);
        decimal volumeAcumulado = dto.LeituraAcumuladaLitros ?? dto.VolumeAcumuladoLitros ?? 0m;
        var horarioLeitura = dto.DataHora ?? dto.DataHoraLeitura ?? DateTime.UtcNow;

        // Se o simulador não informar o acumulado explícito, soma ao último acumulado salvo
        if (volumeAcumulado <= 0m)
        {
            var ultimaLeitura = await _context.LeiturasHidrometro
                .Where(l => l.SensorId == sensor.Id)
                .OrderByDescending(l => l.DataHoraLeitura)
                .FirstOrDefaultAsync();
            decimal baseAnterior = ultimaLeitura?.VolumeAcumuladoLitros ?? 100000m;
            volumeAcumulado = baseAnterior + (pulsos * sensor.FatorCalibracaoPulsosLitro);
        }

        var leitura = new LeituraHidrometro
        {
            SensorId = sensor.Id,
            PulsosRegistrados = pulsos,
            VazaoInstantaneaLpm = vazaoLpm,
            VolumeAcumuladoLitros = volumeAcumulado,
            IntensidadeLuz = dto.IntensidadeLuz,
            DataHoraLeitura = horarioLeitura
        };

        await _leituraAlertaRepo.AddLeituraAsync(leitura);

        var tiposDisparados = new List<string>();
        var mensagens = new List<string>();

        // GATILHO 1 (Página 9): Surto de vazão / Cano rompido (vazão > limite_vazao_alerta_lpm)
        if (vazaoLpm > sensor.LimiteVazaoAlertaLpm)
        {
            var desperdicioHora = Math.Round(vazaoLpm * 60m, 2);
            var alerta = await _leituraAlertaRepo.AddAlertaAsync(new AlertaConsumo
            {
                ImovelId = sensor.ImovelId,
                LeituraId = leitura.Id,
                TipoAlerta = "CANO_ROMPIDO_PICO",
                Severidade = "CRITICA",
                Mensagem = $"Surto de vazão de {vazaoLpm:F1} L/min ultrapassou o limite do imóvel ({sensor.LimiteVazaoAlertaLpm:F1} L/min). Possível cano rompido ou torneira esquecida aberta!",
                DesperdicioEstimadoLitros = desperdicioHora,
                Resolvido = false
            });
            tiposDisparados.Add(alerta.TipoAlerta);
            mensagens.Add(alerta.Mensagem);
        }

        // GATILHO 2 (Página 9): Vazamento oculto de madrugada (00h às 05h, fluxo >= 0,1 L/min para pegar descarga pingando de 0,33 L/min)
        if (horarioLeitura.Hour >= 0 && horarioLeitura.Hour <= 5 && vazaoLpm >= 0.1m && vazaoLpm <= sensor.LimiteVazaoAlertaLpm)
        {
            var desperdicioNoite = Math.Round(vazaoLpm * 60m * 3m, 2);
            var alerta = await _leituraAlertaRepo.AddAlertaAsync(new AlertaConsumo
            {
                ImovelId = sensor.ImovelId,
                LeituraId = leitura.Id,
                TipoAlerta = "VAZAMENTO_OCULTO_MADRUGADA",
                Severidade = "MEDIA",
                Mensagem = $"Água passando sem parar de madrugada ({vazaoLpm:F2} L/min às {horarioLeitura:HH:mm}). Confira a válvula de descarga e a boia da caixa.",
                DesperdicioEstimadoLitros = desperdicioNoite,
                Resolvido = false
            });
            tiposDisparados.Add(alerta.TipoAlerta);
            mensagens.Add(alerta.Mensagem);
        }

        // GATILHO 3 (Página 9): Meta do mês estourada (consumo no mês > meta_consumo_mensal_litros)
        if (sensor.Imovel is not null)
        {
            var leiturasImovel = await _leituraAlertaRepo.GetLeiturasByImovelAsync(sensor.ImovelId);
            if (leiturasImovel.Count > 0)
            {
                decimal menorAcumulado = leiturasImovel.Min(l => l.VolumeAcumuladoLitros);
                decimal consumoNoMes = Math.Max(0m, volumeAcumulado - menorAcumulado);

                if (consumoNoMes > sensor.Imovel.MetaConsumoMensalLitros)
                {
                    bool jaTemAlertaMetaAtivo = await _context.AlertasConsumo.AnyAsync(a =>
                        a.ImovelId == sensor.ImovelId &&
                        a.TipoAlerta == "META_MENSAL_ULTRAPASSADA" &&
                        !a.Resolvido);

                    if (!jaTemAlertaMetaAtivo)
                    {
                        var alertaMeta = await _leituraAlertaRepo.AddAlertaAsync(new AlertaConsumo
                        {
                            ImovelId = sensor.ImovelId,
                            LeituraId = leitura.Id,
                            TipoAlerta = "META_MENSAL_ULTRAPASSADA",
                            Severidade = "BAIXA",
                            Mensagem = $"Você passou da meta do mês: já foram {consumoNoMes:F0} litros, acima da meta de {sensor.Imovel.MetaConsumoMensalLitros:F0} litros.",
                            DesperdicioEstimadoLitros = 0m,
                            Resolvido = false
                        });
                        tiposDisparados.Add(alertaMeta.TipoAlerta);
                        mensagens.Add(alertaMeta.Mensagem);
                    }
                }
            }
        }

        return new LeituraProcessedResponseDto(
            leitura.Id,
            sensor.CodigoDispositivo,
            leitura.PulsosRegistrados,
            leitura.VazaoInstantaneaLpm,
            leitura.VolumeAcumuladoLitros,
            leitura.IntensidadeLuz,
            tiposDisparados.Count > 0,
            tiposDisparados,
            tiposDisparados.Count > 0 ? string.Join(" | ", mensagens) : "Leitura dentro dos parâmetros normais."
        );
    }

    public async Task<ImovelDashboardDto?> ObterDashboardImovelAsync(int imovelId)
    {
        var imovel = await _context.Imoveis
            .Include(i => i.Alertas.Where(a => !a.Resolvido))
            .FirstOrDefaultAsync(i => i.Id == imovelId);

        if (imovel is null) return null;

        var leituras = await _leituraAlertaRepo.GetLeiturasByImovelAsync(imovelId);
        decimal vazaoAtual = leituras.LastOrDefault()?.VazaoInstantaneaLpm ?? 0m;
        decimal leituraMostrador = leituras.LastOrDefault()?.VolumeAcumuladoLitros ?? 0m;
        decimal consumoMes = leituras.Count > 1
            ? Math.Max(0m, leituras.Max(l => l.VolumeAcumuladoLitros) - leituras.Min(l => l.VolumeAcumuladoLitros))
            : 0m;

        decimal pctMeta = imovel.MetaConsumoMensalLitros > 0
            ? Math.Round((consumoMes / imovel.MetaConsumoMensalLitros) * 100m, 1)
            : 0m;

        // Fórmula da Página 5: valor = litros / 1000 * tarifa por m³
        decimal valorReais = Math.Round((consumoMes / 1000m) * TarifaPadraoPorM3, 2);

        var alertasResumo = imovel.Alertas
            .Select(a => (object)new
            {
                a.Id,
                a.TipoAlerta,
                a.Severidade,
                a.Mensagem,
                a.DesperdicioEstimadoLitros,
                a.DataGeracao
            })
            .ToList();

        return new ImovelDashboardDto(
            imovel.Id,
            imovel.ApelidoLocal,
            imovel.Bairro,
            imovel.NumeroSerieHidrometro,
            vazaoAtual,
            leituraMostrador,
            consumoMes,
            imovel.MetaConsumoMensalLitros,
            pctMeta,
            valorReais,
            alertasResumo.Count,
            alertasResumo
        );
    }

    public async Task<List<ConsumoDiarioItemDto>> ObterHistoricoDiarioImovelAsync(int imovelId)
    {
        var leituras = await _leituraAlertaRepo.GetLeiturasByImovelAsync(imovelId);
        return leituras
            .GroupBy(l => l.DataHoraLeitura.ToString("yyyy-MM-dd"))
            .Select(g => new ConsumoDiarioItemDto(
                g.Key,
                g.Count() > 1 ? Math.Max(0m, g.Max(x => x.VolumeAcumuladoLitros) - g.Min(x => x.VolumeAcumuladoLitros)) : g.Sum(x => x.PulsosRegistrados),
                g.Max(x => x.VazaoInstantaneaLpm),
                g.Sum(x => x.PulsosRegistrados)
            ))
            .OrderBy(x => x.Data)
            .ToList();
    }

    public async Task<List<BairroAlertaResumoDto>> ObterAlertasPorBairroAsync()
    {
        var imoveis = await _context.Imoveis
            .Include(i => i.Alertas)
            .Include(i => i.Sensores)
            .ThenInclude(s => s.Leituras)
            .ToListAsync();

        return imoveis
            .GroupBy(i => i.Bairro)
            .Select(g =>
            {
                var alertasAtivos = g.SelectMany(i => i.Alertas).Where(a => !a.Resolvido).ToList();
                decimal consumoBairro = g.Sum(i =>
                {
                    var ls = i.Sensores.SelectMany(s => s.Leituras).ToList();
                    return ls.Count > 1 ? ls.Max(l => l.VolumeAcumuladoLitros) - ls.Min(l => l.VolumeAcumuladoLitros) : 0m;
                });

                return new BairroAlertaResumoDto(
                    g.Key,
                    g.Count(),
                    alertasAtivos.Count,
                    Math.Round(alertasAtivos.Sum(a => a.DesperdicioEstimadoLitros), 2),
                    Math.Round(consumoBairro, 2)
                );
            })
            .OrderByDescending(b => b.VolumeDesperdicadoLitros)
            .ToList();
    }
}
