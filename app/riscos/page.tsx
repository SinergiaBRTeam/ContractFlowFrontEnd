"use client"

import Sidebar from "@/components/sidebar"
import { AlertTriangle, TrendingUp, Shield, AlertCircle, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/config"
import { PenaltyReportDto, ContractSimpleDto } from "@/lib/api-types"
import { toast } from "sonner"

interface RiskItem {
  id: string;
  type: string;
  contractName: string;
  level: string;
  levelColor: string;
  description: string;
  date: string;
  value: number | null;
}

export default function PainelRiscosPage() {
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ high: 0, medium: 0, low: 0 });

  useEffect(() => {
    const fetchRisks = async () => {
      setLoading(true)
      try {
        // Busca Penalidades e Contratos para cruzar dados
        const [penaltiesRes, contractsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/reports/penalties`),
            fetch(`${API_BASE_URL}/api/contracts`)
        ]);

        if(!penaltiesRes.ok || !contractsRes.ok) throw new Error("Falha ao carregar dados");

        const penaltiesData: PenaltyReportDto[] = await penaltiesRes.json();
        const contractsData: ContractSimpleDto[] = await contractsRes.json();
        
        // Mapa de Contratos
        const contractMap = new Map(contractsData.map(c => [c.id, c.officialNumber]));

        let high = 0, medium = 0, low = 0;
        
        const mappedRisks: RiskItem[] = penaltiesData.map(r => {
          // Lógica de Severidade baseada na string do backend
          const sev = r.severity.toLowerCase();
          let level = "Baixo";
          let color = "bg-green-100 text-green-800 border-green-200";

          if (sev.includes("alto") || sev.includes("high") || sev.includes("grave")) {
            level = "Alto";
            color = "bg-red-100 text-red-800 border-red-200";
            high++;
          } else if (sev.includes("médio") || sev.includes("medium")) {
            level = "Médio";
            color = "bg-yellow-100 text-yellow-800 border-yellow-200";
            medium++;
          } else {
            low++;
          }

          return {
            id: r.penaltyId,
            type: r.type, // Multa, Advertência...
            contractName: contractMap.get(r.contractId) || `ID: ${r.contractId.substring(0, 8)}...`,
            level: level,
            levelColor: color,
            description: r.reason,
            date: new Date(r.registeredAt).toLocaleDateString('pt-BR'),
            value: r.amount || 0
          };
        });
        
        setRisks(mappedRisks);
        setStats({ high, medium, low });

      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar riscos.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRisks();
  }, []);

  const totalRisks = stats.high + stats.medium + stats.low;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Gestão de Riscos</h1>
          <p className="text-muted-foreground">Monitoramento de penalidades e não conformidades</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <RiskCard title="Críticos" value={stats.high} icon={AlertTriangle} color="text-red-500" />
            <RiskCard title="Médios" value={stats.medium} icon={AlertCircle} color="text-yellow-500" />
            <RiskCard title="Baixos" value={stats.low} icon={Shield} color="text-green-500" />
            <RiskCard title="Total Ocorrências" value={totalRisks} icon={TrendingUp} color="text-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista Detalhada */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6">Ocorrências Recentes</h2>
                {loading ? (
                    <p className="text-center py-8 text-gray-500">Carregando riscos...</p>
                ) : (
                    <div className="space-y-4">
                    {risks.length === 0 ? <p className="text-gray-500">Nenhum risco registrado.</p> : risks.map((risk) => (
                        <div key={risk.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary/30 transition-colors bg-gray-50/50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full border">
                                        <FileText size={18} className="text-gray-600"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{risk.contractName}</h3>
                                        <p className="text-xs text-gray-500">{risk.date}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${risk.levelColor}`}>
                                    {risk.level}
                                </span>
                            </div>
                            <div className="pl-[52px]">
                                <p className="font-medium text-sm text-gray-700 mb-1">{risk.type}</p>
                                <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                                {risk.value > 0 && (
                                    <p className="text-xs font-mono text-red-600 bg-red-50 inline-block px-2 py-1 rounded">
                                        Impacto Financeiro: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(risk.value)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>

            {/* Matriz Visual (Simplificada) */}
            <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
              <h2 className="text-lg font-semibold text-foreground mb-6">Distribuição</h2>
              <div className="space-y-6">
                {[
                    { label: "Alto Risco", count: stats.high, color: "bg-red-500", width: totalRisks ? (stats.high/totalRisks)*100 : 0 },
                    { label: "Médio Risco", count: stats.medium, color: "bg-yellow-500", width: totalRisks ? (stats.medium/totalRisks)*100 : 0 },
                    { label: "Baixo Risco", count: stats.low, color: "bg-green-500", width: totalRisks ? (stats.low/totalRisks)*100 : 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className={`${item.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${item.width}%` }} />
                    </div>
                  </div>
                ))}
                
                {totalRisks === 0 && <p className="text-center text-xs text-gray-400 mt-4">Sem dados suficientes para gráfico.</p>}
              </div>
            </div>
          </div>
      </main>
    </div>
  )
}

function RiskCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
            <div>
                <p className="text-muted-foreground text-sm mb-1">{title}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
            <Icon size={32} className={color} />
        </div>
    )
}