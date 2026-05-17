import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const DB = process.env.PROCON_DB_PATH ?? path.join(process.cwd(), '..', 'output', 'procon.db')

export const GET = async () => {
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
      'SELECT posicao, radical_cnpj, nome, nao_atendidas FROM ranking_piores_empresas ORDER BY posicao'
    ).all()
    
    return NextResponse.json({ data: rows })
  } finally {
    db.close()
  }
}
