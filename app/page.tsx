"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import StatCard from "@/components/stat-card"
import ContractCard from "@/components/contract-card"
import { API_BASE_URL } from "@/lib/config"
import { ContractSimpleDto, DashboardStatsDto } from "@/lib/api-types"

interface Contract {
  id: string;
  status: string;
  company: string;
  unit: string;   
  value: string;  
  date: string;   
}

export default function Home() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [stats, setStats] = useState({ active: 0, overdue: 0, total: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca Contratos Recentes
        const response = await fetch(`${API_BASE_URL}/api/contracts`);
        if (!response.ok) throw new Error("Falha ao buscar contratos");
        const data: ContractSimpleDto[] = await response.json();
        
        const mappedContracts: Contract[] = data.slice(0, 5).map(c => ({
          id: c.officialNumber,
          status: c.status,
          company: `ID: ${c.id.substring(0, 8)}...`,
          unit: "N/A",
          value: "N/A",
          date: "Recente",    
        }));
        setContracts(mappedContracts);

        // 2. Busca Estatísticas Reais
        // Status
        const statusRes = await fetch(`${API_BASE_URL}/api/reports/contract-status`);
        const statusData = await statusRes.json(); // Retorna array [{status: "Active", count: 5}, ...]
        
        // Atrasos
        const dueRes = await fetch(`${API_BASE_URL}/api/reports/due-deliverables`);
        const dueData = await dueRes.json(); // Retorna lista de itens vencidos

        // Calcular Totais
        const activeCount = statusData.find((s: any) => s.status === "Active")?.count || 0;
        const totalCount = data.length; // Total de contratos listados
        const overdueCount = dueData.length;

        setStats({ active: activeCount, overdue: overdueCount, total: totalCount });

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral em tempo real</p>
          </div>

          {/*  - Agora com dados reais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="Contratos Ativos" 
              value={stats.active.toString()} 
              icon="📋" 
              color="bg-blue-100" 
              iconBg="bg-blue-500" 
            />
            <StatCard 
              title="Total de Contratos" 
              value={stats.total.toString()} 
              icon="Vg" 
              color="bg-orange-100" 
              iconBg="bg-orange-500" 
            />
            <StatCard 
              title="Itens em Atraso" 
              value={stats.overdue.toString()} 
              icon="🚨" 
              color="bg-red-100" 
              iconBg="bg-red-500" 
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Contratos Recentes</h2>
              <Link href="/ver-todos" className="text-primary hover:text-primary/80 text-sm font-medium">
                Ver Todos
              </Link>
            </div>
            <div className="space-y-4">
              {contracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}