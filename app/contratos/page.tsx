"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import { Search, Filter, Eye, Edit2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { ContractSimpleDto, ContractDetailsDto, ObligationDto } from "@/lib/api-types"

interface ContractSearchResult {
  id: string;
  officialNumber: string;
  status: string;
  statusColor: string;
  company: string;
  unit: string;
  value: string;
  validity: string;
}

export default function ContratosPage() {
  const [activeTab, setActiveTab] = useState("search")
  const [searchTerm, setSearchTerm] = useState("");
  

  const [allContracts, setAllContracts] = useState<ContractSearchResult[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractSearchResult[]>([]);
  

  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractDetails, setContractDetails] = useState<ContractDetailsDto | null>(null);
  

  const [detailsTab, setDetailsTab] = useState("info"); 'obligations'; 'noncompliance'


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "suspended": return "bg-yellow-100 text-yellow-800";
      case "terminated":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "draft": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };


  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contracts`);
        const data: ContractSimpleDto[] = await response.json();
        
        const mapped: ContractSearchResult[] = data.map(c => ({
          id: c.id,
          officialNumber: c.officialNumber,
          status: c.status,
          statusColor: getStatusColor(c.status),
          company: "...",
          unit: "...",   
          value: "...",  
          validity: "...",
        }));
        
        setAllContracts(mapped);
        setFilteredContracts(mapped);
      } catch (error) {
        console.error("Erro ao buscar contratos:", error);
      }
    };
    fetchContracts();
  }, []);


  useEffect(() => {
    if (!searchTerm) {
      setFilteredContracts(allContracts);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    setFilteredContracts(
      allContracts.filter(c => 
        c.officialNumber.toLowerCase().includes(lowerSearch) ||
        c.id.toLowerCase().includes(lowerSearch)
      )
    );
  }, [searchTerm, allContracts]);


  useEffect(() => {
    if (activeTab === "details" && selectedContractId) {
      const fetchDetails = async () => {
        setContractDetails(null);
        try {
          const response = await fetch(`${API_BASE_URL}/api/contracts/${selectedContractId}`);
          if (!response.ok) throw new Error("Contrato não encontrado");
          const data: ContractDetailsDto = await response.json();
          setContractDetails(data);
          setDetailsTab("info");
        } catch (error) {
          console.error("Erro ao buscar detalhes do contrato:", error);
          setActiveTab("search");
        }
      };
      fetchDetails();
    }
  }, [activeTab, selectedContractId]);
  
  const handleSelectContract = (id: string) => {
    setSelectedContractId(id);
    setActiveTab("details");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Buscar Contratos</h1>
            <p className="text-muted-foreground">Pesquise e filtre por contratos cadastrados</p>
          </div>

          {activeTab === "search" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
                <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-4">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por ID ou Nº Oficial"
                    className="flex-1 bg-transparent outline-none text-sm py-3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90">
                  <Filter size={18} />
                  Filtro
                </button>
              </div>

              {/* Results */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Resultados ({filteredContracts.length})</h2>
                <div className="space-y-4">
                  {filteredContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectContract(contract.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${contract.statusColor}`}>
                              {contract.status}
                            </span>
                            <span className="font-semibold text-foreground">{contract.officialNumber}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{contract.company}</p>
                          <p className="text-xs text-muted-foreground">ID: {contract.id}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye size={18} className="text-primary" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <button
                onClick={() => setActiveTab("search")}
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                ← Voltar
              </button>

              {!contractDetails ? (
                <div className="bg-white rounded-2xl shadow-sm p-6">Carregando...</div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{contractDetails.officialNumber}</h2>
                      <p className="text-muted-foreground">{contractDetails.supplierName}</p>
                    </div>
                    {/* Botão "Novo Resultado" pode ser para inspeção, não conformidade, etc. */}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-4 border-b border-gray-200 mb-6">
                    <button 
                      onClick={() => setDetailsTab("info")}
                      className={`px-4 py-3 font-medium ${detailsTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      Informações do contrato
                    </button>
                    <button 
                      onClick={() => setDetailsTab("obligations")}
                      className={`px-4 py-3 font-medium ${detailsTab === 'obligations' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      Obrigações ({contractDetails.obligations.length})
                    </button>
                    {/* Mapeamento de "Inspeções" para "Não Conformidades" que é o que o DTO fornece */}
                    <button 
                      onClick={() => setDetailsTab("noncompliance")}
                      className={`px-4 py-3 font-medium ${detailsTab === 'noncompliance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      Não Conformidades
                    </button>
                  </div>

                  {/* Aba de Informações */}
                  {detailsTab === 'info' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Fornecedor</p>
                        <p className="font-semibold text-foreground">{contractDetails.supplierName} ({contractDetails.supplierCnpj})</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                        <p className="font-semibold text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: contractDetails.currency }).format(contractDetails.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Unidade</p>
                        <p className="font-semibold text-foreground">{contractDetails.orgUnitName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Período de Vigência</p>
                        <p className="font-semibold text-foreground">
                          {new Date(contractDetails.termStart).toLocaleDateString()} - {new Date(contractDetails.termEnd).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tipo / Modalidade</p>
                        <p className="font-semibold text-foreground">{contractDetails.type} / {contractDetails.modality}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Processo Administrativo</p>
                        <p className="font-semibold text-foreground">{contractDetails.administrativeProcess || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Aba de Obrigações */}
                  {detailsTab === 'obligations' && (
                    <div className="space-y-4">
                      {contractDetails.obligations.map(ob => (
                        <div key={ob.id} className="p-4 border rounded-lg">
                          <h4 className="font-semibold">{ob.clauseRef} - {ob.description}</h4>
                          <p className="text-sm text-muted-foreground">Status: {ob.status} {ob.dueDate ? `| Vencimento: ${new Date(ob.dueDate).toLocaleDateString()}` : ''}</p>
                          <div className="mt-2 pl-4">
                            <h5 className="text-sm font-medium">Entregáveis ({ob.deliverables.length}):</h5>
                            <ul className="list-disc pl-5 text-sm">
                              {ob.deliverables.map(d => (
                                <li key={d.id}>
                                  {d.quantity} {d.unit} - Esperado em: {new Date(d.expectedDate).toLocaleDateString()}
                                  {d.deliveredAt ? ` (Entregue em: ${new Date(d.deliveredAt).toLocaleDateString()})` : ' (Pendente)'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Aba de Não Conformidades */}
                  {detailsTab === 'noncompliance' && (
                    <div className="space-y-4">
                      {contractDetails.obligations.flatMap(o => o.nonCompliances).map(nc => (
                        <div key={nc.id} className="p-4 border rounded-lg bg-red-50 border-red-200">
                          <h4 className="font-semibold text-red-800">Severidade: {nc.severity}</h4>
                          <p className="text-sm text-gray-700">Motivo: {nc.reason}</p>
                          <p className="text-xs text-gray-500">Registrado em: {new Date(nc.registeredAt).toLocaleString()}</p>
                          {nc.penalty && (
                            <div className="mt-2 p-2 border-t border-red-200">
                              <p className="font-medium text-sm">Penalidade Aplicada: {nc.penalty.type}</p>
                              {nc.penalty.amount && <p className="text-sm">Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nc.penalty.amount)}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                      {contractDetails.obligations.flatMap(o => o.nonCompliances).length === 0 && (
                        <p>Nenhuma não conformidade registrada para este contrato.</p>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}