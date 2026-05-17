import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB = process.env.PROCON_DB_PATH ?? path.join(process.cwd(), '..', 'output', 'procon.db')

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const regiao = searchParams.get('regiao')

  let db: Database.Database
  try {
    db = new Database(DB, { readonly: true })
  } catch {
    return NextResponse.json(
      { error: 'Banco nao encontrado. Execute o ETL primeiro.' }, 
      { status: 503 }
    )
  }

  try {
    if (regiao) {
      const rows = db.prepare(
        'SELECT regiao, uf, total_reclamacoes, total_atendidas, taxa_resolucao_pct FROM taxa_resolucao_regiao WHERE regiao = ? ORDER BY taxa_resolucao_pct DESC'
      ).all(regiao)
      
      return NextResponse.json({ modo: 'drill-down', regiao, data: rows })
    }

    const rollup = db.prepare(`
      SELECT regiao,
        SUM(total_reclamacoes) AS total_reclamacoes,
        SUM(total_atendidas)   AS total_atendidas,
        ROUND(CAST(SUM(total_atendidas) AS REAL)/SUM(total_reclamacoes)*100, 2) AS taxa_resolucao_pct
      FROM taxa_resolucao_regiao
      GROUP BY regiao ORDER BY taxa_resolucao_pct DESC
    `).all()

    const detalhe = db.prepare(
      'SELECT regiao, uf, total_reclamacoes, total_atendidas, taxa_resolucao_pct FROM taxa_resolucao_regiao ORDER BY regiao, uf'
    ).all()

    return NextResponse.json({ modo: 'roll-up', rollup, detalhe })
  } finally {
    db.close()
  }
}
