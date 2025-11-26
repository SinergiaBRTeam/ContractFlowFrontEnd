"use client"

import Sidebar from "@/components/sidebar"
import { AlertTriangle, TrendingUp, Shield, AlertCircle, FileText, Filter, RefreshCw } from "lucide-react"
import { ChangeEvent, ComponentType, useState, useEffect, useMemo } from "react"
import { API_BASE_URL } from "@/lib/config"
import { PenaltyReportDto, ContractSimpleDto, DueDeliverableReportDto } from "@/lib/api-types"

interface RiskItem {
  id: string;
  type: string;
  contractName: string;
  level: string;
  levelColor: string;
  description: string;
  date: string;
  value: number | null;
  source: "penalty" | "deliverable";
}

type SeverityFilter = "Todos" | "Alto" | "Médio" | "Baixo"

export default function PainelRiscosPage() {
  const [risks, setRisks] = useState<RiskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ high: 0, medium: 0, low: 0 });
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [dataUnavailable, setDataUnavailable] = useState(false)

  useEffect(() => {
    const fetchRisks = async () => {
      setLoading(true)
      try {
        const [penaltiesRes, dueDeliverablesRes, contractsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/reports/penalties`),
          fetch(`${API_BASE_URL}/api/reports/due-deliverables`),
          fetch(`${API_BASE_URL}/api/contracts`),
        ])

        const contractsData: ContractSimpleDto[] = contractsRes.status === "fulfilled" && contractsRes.value.ok
          ? await contractsRes.value.json()
          : []

        const contractMap = new Map(contractsData.map((c) => [c.id, c.officialNumber]))

        let high = 0,
          medium = 0,
          low = 0

        const mappedRisks: RiskItem[] = []

        if (penaltiesRes.status === "fulfilled" && penaltiesRes.value.ok) {
          const penaltiesData: PenaltyReportDto[] = await penaltiesRes.value.json()
          penaltiesData.forEach((r) => {
            const { level, color } = mapSeverityFromString(r.severity)
            if (level === "Alto") high++
            if (level === "Médio") medium++
            if (level === "Baixo") low++

            mappedRisks.push({
              id: r.penaltyId,
              type: r.type,
              contractName: contractMap.get(r.contractId) || `ID: ${r.contractId.substring(0, 8)}...`,
              level,
              levelColor: color,
              description: r.reason,
              date: new Date(r.registeredAt).toLocaleDateString("pt-BR"),
              value: r.amount || 0,
              source: "penalty",
            })
          })
        }

        if (dueDeliverablesRes.status === "fulfilled" && dueDeliverablesRes.value.ok) {
          const dueDeliverables: DueDeliverableReportDto[] = await dueDeliverablesRes.value.json()
          dueDeliverables.forEach((item) => {
            const { level, color } = mapSeverityFromDelay(item.daysOverdue)
            if (level === "Alto") high++
            if (level === "Médio") medium++
            if (level === "Baixo") low++

            mappedRisks.push({
              id: item.deliverableId,
              type: "Entrega Atrasada",
              contractName: item.officialNumber || contractMap.get(item.contractId) || "Contrato não identificado",
              level,
              levelColor: color,
              description: `${item.description} • ${item.daysOverdue} dia(s) em atraso`,
              date: new Date(item.expectedDate).toLocaleDateString("pt-BR"),
              value: null,
              source: "deliverable",
            })
          })
        }

        if (mappedRisks.length === 0) {
          setDataUnavailable(true)
          setRisks([])
          setStats({ high: 0, medium: 0, low: 0 })
          return
        }

        setDataUnavailable(false)
        setRisks(mappedRisks)
        setStats({ high, medium, low })
      } catch (error) {
        console.error(error)
        setRisks([])
        setStats({ high: 0, medium: 0, low: 0 })
        setDataUnavailable(true)
      } finally {
        setLoading(false)
      }
    }

    fetchRisks()
  }, [])

  const totalRisks = stats.high + stats.medium + stats.low;

  const filteredRisks = useMemo(() => {
    const list = severityFilter === "Todos" ? risks : risks.filter((r) => r.level === severityFilter)
    const searched = searchTerm.trim()
    const normalized = searched.toLowerCase()
    const afterSearch = normalized
      ? list.filter(
          (r) =>
            r.contractName.toLowerCase().includes(normalized) ||
            r.description.toLowerCase().includes(normalized) ||
            r.type.toLowerCase().includes(normalized),
        )
      : list

    const severityOrder: Record<string, number> = { Alto: 0, "Médio": 1, Baixo: 2 }
    return [...afterSearch].sort((a, b) => severityOrder[a.level] - severityOrder[b.level])
  }, [risks, severityFilter, searchTerm])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Gestão de Riscos</h1>
            <p className="text-muted-foreground">Monitoramento de penalidades e entregas em atraso</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-white">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={severityFilter}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSeverityFilter(event.target.value as SeverityFilter)
                  }
                  className="outline-none bg-transparent text-sm text-gray-700"
                >
                  <option value="Todos">Todos os riscos</option>
                  <option value="Alto">Apenas altos</option>
                <option value="Médio">Apenas médios</option>
                <option value="Baixo">Apenas baixos</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar por contrato ou motivo"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white min-w-[260px]"
            />

            <button
              onClick={() => {
                setSeverityFilter("Todos")
                setSearchTerm("")
              }}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Limpar filtros
            </button>
          </div>
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
                ) : dataUnavailable ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
                    <p className="font-semibold mb-1">Dados de riscos indisponíveis.</p>
                    <p className="text-sm text-gray-500">Verifique a configuração da API antes de tentar novamente.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                  {filteredRisks.length === 0 ? <p className="text-gray-500">Nenhum risco encontrado para o filtro.</p> : filteredRisks.map((risk) => (
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
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm text-gray-700">{risk.type}</p>
                                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-white border text-gray-500">
                                    {risk.source === "penalty" ? "Penalidade" : "Entrega"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                                {risk.value && risk.value > 0 && (
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
                {dataUnavailable ? (
                  <p className="text-center text-sm text-gray-500">Sem dados de risco para exibir no momento.</p>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
      </main>
    </div>
  )
}

  interface RiskCardProps {
    title: string;
    value: number;
    icon: ComponentType<{ size?: number; className?: string }>;
    color: string;
  }

  function RiskCard({ title, value, icon: Icon, color }: RiskCardProps) {
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

function mapSeverityFromString(severity: string | undefined) {
  const sev = (severity || "").toLowerCase()
  if (sev.includes("alto") || sev.includes("high") || sev.includes("grave")) {
    return { level: "Alto", color: "bg-red-100 text-red-800 border-red-200" }
  }
  if (sev.includes("médio") || sev.includes("medio") || sev.includes("medium")) {
    return { level: "Médio", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
  }
  return { level: "Baixo", color: "bg-green-100 text-green-800 border-green-200" }
}

function mapSeverityFromDelay(daysOverdue: number) {
  if (daysOverdue >= 30) return { level: "Alto", color: "bg-red-100 text-red-800 border-red-200" }
  if (daysOverdue >= 7) return { level: "Médio", color: "bg-yellow-100 text-yellow-800 border-yellow-200" }
  return { level: "Baixo", color: "bg-green-100 text-green-800 border-green-200" }
}
