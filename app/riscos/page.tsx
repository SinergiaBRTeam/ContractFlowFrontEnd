"use client"

import Sidebar from "@/components/sidebar"
import { AlertTriangle, TrendingUp, Shield, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/config"
import { PenaltyReportDto } from "@/lib/api-types"

interface RiskItem {
  id: string;
  title: string;
  contract: string;
  level: string;
  levelColor: string;
  probability: number;
  impact: number;
  description: string;
}

export default function PainelRiscosPage() {
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [stats, setStats] = useState({ high: 0, medium: 0, low: 0 });

  const getRiskColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "alto":
      case "high":
      case "critical":
        return "bg-red-100 text-red-800";
      case "médio":
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "baixo":
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getRiskLevel = (severity: string) => {
     switch (severity.toLowerCase()) {
      case "alto":
      case "high":
      case "critical":
        return "Alto";
      case "médio":
      case "medium":
        return "Médio";
      case "baixo":
      case "low":
        return "Baixo";
      default:
        return "Indefinido";
    }
  }

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports/penalties`);
        const data: PenaltyReportDto[] = await response.json();
        
        let high = 0, medium = 0, low = 0;
        
        const mappedRisks: RiskItem[] = data.map(r => {
          const level = getRiskLevel(r.severity);
          if (level === 'Alto') high++;
          else if (level === 'Médio') medium++;
          else if (level === 'Baixo') low++;

          return {
            id: r.penaltyId,
            title: r.type,
            contract: `CT: ${r.contractId.substring(0, 8)}...`,
            level: level,
            levelColor: getRiskColor(r.severity),
            probability: 50,
            impact: 50,
            description: r.reason,
          };
        });
        
        setRisks(mappedRisks);
        setStats({ high, medium, low });

      } catch (error) {
        console.error("Erro ao buscar relatório de penalidades:", error);
      }
    };
    
    fetchRisks();
  }, []);

  const riskMatrix = [
    { level: "Alto", count: stats.high, color: "bg-red-500" },
    { level: "Médio", count: stats.medium, color: "bg-yellow-500" },
    { level: "Baixo", count: stats.low, color: "bg-green-500" },
  ];
  const totalRisks = stats.high + stats.medium + stats.low;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Painel de Riscos</h1>
            <p className="text-muted-foreground">Análise e monitoramento de riscos contratuais</p>
          </div>

          {/* Risk Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Riscos Críticos</p>
                  <p className="text-3xl font-bold text-red-500">{stats.high}</p>
                </div>
                <AlertTriangle size={32} className="text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Riscos Médios</p>
                  <p className="text-3xl font-bold text-yellow-500">{stats.medium}</p>
                </div>
                <AlertCircle size={32} className="text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Riscos Baixos</p>
                  <p className="text-3xl font-bold text-green-500">{stats.low}</p>
                </div>
                <Shield size={32} className="text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total de Riscos</p>
                  <p className="text-3xl font-bold text-primary">{totalRisks}</p>
                </div>
                <TrendingUp size={32} className="text-primary" />
              </div>
            </div>
          </div>

          {/* Risk Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Detalhamento de Riscos (Baseado em Penalidades)</h2>
                <div className="space-y-4">
                  {risks.map((risk) => (
                    <div
                      key={risk.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{risk.title}</h3>
                          <p className="text-sm text-muted-foreground">{risk.contract}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${risk.levelColor}`}>
                          {risk.level}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-4">{risk.description}</p>
                      {/* Barras de Probabilidade e Impacto são estáticas pois não vêm do backend */}
                    </div>
                  ))}
                  {risks.length === 0 && <p>Nenhuma penalidade (risco) encontrada.</p>}
                </div>
              </div>
            </div>

            {/* Risk Matrix */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Distribuição de Riscos</h2>
              <div className="space-y-4">
                {riskMatrix.map((item) => (
                  <div key={item.level}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{item.level}</span>
                      <span className="text-sm font-bold text-foreground">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${item.color} h-3 rounded-full`}
                        style={{ width: `${totalRisks > 0 ? (item.count / totalRisks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}