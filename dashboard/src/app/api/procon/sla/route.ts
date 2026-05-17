import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB = process.env.PROCON_DB_PATH ?? path.join(process.cwd(), '..', 'output', 'procon.db')

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

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
    const rows = db.prepare(
      'SELECT setor, media_dias_resolucao, total_reclamacoes FROM sla_por_setor ORDER BY media_dias_resolucao DESC LIMIT ?'
    ).all(limit)
    
    return NextResponse.json({ data: rows })
  } finally {
    db.close()
  }
}
