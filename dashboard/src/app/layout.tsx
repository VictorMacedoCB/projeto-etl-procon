import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PROCON/SINDEC 2020 — Dashboard OLAP',
  description: 'Análise de dados do Cadastro Nacional de Reclamações Fundamentadas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
