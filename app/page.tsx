"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Sidebar from "@/components/sidebar"
import StatCard from "@/components/stat-card"
import ContractCard from "@/components/contract-card"
import { API_BASE_URL } from "@/lib/config"
import { ContractSimpleDto } from "@/lib/api-types"

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


  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contracts`);
        if (!response.ok) throw new Error("Falha ao buscar contratos");
        
        const data: ContractSimpleDto[] = await response.json();
        
      
        const mappedContracts: Contract[] = data.map(c => ({
          id: c.officialNumber,
          status: c.status,
          company: `ID: ${c.id.substring(0, 8)}...`,
          unit: "N/A",
          value: "N/A",
          date: "",    
        }));
        
        setContracts(mappedContracts);
      } catch (error) {
        console.error("Erro ao buscar contratos:", error);
      }
    };

    fetchContracts();
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">DashBoard</h1>
            <p className="text-muted-foreground">Visão geral do sistema de contratos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Contratos ativos" value="24" icon="📋" color="bg-blue-100" iconBg="bg-blue-500" />
            <StatCard title="Pendentes de ação" value="7" icon="⚠️" color="bg-orange-100" iconBg="bg-orange-500" />
            <StatCard title="Atrasados" value="3" icon="🚨" color="bg-red-100" iconBg="bg-red-500" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">Contratos recentes</h2>
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