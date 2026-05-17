# PROCON/SINDEC 2020 — Pipeline ETL + Dashboard OLAP

> Trabalho acadêmico — Análise de dados governamentais com Apache Hop, ETL e React.js.
> Este projeto implementa de ponta a ponta um fluxo de ingestão, transformação e modelagem multidimensional (OLAP) sobre o **Cadastro Nacional de Reclamações Fundamentadas de 2020**, disponibilizando os resultados analíticos em um painel interativo premium.

---

## 👥 Discentes 

- Victor Macedo
- Lucas Matheus
- Joao Vitor
- Felipe Loose

---

## 📁 Estrutura do Projeto

```
procon-etl/
├── pipeline/                   # Pipelines analíticas do Apache Hop (.hpl)
│   ├── 01_ingestao_raw.hpl    # CSV ➔ staging_reclamacoes
│   ├── 02_sla_por_setor.hpl   # Fato: cálculo de SLA médio por CNAE
│   ├── 03_taxa_resolucao.hpl  # Hierarquia geográfica: taxa de atendimento Região/UF
│   └── 04_ranking_piores.hpl  # Slice + Rank: Top 10 piores empresas
├── scripts/
│   ├── init_db.py              # Script utilitário para iniciar o banco SQLite
│   └── schema.sql              # Estrutura DDL física do banco analítico
├── hop-config/                 # Configurações de conexão e projeto no Hop
├── output/                     # Banco SQLite gerado (procon.db)
├── executar_hop.bat            # Script unificado para execução automatizada (ETL)
└── dashboard/                  # Dashboard Next.js (React)
```

---

## 🛠️ Passo a Passo Completo de Instalação e Execução (Apenas via Apache Hop)

Toda a engenharia de dados do projeto foi automatizada em um único script executável (`executar_hop.bat`). Siga as instruções abaixo para rodar o projeto de forma extremamente simples.

### 📋 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:
1. **Java JDK (11 ou 17)**: Obrigatório para a execução do Apache Hop.
2. **Python 3**: Usado internamente pelo script para inicializar o arquivo de banco SQLite (`procon.db`) com o schema DDL correto.
3. **Node.js**: Necessário para rodar o servidor local do dashboard.

---

### 💾 2. Instalação e Configuração do Apache Hop

1. Baixe o **Apache Hop Client 2.17.0** (ou superior) no [site oficial do Apache Hop](https://hop.apache.org/download/).
2. Extraia o conteúdo compactado para a pasta:
   `C:\hop\apache-hop-client-2.17.0\hop\`
   *(Se optar por descompactar em outro diretório, abra o arquivo `executar_hop.bat` em um editor de texto e atualize a variável `HOP_HOME` na linha 9).*
3. **Driver JDBC do SQLite**:
   - Baixe a biblioteca de conexão SQLite JDBC `.jar` (ex: `sqlite-jdbc-3.48.0.0.jar` ou versão compatível) em: [Maven Repository](https://mvnrepository.com/artifact/org.xerial/sqlite-jdbc).
   - Copie o arquivo `.jar` baixado e cole dentro do diretório de bibliotecas do Hop em:
     `C:\hop\apache-hop-client-2.17.0\hop\lib\jdbc\`

---

### 📥 3. Download do Dataset
1. Acesse o portal do Governo Federal e baixe o arquivo CSV de **2020** no link:
   [Cadastro Nacional de Reclamações Fundamentadas (Sindec)](https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-de-reclamacoes-fundamentadas-procons-sindec1).
2. Salve o arquivo com o nome correto de **`CNRF2020.csv`** dentro da pasta `data/` do projeto, ou em qualquer outra pasta de sua preferência.

---

### 🚀 4. Executando o ETL com Apenas 1 Comando! (Sem abrir a interface do Hop)

Abra o terminal (PowerShell ou Prompt de Comando) na raiz do projeto e execute o script automatizado passando o caminho onde você salvou o CSV. 

O script resolve automaticamente as variáveis de ambiente, configura a codificação do Java para UTF-8 de forma a evitar Mojibake (acentos corrompidos em ambientes Windows) e processa os dados sequencialmente:

```powershell
.\executar_hop.bat C:\caminho\para\CNRF2020.csv
```

O script realizará os seguintes passos automaticamente:
- **[0/4]** Criação do banco analítico `procon.db` em `output/` e registro das tabelas via SQLite.
- **[1/4]** Importação Raw de dados brutos (`8.016 linhas`) filtrando e mapeando as 23 colunas.
- **[2/4]** Consolidação do SLA médio e tempo médio de resolução por CNAE do Setor (`342 setores`).
- **[3/4]** Agrupamento da taxa de resolução regional e por estado brasileiro.
- **[4/4]** Geração do ranking das Top 10 piores empresas com reclamações não atendidas (eliminando valores nulos).

---

### 📊 5. Iniciando o Dashboard de Visualização

Com o banco de dados gerado, inicie o painel web interativo:

1. Entre na pasta do dashboard pelo terminal:
   ```bash
   cd dashboard
   ```
2. Instale as dependências de interface e inicialize o servidor de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```
3. Abra em seu navegador de internet o seguinte endereço:
   👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📈 Métricas e Modelagem Dimensional (OLAP)

O projeto exemplifica conceitos fundamentais de BI (Business Intelligence) aplicados sobre o banco SQLite:

### 1. SLA por Setor — `02_sla_por_setor.hpl`
* **Fato Calculado**: `dias = julianday(DataArquivamento) - julianday(DataAbertura)`.
* **Agregação (Medida)**: `AVG(dias_resolucao)`.
* **Dimensão**: `CNAE` e `DescricaoCNAE`.

### 2. Taxa de Resolução Regional — `03_taxa_resolucao.hpl`
* **Hierarquia Geográfica**: Região (Nível 1) ➔ UF/Estado (Nível 2).
* **Roll-up**: Consolida reclamações totais e atendidas a nível de macro-região.
* **Drill-down**: Permite clicar em uma Região no Dashboard e expandir o detalhamento para ver dados específicos de cada estado.

### 3. Ranking das Top 10 Piores — `04_ranking_piores.hpl`
* **Slice (Filtro)**: Analisa somente registros com `Atendida = 'N'`.
* **Surrogate Key**: Agrupamento pelo radical de CNPJ (`RadicalCNPJ`) garantindo unicidade corporativa.
* **Filtro de Nulos**: Exclusão sistemática de empresas sem dados cadastrais (`'NULL'` ou `'NAO INFORMADO'`).

---

## 💻 Tecnologias Empregadas

- **Apache Hop 2.17.0** — Engenharia de dados e ETL visual.
- **SQLite** — Banco de dados analítico embarcado leve e rápido.
- **React.js 19 & Next.js 15** — Interface web responsiva, otimizada e interativa.
- **Better-SQLite3** — Driver de conexão de altíssima performance para consulta ao banco analítico local.
- **Vanilla CSS** — Customização estética premium moderna com suporte a modo escuro e animações.
