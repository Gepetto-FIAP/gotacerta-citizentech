using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;
using GotaCerta.Api.Data;
using GotaCerta.Api.Repositories;
using GotaCerta.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração do Banco de Dados (SQLite por padrão local, MySQL quando configurado via Docker)
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbProvider.Equals("MySql", StringComparison.OrdinalIgnoreCase))
    {
        var mySqlConn = builder.Configuration.GetConnectionString("MySqlConnection");
        options.UseMySql(mySqlConn, ServerVersion.AutoDetect(mySqlConn));
    }
    else
    {
        var sqliteConn = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=gotacerta.db";
        options.UseSqlite(sqliteConn);
    }
});

// 2. Injeção de Dependência das Camadas (Repositories & Services)
builder.Services.AddScoped<IImovelRepository, ImovelRepository>();
builder.Services.AddScoped<ISensorRepository, SensorRepository>();
builder.Services.AddScoped<ILeituraAlertaRepository, LeituraAlertaRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITelemetriaService, TelemetriaService>();

// 3. Configuração de Autenticação JWT Bearer e Controle de Acesso (RBAC)
// A chave é lida na MESMA ordem usada pelo AuthService (variável de ambiente > appsettings > padrão de dev).
// Antes, o Program.cs ignorava a variável JWT_SECRET_KEY e o AuthService não: se ela fosse definida
// (ex.: no Docker), os tokens seriam assinados com uma chave e validados com outra, e tudo daria 401.
const string ChavePadraoDev = "GotaCerta_FIAP_GlobalSolution_2026_ChaveSecretaSuperSegura_3ESOA!";
var jwtSecretConfigurado = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? builder.Configuration["JwtSettings:SecretKey"];
var jwtSecret = jwtSecretConfigurado ?? ChavePadraoDev;
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "GotaCerta.Api";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "GotaCerta.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

builder.Services.AddAuthorization();

// 3.1 Limite de tentativas no login (anti força bruta — OWASP Authentication Failures).
// 10 requisições por minuto por IP; acima disso a API responde 429 Too Many Requests.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// 4. CORS liberado para o Frontend Mobile-First (Next.js do Danilo)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 5. Documentação Swagger (OpenAPI) com suporte a autenticação JWT Bearer
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GotaCerta API — CitizenTech (FIAP Global Solution 2026/2 - 3ESOA)",
        Version = "v1",
        Description = "API RESTful em camadas para telemetria não-invasiva de hidrômetros residenciais/escolares (Ref. PIBIC/UNICAMP), detecção ágil de vazamentos e alerta comunitário de falta d'água."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT obtido em POST /api/auth/login."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath);
});

var app = builder.Build();

if (jwtSecretConfigurado is null)
    app.Logger.LogWarning("JWT: usando a chave padrão de DESENVOLVIMENTO. Em produção defina a variável de ambiente JWT_SECRET_KEY.");

// Inicializa e popula o banco automaticamente no primeiro boot
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbInitializer.Seed(db);
}

// Cabeçalhos de segurança básicos (OWASP Security Misconfiguration)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseCors("AllowFrontend");
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GotaCerta API v1");
    c.RoutePrefix = "swagger";
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
