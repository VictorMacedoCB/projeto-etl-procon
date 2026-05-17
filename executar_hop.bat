@echo off
set "HOP_OPTIONS=-Dfile.encoding=UTF-8"
set "JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8"
setlocal EnableDelayedExpansion

:: ============================================================
::  PROCON ETL - Execucao via Apache Hop 2.17
::  Uso: executar_hop.bat <caminho_para_CNRF2020.csv>
:: ============================================================

set "HOP_HOME=C:\hop\apache-hop-client-2.17.0\hop"
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

set "HOP_RUN=%HOP_HOME%\hop-run.bat"
set "HOP_CONF=%HOP_HOME%\hop-conf.bat"
set "PROJECT_NAME=procon-etl"
set "DB_PATH=%PROJECT_DIR%\output\procon.db"

echo.
echo ============================================================
echo  PROCON ETL - Apache Hop 2.17
echo  Projeto : %PROJECT_DIR%
echo  Banco   : %DB_PATH%
echo ============================================================
echo.

:: --- Verificar Apache Hop ---
if not exist "%HOP_RUN%" (
    echo [ERRO] hop-run.bat nao encontrado em:
    echo        %HOP_HOME%
    echo.
    echo Verifique se o Apache Hop esta instalado em C:\hop\apache-hop-client-2.17.0\hop
    pause
    exit /b 1
)

:: --- Verificar CSV informado ---
if "%~1"=="" (
    echo [AVISO] Uso: executar_hop.bat ^<caminho_para_CNRF2020.csv^>
    echo.
    echo Exemplo:
    echo   executar_hop.bat C:\dados\CNRF2020.csv
    echo.
    echo Baixe o CSV em:
    echo   https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-de-reclamacoes-fundamentadas-procons-sindec1
    echo.
    pause
    exit /b 1
)

set "CSV_PATH=%~1"
if not exist "%CSV_PATH%" (
    echo [ERRO] Arquivo CSV nao encontrado: %CSV_PATH%
    pause
    exit /b 1
)

:: --- Criar pasta output ---
if not exist "%PROJECT_DIR%\output" mkdir "%PROJECT_DIR%\output"

python "%PROJECT_DIR%\scripts\init_db.py" "%DB_PATH%" "%PROJECT_DIR%\scripts\schema.sql"
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao criar schema SQLite. Python instalado?
    pause
    exit /b 1
)
echo.

:: ============================================================
:: Registrar projeto no Apache Hop
:: ============================================================
echo [0/4] Registrando projeto '%PROJECT_NAME%' no Apache Hop...
call "%HOP_CONF%" ^
  --project="%PROJECT_NAME%" ^
  --project-create ^
  --project-home="%PROJECT_DIR%" ^
  --project-config-file="%PROJECT_DIR%\hop-config\project-config.json" ^
  --project-metadata-base="%PROJECT_DIR%\hop-config\metadata" 2>nul
echo       (se aparecer aviso de projeto existente, pode ignorar)
echo.

:: ============================================================
:: Pipeline 01 - Ingestao Raw: CSV -> staging_reclamacoes
:: ============================================================
echo [1/4] Ingestao Raw: CSV ^> staging_reclamacoes
echo       CSV: %CSV_PATH%
call "%HOP_RUN%" ^
  --project="%PROJECT_NAME%" ^
  --file="%PROJECT_DIR%\pipeline\01_ingestao_raw.hpl" ^
  --runconfig=local ^
  -p CSV_PATH="%CSV_PATH%" ^
  -p DB_PATH="%DB_PATH%"
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Pipeline 01 falhou! Veja o log acima.
    pause
    exit /b 1
)
echo       [OK]
echo.

:: ============================================================
:: Pipeline 02 - SLA por Setor (CNAE)
:: ============================================================
echo [2/4] SLA medio por setor CNAE
call "%HOP_RUN%" ^
  --project="%PROJECT_NAME%" ^
  --file="%PROJECT_DIR%\pipeline\02_sla_por_setor.hpl" ^
  --runconfig=local ^
  -p DB_PATH="%DB_PATH%"
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Pipeline 02 falhou! Veja o log acima.
    pause
    exit /b 1
)
echo       [OK]
echo.

:: ============================================================
:: Pipeline 03 - Taxa de Resolucao por Regiao/UF
:: ============================================================
echo [3/4] Taxa de resolucao por Regiao e UF
call "%HOP_RUN%" ^
  --project="%PROJECT_NAME%" ^
  --file="%PROJECT_DIR%\pipeline\03_taxa_resolucao.hpl" ^
  --runconfig=local ^
  -p DB_PATH="%DB_PATH%"
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Pipeline 03 falhou! Veja o log acima.
    pause
    exit /b 1
)
echo       [OK]
echo.

:: ============================================================
:: Pipeline 04 - Ranking das Piores Empresas
:: ============================================================
echo [4/4] Ranking Top 10 piores empresas
call "%HOP_RUN%" ^
  --project="%PROJECT_NAME%" ^
  --file="%PROJECT_DIR%\pipeline\04_ranking_piores.hpl" ^
  --runconfig=local ^
  -p DB_PATH="%DB_PATH%"
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Pipeline 04 falhou! Veja o log acima.
    pause
    exit /b 1
)
echo       [OK]
echo.

:: ============================================================
echo ============================================================
echo  ETL CONCLUIDO COM SUCESSO!
echo  Banco gerado: %DB_PATH%
echo ============================================================
echo.
pause
