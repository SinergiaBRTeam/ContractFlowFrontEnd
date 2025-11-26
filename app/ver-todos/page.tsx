"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import { API_BASE_URL } from "@/lib/config"
import { ContractSimpleDto } from "@/lib/api-types"
import { FileText, Eye, Search } from "lucide-react"

export default function VerTodos() {
  const [contracts, setContracts] = useState<ContractSimpleDto[]>([])
  const [filtered, setFiltered] = useState<ContractSimpleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contracts`);
        if (response.ok) {
            const data = await response.json();
            setContracts(data);
            setFiltered(data);
        }
      } catch (error) {
        console.error("Erro:", error);
        const mock = [
          { id: "demo-1", officialNumber: "DEMO-001/2024", status: "Active", isDeleted: false },
          { id: "demo-2", officialNumber: "DEMO-002/2024", status: "Suspended", isDeleted: false },
        ] as ContractSimpleDto[];
        setContracts(mock);
        setFiltered(mock);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  useEffect(() => {
    setFiltered(contracts.filter(c => 
      c.officialNumber.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, contracts]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "suspended": return "bg-yellow-100 text-yellow-800";
      case "terminated": case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Todos os Contratos</h1>
            <p className="text-muted-foreground">Listagem geral do sistema</p>
          </div>
          <Link href="/" className="text-sm text-primary hover:underline">← Voltar ao Dashboard</Link>
        </div>

        {/* Barra de Busca Simples */}
        <div className="bg-white rounded-t-2xl p-6 border-b">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 ring-primary/20"
                    placeholder="Filtrar por número do contrato..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-sm p-6 pt-0">
            {loading ? (
                <p className="text-center py-10 text-gray-500 animate-pulse">Carregando base de dados...</p>
            ) : (
                <div className="space-y-2 mt-4">
                    {filtered.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-gray-800">{c.officialNumber}</p>
                                    <p className="text-xs text-gray-400 font-mono">ID: {c.id}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(c.status)}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <Link href={`/contratos?id=${c.id}`} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                    Ver Detalhes <Eye size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                            <p className="text-gray-500">Nenhum contrato encontrado.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  )
}