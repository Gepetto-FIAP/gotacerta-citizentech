# Parte 1 de 6 — Banco de Dados Relacional (2,0 Pontos)
**Projeto Gota Certa — Telemetria Acessível para Hidrômetros Convencionais**
*Responsável: Antônio Aloísio Schappo Neto (RM556429)*

---

## 1. Diagrama Entidade-Relacionamento (DER — 0,5 pt)

O modelo relacional segue **exatamente as 5 tabelas definidas na Página 13 do Guia do Grupo**, projetado na **Terceira Forma Normal (3FN)** e focado 100% no acoplamento óptico não-invasivo (`LED_IR` + `FOTOTRANSISTOR`) sobre a relojoaria do hidrômetro:

```mermaid
erDiagram
    USUARIOS ||--o{ IMOVEIS : "possui / monitora (1:N)"
    IMOVEIS ||--o{ SENSORES_IOT : "tem acoplado (1:N)"
    SENSORES_IOT ||--o{ LEITURAS_HIDROMETRO : "registra pulsos (1:N)"
    IMOVEIS ||--o{ ALERTAS_CONSUMO : "recebe (1:N)"
    LEITURAS_HIDROMETRO |o--o{ ALERTAS_CONSUMO : "dispara (0..1:N)"

    USUARIOS {
        INTEGER id PK "Auto-incremento"
        VARCHAR(120) nome "NOT NULL"
        VARCHAR(150) email UK "NOT NULL, UNIQUE"
        VARCHAR(255) senha_hash "NOT NULL (Hash BCrypt)"
        VARCHAR(30) perfil "NOT NULL CHECK ('MORADOR', 'ADMIN')"
        DATETIME criado_em "DEFAULT CURRENT_TIMESTAMP"
    }

    IMOVEIS {
        INTEGER id PK "Auto-incremento"
        INTEGER usuario_id FK "NOT NULL -> usuarios(id)"
        VARCHAR(100) apelido_local "NOT NULL (ex: Casa Dona Maria)"
        VARCHAR(200) endereco "NOT NULL"
        VARCHAR(80) bairro "NOT NULL"
        VARCHAR(15) cep "NOT NULL"
        VARCHAR(50) numero_serie_hidrometro UK "NOT NULL, UNIQUE"
        DECIMAL(10_2) meta_consumo_mensal_litros "NOT NULL (> 0)"
    }

    SENSORES_IOT {
        INTEGER id PK "Auto-incremento"
        INTEGER imovel_id FK "NOT NULL -> imoveis(id)"
        VARCHAR(60) codigo_dispositivo UK "NOT NULL, UNIQUE (ex: GC-001)"
        VARCHAR(40) tipo_sensor "NOT NULL CHECK ('LED_IR', 'FOTOTRANSISTOR')"
        DECIMAL(8_2) fator_calibracao_pulsos_litro "NOT NULL DEFAULT 1.0 (1 volta = 1 L)"
        DECIMAL(8_2) limite_vazao_alerta_lpm "NOT NULL DEFAULT 25.0"
        BOOLEAN status_ativo "NOT NULL DEFAULT 1"
    }

    LEITURAS_HIDROMETRO {
        INTEGER id PK "Auto-incremento"
        INTEGER sensor_id FK "NOT NULL -> sensores_iot(id)"
        INTEGER pulsos_registrados "NOT NULL (>= 0)"
        DECIMAL(10_2) vazao_instantanea_lpm "NOT NULL (pulsos/min x fator)"
        DECIMAL(12_2) volume_acumulado_litros "NOT NULL (leitura total mostrador)"
        DECIMAL(5_2) intensidade_luz "NULLABLE (0.00 a 1.00 - Fototransistor)"
        DATETIME data_hora_leitura "NOT NULL DEFAULT CURRENT_TIMESTAMP"
    }

    ALERTAS_CONSUMO {
        INTEGER id PK "Auto-incremento"
        INTEGER imovel_id FK "NOT NULL -> imoveis(id)"
        INTEGER leitura_id FK "NULLABLE -> leituras_hidrometro(id)"
        VARCHAR(50) tipo_alerta "NOT NULL ('VAZAMENTO_OCULTO_MADRUGADA' | 'CANO_ROMPIDO_PICO' | 'META_MENSAL_ULTRAPASSADA')"
        VARCHAR(20) severidade "NOT NULL ('BAIXA' | 'MEDIA' | 'CRITICA')"
        VARCHAR(300) mensagem "NOT NULL"
        DECIMAL(10_2) desperdicio_estimado_litros "NOT NULL DEFAULT 0"
        BOOLEAN resolvido "NOT NULL DEFAULT 0"
        DATETIME data_geracao "NOT NULL DEFAULT CURRENT_TIMESTAMP"
    }
```

---

## 2. Normalização (1FN, 2FN e 3FN) — "Saiba Responder" (Pág. 17)
* **1ª Forma Normal (1FN):** Todos os campos contêm apenas valores atômicos (indivisíveis) e não existem colunas repetidas ou arrays.
* **2ª Forma Normal (2FN):** Está na 1FN e todos os atributos não-chave dependem totalmente da chave primária (`id`) de sua respectiva tabela.
* **3ª Forma Normal (3FN):** Está na 2FN e nenhuma coluna não-chave depende de outra coluna não-chave (sem dependências transitivas: dados cadastrais do usuário ficam em `usuarios`, localização/meta do hidrômetro em `imoveis`, calibração óptica em `sensores_iot`, medições temporais em `leituras_hidrometro` e ocorrências em `alertas_consumo`).

---

## 3. Como Executar os Scripts SQL (0,5 pt + 1,0 pt)

```bash
sqlite3 /tmp/gotacerta_test.db < database/01_schema_seed.sql
sqlite3 -header -column /tmp/gotacerta_test.db < database/02_consultas_uso.sql
```
