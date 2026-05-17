'use client'

import { useEffect, useState } from 'react'

interface SlaRow { 
  setor: string 
  media_dias_resolucao: number 
  total_reclamacoes: number 
}

interface TaxaRollup { 
  regiao: string 
  total_reclamacoes: number 
  total_atendidas: number 
  taxa_resolucao_pct: number 
}

interface TaxaDetalhe { 
  regiao: string 
  uf: string 
  total_reclamacoes: number 
  total_atendidas: number 
  taxa_resolucao_pct: number 
}

interface RankingRow { 
  posicao: number 
  radical_cnpj: string 
  nome: string 
  nao_atendidas: number 
}

const fmtNum = (n: number) => { 
  return n.toLocaleString('pt-BR') 
}

const taxaCor = (pct: number) => { 
  if (pct >= 70) return 'text-green-600'
  if (pct >= 40) return 'text-amber-600'
  return 'text-red-600'
}

const Barra = ({ valor, max, cor }: { valor: number; max: number; cor: string }) => {
  const pct = max > 0 ? (valor / max) * 100 : 0
  
  return (
    <div className="bg-slate-200 rounded-full h-2 w-full overflow-hidden flex-1">
      <div 
        style={{ width: `${pct}%`, backgroundColor: cor }} 
        className="h-full rounded-full transition-all duration-500 ease-out" 
      />
    </div>
  )
}

const SlaCard = () => {
  const [data, setData] = useState<SlaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/procon/sla?limit=15&t=${Date.now()}`)
      .then((resposta) => resposta.json())
      .then((json) => { 
        setData(json.data ?? [])
        setLoading(false) 
      })
      .catch(() => { 
        setErro('Erro ao buscar dados de SLA.')
        setLoading(false) 
      })
  }, [])

  const max = Math.max(...data.map(d => d.media_dias_resolucao), 1)

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
        Tempo Médio de Resolução por Setor (SLA)
      </h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        Tempo médio que as empresas de cada setor levam para dar uma resposta ao consumidor.<br />
        <span className="font-semibold text-slate-600">Resumo técnico:</span> Tiramos a média de dias agrupando pelo setor da empresa.
      </p>

      {loading && <p className="text-xs italic text-slate-400 animate-pulse">Carregando...</p>}
      {erro && <p className="text-xs text-red-500">{erro}</p>}
      
      {!loading && !erro && data.length === 0 && (
        <p className="text-xs text-slate-400 italic">Sem dados — execute o ETL primeiro.</p>
      )}

      <div className="space-y-4">
        {data.map((r, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-48 md:w-56 text-xs font-semibold text-slate-700 truncate" title={r.setor}>
              {r.setor}
            </div>
            
            <Barra valor={r.media_dias_resolucao} max={max} cor="#3b82f6" />
            
            <div className="text-xs font-bold text-slate-800 w-28 text-right shrink-0">
              {Math.round(r.media_dias_resolucao)} dias
              <span className="text-slate-400 font-normal"> · {fmtNum(r.total_reclamacoes)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const TaxaCard = () => {
  const [rollup, setRollup] = useState<TaxaRollup[]>([])
  const [detalhe, setDetalhe] = useState<TaxaDetalhe[]>([])
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/procon/taxa?t=${Date.now()}`)
      .then((resposta) => resposta.json())
      .then((json) => { 
        setRollup(json.rollup ?? [])
        setDetalhe(json.detalhe ?? [])
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  const estadosFiltrados = regiaoSelecionada 
    ? detalhe.filter(d => d.regiao === regiaoSelecionada) 
    : []

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
        Taxa de Resolução por Região e Estado
      </h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        Porcentagem das reclamações que as empresas realmente conseguiram resolver.<br />
        <span className="font-semibold text-slate-600">Resumo técnico:</span> Clique numa região para ver os detalhes por estado (isso se chama drill-down).
      </p>

      {loading && <p className="text-xs italic text-slate-400 animate-pulse">Carregando...</p>}
      {!loading && rollup.length === 0 && <p className="text-xs text-slate-400 italic">Sem dados — execute o ETL primeiro.</p>}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rollup.map(r => {
          const isSelected = regiaoSelecionada === r.regiao
          return (
            <button 
              key={r.regiao} 
              onClick={() => setRegiaoSelecionada(isSelected ? null : r.regiao)}
              className={`border-2 rounded-2xl p-4 cursor-pointer text-center transition-all duration-300 shadow-sm hover:-translate-y-0.5 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">
                {r.regiao}
              </div>
              <div className={`text-2xl font-black ${taxaCor(r.taxa_resolucao_pct)}`}>
                {r.taxa_resolucao_pct.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                {fmtNum(r.total_atendidas)} / {fmtNum(r.total_reclamacoes)}
              </div>
            </button>
          )
        })}
      </div>

      {regiaoSelecionada && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="mb-3 text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
            Detalhamento de Estados ➔ {regiaoSelecionada}
          </p>
          
          <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold text-slate-500">UF / Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Reclamações</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Atendidas</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Taxa de Resolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estadosFiltrados.map(r => (
                  <tr key={r.uf} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.uf}</td>
                    <td className="px-4 py-2.5 text-slate-600">{fmtNum(r.total_reclamacoes)}</td>
                    <td className="px-4 py-2.5 text-slate-600">{fmtNum(r.total_atendidas)}</td>
                    <td className={`px-4 py-2.5 font-bold ${taxaCor(r.taxa_resolucao_pct)}`}>
                      {r.taxa_resolucao_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

const RankingCard = () => {
  const [data, setData] = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/procon/ranking?t=${Date.now()}`)
      .then((resposta) => resposta.json())
      .then((json) => { 
        setData(json.data ?? [])
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  const max = Math.max(...data.map(d => d.nao_atendidas), 1)

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300">
      <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
        Ranking de Piores Empresas
      </h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        Lista das empresas que mais ignoraram os consumidores e deixaram problemas sem solução.<br />
        <span className="font-semibold text-slate-600">Resumo técnico:</span> Filtramos só os casos não resolvidos e ordenamos pelo CNPJ para formar o top 10.
      </p>

      {loading && <p className="text-xs italic text-slate-400 animate-pulse">Carregando...</p>}
      {!loading && data.length === 0 && <p className="text-xs text-slate-400 italic">Sem dados — execute o ETL primeiro.</p>}
      
      <div className="divide-y divide-slate-100">
        {data.map(r => (
          <div key={r.posicao} className="flex gap-4 items-center py-4 last:pb-0 first:pt-0">
            <div className="text-lg md:text-xl font-extrabold text-slate-300 w-10 shrink-0 text-center">
              #{r.posicao}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-slate-800 truncate" title={r.nome}>
                {r.nome}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                CNPJ raiz: {r.radical_cnpj}
              </div>
              <div className="flex gap-3 items-center mt-2.5">
                <Barra valor={r.nao_atendidas} max={max} cor="#ef4444" />
                <span className="text-xs font-extrabold text-red-600 w-14 text-right shrink-0">
                  {fmtNum(r.nao_atendidas)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const Dashboard = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8 p-6 md:p-8 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-3xl text-white shadow-lg border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        
        <h1 className="text-xl md:text-2xl font-black tracking-tight mb-2 bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
          Painel de Dados do Consumidor 2020
        </h1>
        <p className="text-xs text-slate-300 opacity-90 mb-4 max-w-md mx-auto leading-relaxed">
          Análise Processada do Cadastro Nacional de Reclamações Fundamentadas (PROCON)
        </p>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {['Apache Hop', 'SQLite', 'Next.js', 'Dados Abertos Gov.BR'].map(t => (
            <span 
              key={t} 
              className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full px-3 py-0.5 text-xs font-semibold text-slate-200 transition-colors border border-white/5 uppercase tracking-wider"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      <SlaCard />
      <TaxaCard />
      <RankingCard />
    </main>
  )
}

export default Dashboard
