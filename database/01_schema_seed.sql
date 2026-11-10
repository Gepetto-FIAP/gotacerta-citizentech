-- ============================================================================
-- FIAP - GLOBAL SOLUTION 2026/2 - CITIZENTECH (3ESOA)
-- PROJETO: GOTA CERTA - TELEMETRIA ACESSÍVEL PARA HIDRÔMETROS CONVENCIONAIS
-- ARQUIVO: 01_schema_seed.sql (SQLite3 - Modelo Oficial da Página 13 do Guia)
-- RESPONSÁVEL: Antônio Aloísio Schappo Neto (RM556429)
-- ============================================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS alertas_consumo;
DROP TABLE IF EXISTS leituras_hidrometro;
DROP TABLE IF EXISTS sensores_iot;
DROP TABLE IF EXISTS imoveis;
DROP TABLE IF EXISTS usuarios;

-- ----------------------------------------------------------------------------
-- 1. TABELA: usuarios
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL CHECK (perfil IN ('MORADOR', 'ADMIN')),
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABELA: imoveis
-- ----------------------------------------------------------------------------
CREATE TABLE imoveis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    apelido_local VARCHAR(100) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    bairro VARCHAR(80) NOT NULL,
    cep VARCHAR(15) NOT NULL,
    numero_serie_hidrometro VARCHAR(50) NOT NULL UNIQUE,
    meta_consumo_mensal_litros DECIMAL(10,2) NOT NULL CHECK (meta_consumo_mensal_litros > 0),
    CONSTRAINT fk_imoveis_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. TABELA: sensores_iot
-- Sensor 1: LED_IR (emissor infravermelho que ilumina o ponteiro x0,0001)
-- Sensor 2: FOTOTRANSISTOR (receptor óptico que mede a luz refletida e conta voltas)
-- ----------------------------------------------------------------------------
CREATE TABLE sensores_iot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imovel_id INTEGER NOT NULL,
    codigo_dispositivo VARCHAR(60) NOT NULL UNIQUE,
    tipo_sensor VARCHAR(40) NOT NULL CHECK (tipo_sensor IN ('LED_IR', 'FOTOTRANSISTOR')),
    fator_calibracao_pulsos_litro DECIMAL(8,2) NOT NULL DEFAULT 1.00 CHECK (fator_calibracao_pulsos_litro > 0),
    limite_vazao_alerta_lpm DECIMAL(8,2) NOT NULL DEFAULT 25.00 CHECK (limite_vazao_alerta_lpm > 0),
    status_ativo INTEGER NOT NULL DEFAULT 1 CHECK (status_ativo IN (0, 1)),
    CONSTRAINT fk_sensores_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. TABELA: leituras_hidrometro
-- Cada volta do ponteiro vermelho (x0,0001 m³) = 1 pulso = 1 litro.
-- ----------------------------------------------------------------------------
CREATE TABLE leituras_hidrometro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER NOT NULL,
    pulsos_registrados INTEGER NOT NULL CHECK (pulsos_registrados >= 0),
    vazao_instantanea_lpm DECIMAL(10,2) NOT NULL CHECK (vazao_instantanea_lpm >= 0),
    volume_acumulado_litros DECIMAL(12,2) NOT NULL CHECK (volume_acumulado_litros >= 0),
    intensidade_luz DECIMAL(5,2) CHECK (intensidade_luz IS NULL OR (intensidade_luz >= 0 AND intensidade_luz <= 1.00)),
    data_hora_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leituras_sensor FOREIGN KEY (sensor_id) REFERENCES sensores_iot(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. TABELA: alertas_consumo
-- Os 3 gatilhos da Página 9 do Guia:
-- 1) VAZAMENTO_OCULTO_MADRUGADA (MEDIA)
-- 2) CANO_ROMPIDO_PICO (CRITICA)
-- 3) META_MENSAL_ULTRAPASSADA (BAIXA)
-- ----------------------------------------------------------------------------
CREATE TABLE alertas_consumo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imovel_id INTEGER NOT NULL,
    leitura_id INTEGER,
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('VAZAMENTO_OCULTO_MADRUGADA', 'CANO_ROMPIDO_PICO', 'META_MENSAL_ULTRAPASSADA')),
    severidade VARCHAR(20) NOT NULL CHECK (severidade IN ('BAIXA', 'MEDIA', 'CRITICA')),
    mensagem VARCHAR(300) NOT NULL,
    desperdicio_estimado_litros DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (desperdicio_estimado_litros >= 0),
    resolvido INTEGER NOT NULL DEFAULT 0 CHECK (resolvido IN (0, 1)),
    data_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alertas_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
    CONSTRAINT fk_alertas_leitura FOREIGN KEY (leitura_id) REFERENCES leituras_hidrometro(id) ON DELETE SET NULL
);

-- ============================================================================
-- CARGA INICIAL DE DADOS (SEED DATA)
-- ============================================================================

-- 1. Usuários (Senhas em hash BCrypt para "GotaCerta@2026")
INSERT INTO usuarios (id, nome, email, senha_hash, perfil, criado_em) VALUES
(1, 'Antônio Schappo (Gestor da Comunidade)', 'admin@gotacerta.org.br', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'ADMIN', '2026-11-01 08:00:00'),
(2, 'Dona Maria Aparecida Silva', 'maria.silva@email.com', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-01 09:15:00'),
(3, 'Carlos Eduardo Santos (EMEI Luz do Saber)', 'diretoria@emeiluzdosaber.edu.br', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-02 10:30:00'),
(4, 'Padaria Comunitária Pão da Vila', 'contato@paodavila.com.br', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-02 14:00:00'),
(5, 'João Pereira (Morador Vila Itaim)', 'joao.pereira@email.com', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-03 11:20:00');

-- 2. Imóveis monitorados
INSERT INTO imoveis (id, usuario_id, apelido_local, endereco, bairro, cep, numero_serie_hidrometro, meta_consumo_mensal_litros) VALUES
(1, 2, 'Residência Dona Maria', 'Rua das Acácias, 142', 'Jardim Pantanal', '08090-100', 'HIDRO-LAO-2024-8891', 10000.00),
(2, 3, 'EMEI Luz do Saber', 'Av. Esperança, 850', 'Jardim Pantanal', '08090-210', 'HIDRO-SABESP-2023-4410', 80000.00),
(3, 4, 'Padaria Pão da Vila', 'Rua Central, 55', 'Vila Itaim', '08110-030', 'HIDRO-ELSTER-2024-1102', 20000.00),
(4, 5, 'Casa do Sr. João Pereira', 'Travessa União, 19', 'Vila Itaim', '08110-080', 'HIDRO-ITRON-2022-9920', 9000.00);

-- 3. Sensores IoT (Par óptico acoplado sobre o vidro do hidrômetro: LED_IR e FOTOTRANSISTOR)
INSERT INTO sensores_iot (id, imovel_id, codigo_dispositivo, tipo_sensor, fator_calibracao_pulsos_litro, limite_vazao_alerta_lpm, status_ativo) VALUES
(1, 1, 'GC-001', 'FOTOTRANSISTOR', 1.00, 20.00, 1),
(2, 1, 'GC-001-IR', 'LED_IR', 1.00, 20.00, 1),
(3, 2, 'GC-002', 'FOTOTRANSISTOR', 1.00, 45.00, 1),
(4, 3, 'GC-003', 'FOTOTRANSISTOR', 1.00, 25.00, 1),
(5, 4, 'GC-004', 'FOTOTRANSISTOR', 1.00, 20.00, 1);

-- 4. Leituras do Hidrômetro (Simulando os 3 cenários de alerta + histórico diário)
INSERT INTO leituras_hidrometro (id, sensor_id, pulsos_registrados, vazao_instantanea_lpm, volume_acumulado_litros, intensidade_luz, data_hora_leitura) VALUES
-- Imóvel 1 (Dona Maria): leitura no início do mês + vazamento oculto contínuo na madrugada (1,2 L/min) + meta estourada (10.150 L > 10.000 L)
(1, 1, 0, 0.00, 1224432.00, 0.85, '2026-11-01 00:05:00'),
(2, 1, 72, 1.20, 1230100.00, 0.18, '2026-11-08 02:00:00'),
(3, 1, 72, 1.20, 1230172.00, 0.17, '2026-11-08 03:00:00'),
(4, 1, 72, 1.20, 1230244.00, 0.18, '2026-11-08 04:00:00'),
(5, 1, 350, 5.80, 1234582.00, 0.82, '2026-11-09 18:00:00'),
-- Imóvel 2 (EMEI Luz do Saber): leitura inicial + surto de vazão / cano rompido (58,5 L/min > limite 45 L/min)
(6, 3, 0, 0.00, 500000.00, 0.88, '2026-11-01 00:05:00'),
(7, 3, 600, 10.00, 542100.00, 0.80, '2026-11-08 12:00:00'),
(8, 3, 3510, 58.50, 545610.00, 0.15, '2026-11-08 13:00:00'),
-- Imóvel 3 (Padaria Pão da Vila): consumo acima da meta mensal (21.400 L > 20.000 L)
(9, 4, 0, 0.00, 800000.00, 0.86, '2026-11-01 00:05:00'),
(10, 4, 540, 9.00, 821400.00, 0.79, '2026-11-08 16:00:00'),
-- Imóvel 4 (Sr. João Pereira): vazamento de descarga pingando de madrugada (0,40 L/min às 03h)
(11, 5, 0, 0.00, 310000.00, 0.87, '2026-11-01 00:05:00'),
(12, 5, 24, 0.40, 314200.00, 0.20, '2026-11-09 03:30:00');

-- 5. Alertas Gerados pelos 3 Gatilhos (Página 9 do Guia)
INSERT INTO alertas_consumo (id, imovel_id, leitura_id, tipo_alerta, severidade, mensagem, desperdicio_estimado_litros, resolvido, data_geracao) VALUES
(1, 1, 4, 'VAZAMENTO_OCULTO_MADRUGADA', 'MEDIA', 'Água passando sem parar desde a meia-noite, cerca de 1,2 L/min. Confira a descarga e a boia da caixa.', 216.00, 0, '2026-11-08 04:12:00'),
(2, 1, 5, 'META_MENSAL_ULTRAPASSADA', 'BAIXA', 'Você passou da meta do mês: já foram 10.150 litros, acima da meta de 10.000 litros.', 0.00, 0, '2026-11-09 18:01:00'),
(3, 2, 8, 'CANO_ROMPIDO_PICO', 'CRITICA', 'Surto de vazão de 58,5 L/min ultrapassou o limite do imóvel (45,0 L/min). Possível cano rompido ou torneira aberta!', 3510.00, 0, '2026-11-08 13:01:00'),
(4, 3, 10, 'META_MENSAL_ULTRAPASSADA', 'BAIXA', 'Consumo acumulado no mês atingiu 21.400 litros, ultrapassando a meta de 20.000 litros.', 0.00, 0, '2026-11-08 16:01:00'),
(5, 4, 12, 'VAZAMENTO_OCULTO_MADRUGADA', 'MEDIA', 'Fluxo contínuo de 0,40 L/min na madrugada (24 L/h). Verifique se há válvula de descarga pingando.', 96.00, 0, '2026-11-09 03:31:00');
