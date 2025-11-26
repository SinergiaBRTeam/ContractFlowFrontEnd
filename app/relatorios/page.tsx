"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import { PieChart, CalendarOff, AlertCircle, Truck, Building2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { DueDeliverableReportDto, DeliveriesBySupplierDto, DeliveriesByOrgUnitDto } from "@/lib/api-types"

export default function RelatoriosPage() {
  const [reportType, setReportType] = useState<"due" | "status" | "supplier" | "orgunit">("due");
  
  // Dados tipados ou genéricos
  const [dueData, setDueData] = useState<DueDeliverableReportDto[]>([]);
  const [statusData, setStatusData] = useState<any>(null);
  const [supplierData, setSupplierData] = useState<DeliveriesBySupplierDto[]>([]);
  const [orgUnitData, setOrgUnitData] = useState<DeliveriesByOrgUnitDto[]>([]);
  
  const [loading, setLoading] = useState(false);

useEffect(() => {
    const fetchReport = async () => {
    setLoading(true);
    try {
        if (reportType === "due") {
            const res = await fetch(`${API_BASE_URL}/api/reports/due-deliverables`);
            if(res.ok) setDueData(await res.json());
        } else if (reportType === "status") {
            const res = await fetch(`${API_BASE_URL}/api/reports/contract-status`);
            if(res.ok) setStatusData(await res.json());
        } else if (reportType === "supplier") {
            const res = await fetch(`${API_BASE_URL}/api/reports/deliveries-by-supplier`);
            if(res.ok) setSupplierData(await res.json());
        } else if (reportType === "orgunit") {
            const res = await fetch(`${API_BASE_URL}/api/reports/deliveries-by-orgunit`);
            if(res.ok) setOrgUnitData(await res.json());
        }
      } catch (e) {
        console.error(e);
        // fallback para apresentação
        if (reportType === "due") {
          setDueData([
            { contractId: "demo-1", officialNumber: "DEMO-001/2024", deliverableId: "dev-1", description: "Relatório mensal", expectedDate: new Date().toISOString(), daysOverdue: 5 }
          ]);
        } else if (reportType === "status") {
          setStatusData({ active: 3, suspended: 1, terminated: 0, completed: 2 });
        } else if (reportType === "supplier") {
          setSupplierData([{ supplierName: "Fornecedor Mock", totalDeliveries: 12, onTime: 10, late: 2 }]);
        } else if (reportType === "orgunit") {
          setOrgUnitData([{ orgUnitName: "Unidade Demo", totalDeliveries: 8 }]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportType]);

return (
    <div className="flex h-screen bg-background">
    <Sidebar />
    <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">Métricas consolidadas da gestão contratual</p>
        </div>

        {/* Seletor de Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <ReportButton 
                active={reportType === "due"} 
                onClick={() => setReportType("due")}
                icon={CalendarOff} 
                title="Atrasos" 
                subtitle="Itens vencidos" 
            />
            <ReportButton 
                active={reportType === "status"} 
                onClick={() => setReportType("status")}
                icon={PieChart} 
                title="Status" 
                subtitle="Visão geral" 
            />
            <ReportButton 
                active={reportType === "supplier"} 
                onClick={() => setReportType("supplier")}
                icon={Truck} 
                title="Por Fornecedor" 
                subtitle="Desempenho de entregas" 
            />
            <ReportButton 
                active={reportType === "orgunit"} 
                onClick={() => setReportType("orgunit")}
                icon={Building2} 
                title="Por Unidade" 
                subtitle="Demandas por setor" 
            />
        </div>

        {/* Área de Conteúdo */}
        <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[400px]">
            {loading && <p className="text-center py-10 text-gray-500">Carregando dados...</p>}

            {!loading && reportType === "due" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <AlertCircle className="text-red-500" /> Entregáveis Vencidos
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="p-3">Contrato</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3">Data Prevista</th>
                                    <th className="p-3">Atraso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dueData.map((item, i) => {
                                    // FIX: If essential data is missing, skip the row entirely
                                    if (!item.officialNumber && !item.description) return null;

                                    return (
                                        <tr key={i} className="border-b last:border-0">
                                            {/* Add fallback text using || operator */}
                                            <td className="p-3 font-medium">{item.officialNumber || "—"}</td>
                                            <td className="p-3">{item.description || "Sem descrição"}</td>
                                            <td className="p-3">{new Date(item.expectedDate).toLocaleDateString()}</td>
                                            <td className="p-3 text-red-600 font-bold">
                                                {/* Ensure a number always displays */}
                                                {item.daysOverdue ?? 0} dias
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {dueData.length === 0 && <p className="text-center py-4 text-gray-500">Nenhum atraso.</p>}
                    </div>
                </div>
            )}

            {!loading && reportType === "status" && statusData && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold mb-4">Distribuição de Status</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatusCard title="Ativos" value={statusData.active || 0} color="text-green-600" bg="bg-green-50" />
                        <StatusCard title="Suspensos" value={statusData.suspended || 0} color="text-yellow-600" bg="bg-yellow-50" />
                        <StatusCard title="Encerrados" value={statusData.terminated || 0} color="text-red-600" bg="bg-red-50" />
                        <StatusCard title="Concluídos" value={statusData.completed || 0} color="text-blue-600" bg="bg-blue-50" />
                    </div>
                </div>
            )}

            {!loading && reportType === "supplier" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Entregas por Fornecedor</h2>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-3">Fornecedor</th>
                                <th className="p-3 text-center">Total Entregas</th>
                                <th className="p-3 text-center">No Prazo</th>
                                <th className="p-3 text-center">Atrasadas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierData.map((item, i) => (
                                <tr key={i} className="border-b last:border-0">
                                    <td className="p-3 font-medium">{item.supplierName}</td>
                                    <td className="p-3 text-center">{item.totalDeliveries}</td>
                                    <td className="p-3 text-center text-green-600">{item.onTime}</td>
                                    <td className="p-3 text-center text-red-600">{item.late}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && reportType === "orgunit" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Entregas por Unidade Organizacional</h2>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-3">Unidade</th>
                                <th className="p-3 text-center">Total Entregas Recebidas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgUnitData.map((item, i) => (
                                <tr key={i} className="border-b last:border-0">
                                    <td className="p-3 font-medium">{item.orgUnitName}</td>
                                    <td className="p-3 text-center font-bold text-primary">{item.totalDeliveries}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </main>
    </div>
  )
}

function ReportButton({ active, onClick, icon: Icon, title, subtitle }: any) {
    return (
        <button 
            onClick={onClick} 
            className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-colors ${active ? "bg-primary text-white border-primary" : "bg-white hover:bg-gray-50"}`}
        >
            <Icon size={24} />
            <div><div className="font-bold">{title}</div><div className="text-xs opacity-80">{subtitle}</div></div>
        </button>
    )
}

function StatusCard({ title, value, color, bg }: { title: string, value: number, color: string, bg: string }) {
    return (
        <div className={`p-6 border rounded-xl ${bg} flex flex-col items-center justify-center`}>
            <p className="text-gray-500 uppercase text-sm font-semibold mb-2">{title}</p>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
        </div>
    )
}