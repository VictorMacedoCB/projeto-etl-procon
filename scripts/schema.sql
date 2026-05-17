-- =============================================================================
-- PROCON/SINDEC 2020 — Schema do Data Warehouse (SQLite)
-- =============================================================================

-- Staging: dados brutos do CSV (alimentada pela pipeline 01)
DROP TABLE IF EXISTS staging_reclamacoes;
CREATE TABLE staging_reclamacoes (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    AnoCalendario         TEXT,
    DataArquivamento      TEXT,
    DataAbertura          TEXT,
    CodigoRegiao          TEXT,
    Regiao                TEXT,
    UF                    TEXT,
    strRazaoSocial        TEXT,
    strNomeFantasia       TEXT,
    Tipo                  TEXT,
    NumeroCNPJ            TEXT,
    RadicalCNPJ           TEXT,
    RazaoSocialRFB        TEXT,
    NomeFantasiaRFB       TEXT,
    CNAE                  TEXT,
    DescricaoCNAE         TEXT,
    Atendida              TEXT,
    CodigoAssunto         TEXT,
    DescricaoAssunto      TEXT,
    CodigoProblema        TEXT,
    DescricaoProblema     TEXT,
    Sexo                  TEXT,
    FaixaEtariaConsumidor TEXT,
    CEPConsumidor         TEXT
);

-- Fato 1: SLA médio por setor (alimentada pela pipeline 02)
DROP TABLE IF EXISTS sla_por_setor;
CREATE TABLE sla_por_setor (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    setor                TEXT    NOT NULL,
    media_dias_resolucao REAL    NOT NULL,
    total_reclamacoes    INTEGER NOT NULL
);

-- Fato 2: Taxa de resolução por Região/UF — hierarquia OLAP (pipeline 03)
DROP TABLE IF EXISTS taxa_resolucao_regiao;
CREATE TABLE taxa_resolucao_regiao (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    regiao              TEXT    NOT NULL,   -- nível 1 (roll-up)
    uf                  TEXT    NOT NULL,   -- nível 2 (drill-down)
    total_reclamacoes   INTEGER NOT NULL,
    total_atendidas     INTEGER NOT NULL,
    taxa_resolucao_pct  REAL    NOT NULL
);

-- Fato 3: Ranking top 10 piores empresas (pipeline 04)
DROP TABLE IF EXISTS ranking_piores_empresas;
CREATE TABLE ranking_piores_empresas (
    posicao       INTEGER NOT NULL,
    radical_cnpj  TEXT    NOT NULL,
    nome          TEXT    NOT NULL,
    nao_atendidas INTEGER NOT NULL
);

-- =============================================================================
-- QUERIES ANALÍTICAS (OLAP) — descomente para testar no SQLite
-- =============================================================================

-- 1. SLA top 20 setores mais lentos
-- SELECT setor, ROUND(media_dias_resolucao,1) AS media_dias, total_reclamacoes
-- FROM sla_por_setor ORDER BY media_dias_resolucao DESC LIMIT 20;

-- 2. Roll-up por região
-- SELECT regiao,
--   SUM(total_reclamacoes) AS total,
--   ROUND(CAST(SUM(total_atendidas) AS REAL)/SUM(total_reclamacoes)*100,2) AS taxa_pct
-- FROM taxa_resolucao_regiao GROUP BY regiao ORDER BY taxa_pct DESC;

-- 3. Drill-down no Sudeste
-- SELECT uf, total_reclamacoes, total_atendidas, taxa_resolucao_pct
-- FROM taxa_resolucao_regiao WHERE regiao='Sudeste' ORDER BY taxa_resolucao_pct DESC;

-- 4. Ranking top 10
-- SELECT posicao, nome, radical_cnpj, nao_atendidas
-- FROM ranking_piores_empresas ORDER BY posicao;
