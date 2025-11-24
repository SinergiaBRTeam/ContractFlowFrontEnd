"use client"

import Sidebar from "@/components/sidebar"
import { Calendar, Clock, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/config"
import { AlertDto, ContractSimpleDto } from "@/lib/api-types"
import { toast } from "sonner"

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  statusColor: string;
  daysLeft: number;
  contractName: string; 
}

export default function AgendaPrazosPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ next7: 0, next30: 0, overdue: 0, done: 0 })

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Busca Alertas e Contratos em paralelo
      const [alertsRes, contractsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/alerts`),
        fetch(`${API_BASE_URL}/api/contracts`)
      ]);

      if (!alertsRes.ok || !contractsRes.ok) throw new Error("Erro ao buscar dados");

      const alertsData: AlertDto[] = await alertsRes.json();
      const contractsData: ContractSimpleDto[] = await contractsRes.json();

      // Cria um mapa para acesso rápido: ID -> Número Oficial
      const contractMap = new Map(contractsData.map(c => [c.id, c.officialNumber]));
      
      const now = new Date();
      const nowTime = now.getTime();
      
      let next7 = 0;
      let next30 = 0;
      let overdue = 0;

      const mappedEvents: EventItem[] = alertsData.map(alert => {
        const targetDate = new Date(alert.targetDate);
        const diffTime = targetDate.getTime() - nowTime;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status = "Planejado";
        let statusColor = "bg-blue-100 text-blue-800";

        if (diffDays < 0) {
          status = "Atrasado";
          statusColor = "bg-red-100 text-red-800";
          overdue++;
        } else if (diffDays <= 7) {
          status = "Atenção";
          statusColor = "bg-yellow-100 text-yellow-800";
          next7++;
          next30++; 
        } else if (diffDays <= 30) {
          status = "Planejado";
          statusColor = "bg-blue-100 text-blue-800";
          next30++;
        }

        // Tenta encontrar o nome do contrato, senão usa o ID encurtado
        let contractName = "N/A";
        if (alert.contractId) {
            contractName = contractMap.get(alert.contractId) || `Ref: ${alert.contractId.substring(0, 8)}...`;
        } else if (alert.deliverableId) {
            // Se o alerta é de um entregável, tentamos achar o contrato via endpoint de detalhes seria pesado,
            // então deixamos genérico ou indicamos que é item.
            contractName = "Item de Entrega";
        }

        return {
          id: alert.id,
          title: alert.message,
          date: targetDate.toLocaleDateString('pt-BR'),
          time: targetDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: status,
          statusColor: statusColor,
          daysLeft: diffDays,
          contractName: contractName,
        };
      });
      
      setEvents(mappedEvents);
      setStats({ next7, next30, overdue, done: 0 });
      
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
      toast.error("Erro ao carregar agenda.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunCheck = async () => {
      try {
          const res = await fetch(`${API_BASE_URL}/api/alerts/test`);
          if(res.ok) {
              toast.success("Verificação executada! Atualizando...");
              fetchData();
          }
      } catch(e) {
          toast.error("Erro ao rodar verificação.");
      }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Agenda de Prazos</h1>
            <p className="text-muted-foreground">Prazos de contratos e entregas</p>
          </div>
          <button onClick={handleRunCheck} className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <RefreshCw size={16} /> Verificar Agora
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Próximos 7 dias" value={stats.next7} icon={AlertCircle} color="text-orange-500" />
            <StatCard title="Próximos 30 dias" value={stats.next30} icon={Calendar} color="text-blue-500" />
            <StatCard title="Atrasados" value={stats.overdue} icon={AlertCircle} color="text-red-500" />
            <StatCard title="Concluídos" value={stats.done} icon={CheckCircle2} color="text-green-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Cronograma</h2>
            {loading ? (
                <p className="text-center py-8 text-gray-500">Carregando agenda...</p>
            ) : (
                <div className="space-y-0">
                {events.length === 0 ? <p className="text-gray-500">Nenhum evento próximo.</p> : events.map((event, index) => (
                    <div key={event.id} className="flex gap-4 pb-6 relative group">
                    {/* Linha do tempo */}
                    <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1.5 z-10 ${event.daysLeft < 0 ? "bg-red-500" : "bg-primary"}`}></div>
                        {index < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 absolute top-3 left-[5px] -z-0 group-last:hidden" />}
                    </div>
                    
                    <div className="flex-1 bg-gray-50/50 p-4 rounded-lg border border-gray-100 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-2 ${event.statusColor}`}>
                                    {event.status}
                                </span>
                                <h3 className="font-semibold text-gray-800">{event.contractName}</h3>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-700">{event.date}</div>
                                <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                                    <Clock size={12}/> {event.time}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">{event.title}</p>
                        <p className="text-xs font-medium mt-2 text-primary">
                            {event.daysLeft < 0 ? `Atrasado há ${Math.abs(event.daysLeft)} dias` : `Faltam ${event.daysLeft} dias`}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
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