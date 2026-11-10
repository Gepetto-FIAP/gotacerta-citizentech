-- ============================================================================
-- FIAP - GLOBAL SOLUTION 2026/2 - CITIZENTECH (3ESOA)
-- PROJETO: GOTA CERTA - TELEMETRIA ACESSÍVEL PARA HIDRÔMETROS CONVENCIONAIS
-- ARQUIVO: 01_schema_seed_mysql.sql (MySQL 8.0 - Modelo Oficial da Página 13)
-- RESPONSÁVEL: Antônio Aloísio Schappo Neto (RM556429)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS alertas_consumo;
DROP TABLE IF EXISTS leituras_hidrometro;
DROP TABLE IF EXISTS sensores_iot;
DROP TABLE IF EXISTS imoveis;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuarios_perfil CHECK (perfil IN ('MORADOR', 'ADMIN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE imoveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    apelido_local VARCHAR(100) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    bairro VARCHAR(80) NOT NULL,
    cep VARCHAR(15) NOT NULL,
    numero_serie_hidrometro VARCHAR(50) NOT NULL UNIQUE,
    meta_consumo_mensal_litros DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_imoveis_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT chk_imoveis_meta CHECK (meta_consumo_mensal_litros > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sensores_iot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imovel_id INT NOT NULL,
    codigo_dispositivo VARCHAR(60) NOT NULL UNIQUE,
    tipo_sensor VARCHAR(40) NOT NULL,
    fator_calibracao_pulsos_litro DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    limite_vazao_alerta_lpm DECIMAL(8,2) NOT NULL DEFAULT 25.00,
    status_ativo TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_sensores_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
    CONSTRAINT chk_sensores_tipo CHECK (tipo_sensor IN ('LED_IR', 'FOTOTRANSISTOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE leituras_hidrometro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    pulsos_registrados INT NOT NULL,
    vazao_instantanea_lpm DECIMAL(10,2) NOT NULL,
    volume_acumulado_litros DECIMAL(12,2) NOT NULL,
    intensidade_luz DECIMAL(5,2) NULL,
    data_hora_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leituras_sensor FOREIGN KEY (sensor_id) REFERENCES sensores_iot(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alertas_consumo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imovel_id INT NOT NULL,
    leitura_id INT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    severidade VARCHAR(20) NOT NULL,
    mensagem VARCHAR(300) NOT NULL,
    desperdicio_estimado_litros DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    resolvido TINYINT(1) NOT NULL DEFAULT 0,
    data_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alertas_imovel FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE,
    CONSTRAINT fk_alertas_leitura FOREIGN KEY (leitura_id) REFERENCES leituras_hidrometro(id) ON DELETE SET NULL,
    CONSTRAINT chk_alertas_tipo CHECK (tipo_alerta IN ('VAZAMENTO_OCULTO_MADRUGADA', 'CANO_ROMPIDO_PICO', 'META_MENSAL_ULTRAPASSADA')),
    CONSTRAINT chk_alertas_sev CHECK (severidade IN ('BAIXA', 'MEDIA', 'CRITICA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO usuarios (id, nome, email, senha_hash, perfil, criado_em) VALUES
(1, 'Antônio Schappo (Gestor da Comunidade)', 'admin@gotacerta.org.br', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'ADMIN', '2026-11-01 08:00:00'),
(2, 'Dona Maria Aparecida Silva', 'maria.silva@email.com', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-01 09:15:00'),
(3, 'Carlos Eduardo Santos (EMEI Luz do Saber)', 'diretoria@emeiluzdosaber.edu.br', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-02 10:30:00'),
(4, 'Padaria Comunitária Pão da Vila', 'contato@paodavila.com.br', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-02 14:00:00'),
(5, 'João Pereira (Morador Vila Itaim)', 'joao.pereira@email.com', '$2a$11$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW', 'MORADOR', '2026-11-03 11:20:00');

INSERT INTO imoveis (id, usuario_id, apelido_local, endereco, bairro, cep, numero_serie_hidrometro, meta_consumo_mensal_litros) VALUES
(1, 2, 'Residência Dona Maria', 'Rua das Acácias, 142', 'Jardim Pantanal', '08090-100', 'HIDRO-LAO-2024-8891', 10000.00),
(2, 3, 'EMEI Luz do Saber', 'Av. Esperança, 850', 'Jardim Pantanal', '08090-210', 'HIDRO-SABESP-2023-4410', 80000.00),
(3, 4, 'Padaria Pão da Vila', 'Rua Central, 55', 'Vila Itaim', '08110-030', 'HIDRO-ELSTER-2024-1102', 20000.00),
(4, 5, 'Casa do Sr. João Pereira', 'Travessa União, 19', 'Vila Itaim', '08110-080', 'HIDRO-ITRON-2022-9920', 9000.00);

INSERT INTO sensores_iot (id, imovel_id, codigo_dispositivo, tipo_sensor, fator_calibracao_pulsos_litro, limite_vazao_alerta_lpm, status_ativo) VALUES
(1, 1, 'GC-001', 'FOTOTRANSISTOR', 1.00, 20.00, 1),
(2, 1, 'GC-001-IR', 'LED_IR', 1.00, 20.00, 1),
(3, 2, 'GC-002', 'FOTOTRANSISTOR', 1.00, 45.00, 1),
(4, 3, 'GC-003', 'FOTOTRANSISTOR', 1.00, 25.00, 1),
(5, 4, 'GC-004', 'FOTOTRANSISTOR', 1.00, 20.00, 1);

INSERT INTO leituras_hidrometro (id, sensor_id, pulsos_registrados, vazao_instantanea_lpm, volume_acumulado_litros, intensidade_luz, data_hora_leitura) VALUES
(1, 1, 0, 0.00, 1224432.00, 0.85, '2026-11-01 00:05:00'),
(2, 1, 72, 1.20, 1230100.00, 0.18, '2026-11-08 02:00:00'),
(3, 1, 72, 1.20, 1230172.00, 0.17, '2026-11-08 03:00:00'),
(4, 1, 72, 1.20, 1230244.00, 0.18, '2026-11-08 04:00:00'),
(5, 1, 350, 5.80, 1234582.00, 0.82, '2026-11-09 18:00:00'),
(6, 3, 0, 0.00, 500000.00, 0.88, '2026-11-01 00:05:00'),
(7, 3, 600, 10.00, 542100.00, 0.80, '2026-11-08 12:00:00'),
(8, 3, 3510, 58.50, 545610.00, 0.15, '2026-11-08 13:00:00'),
(9, 4, 0, 0.00, 800000.00, 0.86, '2026-11-01 00:05:00'),
(10, 4, 540, 9.00, 821400.00, 0.79, '2026-11-08 16:00:00'),
(11, 5, 0, 0.00, 310000.00, 0.87, '2026-11-01 00:05:00'),
(12, 5, 24, 0.40, 314200.00, 0.20, '2026-11-09 03:30:00');

INSERT INTO alertas_consumo (id, imovel_id, leitura_id, tipo_alerta, severidade, mensagem, desperdicio_estimado_litros, resolvido, data_geracao) VALUES
(1, 1, 4, 'VAZAMENTO_OCULTO_MADRUGADA', 'MEDIA', 'Água passando sem parar desde a meia-noite, cerca de 1,2 L/min. Confira a descarga e a boia da caixa.', 216.00, 0, '2026-11-08 04:12:00'),
(2, 1, 5, 'META_MENSAL_ULTRAPASSADA', 'BAIXA', 'Você passou da meta do mês: já foram 10.150 litros, acima da meta de 10.000 litros.', 0.00, 0, '2026-11-09 18:01:00'),
(3, 2, 8, 'CANO_ROMPIDO_PICO', 'CRITICA', 'Surto de vazão de 58,5 L/min ultrapassou o limite do imóvel (45,0 L/min). Possível cano rompido ou torneira aberta!', 3510.00, 0, '2026-11-08 13:01:00'),
(4, 3, 10, 'META_MENSAL_ULTRAPASSADA', 'BAIXA', 'Consumo acumulado no mês atingiu 21.400 litros, ultrapassando a meta de 20.000 litros.', 0.00, 0, '2026-11-08 16:01:00'),
(5, 4, 12, 'VAZAMENTO_OCULTO_MADRUGADA', 'MEDIA', 'Fluxo contínuo de 0,40 L/min na madrugada (24 L/h). Verifique se há válvula de descarga pingando.', 96.00, 0, '2026-11-09 03:31:00');
