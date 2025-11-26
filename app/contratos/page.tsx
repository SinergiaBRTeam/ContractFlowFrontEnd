"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import {Download, FileText, Camera} from "lucide-react"
import { Search, Eye, Trash2, Plus, AlertTriangle, Scale, ClipboardCheck, UploadCloud, CheckCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"
import {
  ContractSimpleDto, ContractDetailsDto, CreateObligationRequest,
  CreateDeliverableRequest, RegisterNonComplianceRequest, ApplyPenaltyRequest,
  CreateInspectionRequest
} from "@/lib/api-types"

interface ContractSearchResult {
  id: string;
  officialNumber: string;
  status: string;
  statusColor: string;
  company: string;
}

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
}

interface InspectionViewDto {
  id: string;
  date: string;
  inspector: string;
  notes: string;
}

export default function ContratosPage() {
  // ... (Mantenha os estados existentes: activeTab, searchTerm, etc.)
  const [activeTab, setActiveTab] = useState("search")
  const [searchTerm, setSearchTerm] = useState("");
  const [allContracts, setAllContracts] = useState<ContractSearchResult[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractSearchResult[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [contractDetails, setContractDetails] = useState<ContractDetailsDto | null>(null);
  const [detailsTab, setDetailsTab] = useState("info");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [inspectionsList, setInspectionsList] = useState<InspectionViewDto[]>([]);
  const [viewingDeliverableId, setViewingDeliverableId] = useState<string | null>(null);
  
  // Modais
  const [activeModal, setActiveModal] = useState<"deliverable" | "noncompliance" | "penalty" | "inspection" | "evidence" | null>(null);
  
  // IDs selecionados
  const [selectedObligationId, setSelectedObligationId] = useState("");
  const [selectedNcId, setSelectedNcId] = useState("");
  const [selectedDeliverableId, setSelectedDeliverableId] = useState(""); // NOVO

  // Forms
  const [showObliForm, setShowObliForm] = useState(false);
  const [newObligation, setNewObligation] = useState<CreateObligationRequest>({ clauseRef: "", description: "", dueDate: "", status: "Pendente" });
  const [newDeliverable, setNewDeliverable] = useState<CreateDeliverableRequest>({ expectedDate: "", quantity: 1, unit: "" });
  const [newNonCompliance, setNewNonCompliance] = useState<RegisterNonComplianceRequest>({ reason: "", severity: "Baixo" });
  const [newPenalty, setNewPenalty] = useState<ApplyPenaltyRequest>({ type: "Multa", legalBasis: "", amount: 0 });
  
  // NOVOS ESTADOS PARA FISCALIZAÇÃO
  const [newInspection, setNewInspection] = useState<CreateInspectionRequest>({ date: "", inspector: "", notes: "" });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // ... (Mantenha getStatusColor, fetchDetails, fetchContracts, useEffects, handleAddObligation, handleDeleteObligation) ...
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "suspended": return "bg-yellow-100 text-yellow-800";
      case "terminated": case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const demoContractDetails: ContractDetailsDto = {
    id: "demo-1",
    officialNumber: "DEMO-001/2024",
    administrativeProcess: "12345/2024",
    type: "Servico",
    modality: "Pregao",
    status: "Active",
    termStart: new Date().toISOString(),
    termEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    totalAmount: 100000,
    currency: "BRL",
    supplierId: "sup-1",
    supplierName: "Fornecedor Exemplo",
    supplierCnpj: "00.000.000/0001-00",
    orgUnitId: "org-1",
    orgUnitName: "Unidade Modelo",
    orgUnitCode: "UMD",
    obligations: [
      {
        id: "ob-1",
        clauseRef: "2.1",
        description: "Entrega mensal de relatórios",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        status: "Pendente",
        deliverables: [
          {
            id: "dev-1",
            expectedDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
            quantity: 1,
            unit: "Relatório",
          },
        ],
        nonCompliances: [],
      },
    ],
  };

  const fetchDetails = async () => {
    if (!selectedContractId) return;
    if (demoMode) {
      setContractDetails({ ...demoContractDetails, id: selectedContractId, officialNumber: `DEMO-${selectedContractId}` });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/contracts/${selectedContractId}`);
      if (!response.ok) throw new Error("Erro");
      const data = await response.json();
      setContractDetails(data);
    } catch (error) { console.error(error); }
  };

  const fetchAttachments = async () => {
    if (!selectedContractId) return;
    if (demoMode) {
      setAttachments([{ id: "att-1", fileName: "contrato.pdf", mimeType: "application/pdf" }]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/contracts/${selectedContractId}/attachments`);
      if (res.ok) setAttachments(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchInspections = async (deliverableId: string) => {
    if (demoMode) {
      setViewingDeliverableId(deliverableId);
      setInspectionsList([{ id: "insp-1", date: new Date().toISOString(), inspector: "Fiscal Mock", notes: "Tudo em ordem." }]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/deliverables/${deliverableId}/inspections`);
      if (res.ok) {
        setInspectionsList(await res.json());
        setViewingDeliverableId(deliverableId);
      }
    } catch (e) { console.error(e); }
  };

  const handleDownloadAttachment = (id: string, fileName: string) => {
      if (demoMode) {
        toast.info(`Download simulado de "${fileName}" em modo demonstração.`);
        return;
      }
      window.open(`${API_BASE_URL}/api/attachments/${id}/download`, '_blank');
  };

  // Atualize o useEffect que carrega detalhes para buscar anexos também
  useEffect(() => {
    if (activeTab === "details" && selectedContractId) { 
        fetchDetails(); 
        fetchAttachments();
        setDetailsTab("info"); 
    }
  }, [activeTab, selectedContractId]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contracts`);
        if (!response.ok) throw new Error("erro");
        const data: ContractSimpleDto[] = await response.json();
        const mapped = data.map(c => ({
          id: c.id,
          officialNumber: c.officialNumber,
          status: c.status,
          statusColor: getStatusColor(c.status),
          company: `ID: ${c.id.substring(0, 8)}...`
        }));
        setAllContracts(mapped);
        setFilteredContracts(mapped);
      } catch (error) {
        console.error(error);
        setDemoMode(true);
        const mapped = [
          { id: "demo-1", officialNumber: "DEMO-001/2024", status: "Active", statusColor: getStatusColor("Active"), company: "Fornecedor Exemplo" },
          { id: "demo-2", officialNumber: "DEMO-002/2024", status: "Suspended", statusColor: getStatusColor("Suspended"), company: "Fornecedor 2" },
        ];
        setAllContracts(mapped);
        setFilteredContracts(mapped);
        setContractDetails(demoContractDetails);
        setAttachments([{ id: "att-1", fileName: "contrato.pdf", mimeType: "application/pdf" }]);
        setSelectedContractId("demo-1");
      }
    };
    fetchContracts();
  }, []);

  useEffect(() => {
    if (!contractDetails?.obligations?.length) return;
    if (activeModal === "deliverable" || activeModal === "noncompliance") {
      setSelectedObligationId((current) => current || contractDetails.obligations[0].id);
    }
  }, [activeModal, contractDetails]);

  useEffect(() => {
    if (!searchTerm) { setFilteredContracts(allContracts); return; }
    setFilteredContracts(allContracts.filter(c => c.officialNumber.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, allContracts]);

  const toIsoOrNull = (value?: string | null) => value ? new Date(value).toISOString() : null;

  const handleAddObligation = async () => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    if (!selectedContractId) return;
    try {
      const payload: CreateObligationRequest = {
        ...newObligation,
        dueDate: toIsoOrNull(newObligation.dueDate),
      };
      const res = await fetch(`${API_BASE_URL}/api/contracts/${selectedContractId}/obligations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erro ao adicionar");
      setShowObliForm(false);
      setNewObligation({ clauseRef: "", description: "", dueDate: "", status: "Pendente" });
      fetchDetails();
      toast.success("Obrigação adicionada!");
    } catch (e) { toast.error("Erro ao salvar obrigação."); }
  };

  const handleDeleteObligation = async (id: string) => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/obligations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
      fetchDetails();
      toast.success("Obrigação excluída.");
    } catch (e) { toast.error("Erro ao excluir."); }
  };

  const handleCreateDeliverable = async () => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    if (!selectedObligationId || !newDeliverable.expectedDate) {
      toast.warning("Preencha a data prevista antes de salvar o entregável.");
      return;
    }
    try {
      const payload: CreateDeliverableRequest = {
        expectedDate: new Date(newDeliverable.expectedDate).toISOString(),
        quantity: Number(newDeliverable.quantity),
        ...(newDeliverable.unit ? { unit: newDeliverable.unit } : {}),
      };
      const res = await fetch(`${API_BASE_URL}/api/obligations/${selectedObligationId}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setActiveModal(null);
      setNewDeliverable({ expectedDate: "", quantity: 1, unit: "" });
      fetchDetails();
      toast.success("Entregável criado!");
    } catch { toast.error("Erro ao criar entregável"); }
  };

  const handleMarkDelivered = async (deliverableId: string) => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/deliverables/${deliverableId}/delivered`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveredAt: new Date().toISOString() })
      });
      if (!res.ok) throw new Error();
      fetchDetails();
      toast.success("Entrega registrada!");
    } catch { toast.error("Erro ao marcar entrega"); }
  };

  const handleRegisterNonCompliance = async () => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    if (!selectedObligationId) return;
    try {
      const payload: RegisterNonComplianceRequest = {
        reason: newNonCompliance.reason || null,
        severity: newNonCompliance.severity || null,
      };
      const res = await fetch(`${API_BASE_URL}/api/obligations/${selectedObligationId}/noncompliances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setActiveModal(null);
      setNewNonCompliance({ reason: "", severity: "Baixo" });
      fetchDetails();
      toast.success("Não conformidade registrada!");
    } catch { toast.error("Erro ao registrar"); }
  };

  const handleApplyPenalty = async () => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    if (!selectedNcId) return;
    try {
      const payload: ApplyPenaltyRequest = {
        type: newPenalty.type || null,
        legalBasis: newPenalty.legalBasis || null,
        amount: newPenalty.amount ?? null,
      };
      const res = await fetch(`${API_BASE_URL}/api/noncompliances/${selectedNcId}/penalties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setActiveModal(null);
      setNewPenalty({ type: "Multa", legalBasis: "", amount: 0 });
      fetchDetails();
      toast.success("Penalidade aplicada!");
    } catch { toast.error("Erro ao aplicar penalidade"); }
  };

  const handleRegisterInspection = async () => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    if (!selectedDeliverableId) return;
    try {
      const payload: CreateInspectionRequest = {
        ...newInspection,
        date: newInspection.date ? new Date(newInspection.date).toISOString() : new Date().toISOString(),
        inspector: newInspection.inspector || null,
        notes: newInspection.notes || null,
      };
      const res = await fetch(`${API_BASE_URL}/api/deliverables/${selectedDeliverableId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setActiveModal(null);
      setNewInspection({ date: "", inspector: "", notes: "" });
      fetchDetails();
      fetchInspections(selectedDeliverableId);
      toast.success("Inspeção registrada!");
    } catch { toast.error("Erro ao registrar inspeção."); }
  };

  const handleUploadEvidence = async () => {
    if (demoMode) { toast.warning("Disponível apenas com o backend ativo."); return; }
    if (!selectedDeliverableId || !evidenceFile) return;
    const formData = new FormData();
    formData.append("File", evidenceFile);
    formData.append("notes", "Evidência anexada via web");

    try {
      const res = await fetch(`${API_BASE_URL}/api/deliverables/${selectedDeliverableId}/evidences`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error();
      setActiveModal(null);
      setEvidenceFile(null);
      toast.success("Evidência enviada!");
    } catch { toast.error("Erro no upload de evidência."); }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Buscar Contratos</h1>
          <p className="text-muted-foreground">Pesquise e gerencie obrigações contratuais</p>
        </div>

        {activeTab === "search" && (
          <div className="space-y-6">
            {/* ... (Mantenha a barra de busca e lista de contratos) ... */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-4">
                <Search size={20} className="text-gray-400" />
                <input type="text" placeholder="Buscar por Nº Oficial" className="flex-1 bg-transparent outline-none text-sm py-3" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="space-y-4">
                {filteredContracts.map((contract) => (
                  <div key={contract.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md cursor-pointer flex justify-between items-center" onClick={() => { setSelectedContractId(contract.id); setActiveTab("details"); }}>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${contract.statusColor}`}>{contract.status}</span>
                        <span className="font-semibold">{contract.officialNumber}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {contract.id}</p>
                    </div>
                    <Eye size={18} className="text-primary" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && contractDetails && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <button onClick={() => setActiveTab("search")} className="text-primary text-sm mb-4">← Voltar</button>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{contractDetails.officialNumber}</h2>
              <span className="text-sm text-muted-foreground">{contractDetails.supplierName}</span>
            </div>

            <div className="flex gap-4 border-b mb-6">
              {["info", "obligations", "execution"].map(t => (
                <button key={t} onClick={() => setDetailsTab(t)} className={`px-4 py-2 font-medium capitalize ${detailsTab === t ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}>
                  {t === "info" ? "Informações" : t === "obligations" ? "Obrigações" : "Execução & Fiscalização"}
                </button>
              ))}
            </div>

            {/* ... (Aba Info e Obligations mantidas) ... */}
            {detailsTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div><p className="text-xs text-gray-500">Fornecedor</p><p className="font-medium">{contractDetails.supplierName}</p></div>
                  <div><p className="text-xs text-gray-500">Valor</p><p className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: contractDetails.currency }).format(contractDetails.totalAmount)}</p></div>
                  <div><p className="text-xs text-gray-500">Vigência</p><p className="font-medium">{new Date(contractDetails.termStart).toLocaleDateString()} - {new Date(contractDetails.termEnd).toLocaleDateString()}</p></div>
                  <div><p className="text-xs text-gray-500">Modalidade</p><p className="font-medium">{contractDetails.modality}</p></div>
                </div>
                
                {/* LISTA DE ANEXOS DO CONTRATO */}
                <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><FileText size={18}/> Documentos Anexados</h4>
                    {attachments.length === 0 ? <p className="text-sm text-gray-400">Nenhum documento.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex justify-between items-center p-2 border rounded bg-gray-50 text-sm">
                                    <span className="truncate max-w-[200px]">{att.fileName}</span>
                                    <button onClick={() => handleDownloadAttachment(att.id, att.fileName)} className="text-blue-600 hover:underline flex items-center gap-1">
                                        <Download size={14}/> Baixar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            )}

            {detailsTab === 'obligations' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowObliForm(!showObliForm)} className="flex items-center gap-2 text-sm bg-primary text-white px-3 py-1 rounded hover:bg-primary/90">
                    <Plus size={16} /> Nova Obrigação
                  </button>
                </div>
                {showObliForm && (
                  <div className="bg-gray-50 p-4 rounded border">
                    {/* Form Obrigação */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <input className="border p-1 rounded text-sm" placeholder="Ref. Cláusula (ex: 2.1)" value={newObligation.clauseRef} onChange={e => setNewObligation({...newObligation, clauseRef: e.target.value})} />
                      <input className="border p-1 rounded text-sm md:col-span-2" placeholder="Descrição" value={newObligation.description} onChange={e => setNewObligation({...newObligation, description: e.target.value})} />
                      <input type="date" className="border p-1 rounded text-sm" value={newObligation.dueDate || ''} onChange={e => setNewObligation({...newObligation, dueDate: e.target.value})} />
                      <button onClick={handleAddObligation} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Salvar</button>
                    </div>
                  </div>
                )}
                {contractDetails.obligations.map(ob => (
                  <div key={ob.id} className="p-4 border rounded-lg flex justify-between items-start group">
                    <div>
                      <h4 className="font-semibold">{ob.clauseRef} - {ob.description}</h4>
                      <p className="text-sm text-muted-foreground">Status: {ob.status} | Vencimento: {ob.dueDate ? new Date(ob.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <button onClick={() => handleDeleteObligation(ob.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {detailsTab === 'execution' && (
              <div className="space-y-8">
                {contractDetails.obligations.map(ob => (
                  <div key={ob.id} className="border rounded-xl p-6 bg-gray-50">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold text-lg text-gray-800">Obrigação: {ob.description}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedObligationId(ob.id); setActiveModal("deliverable"); }} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1">
                          <Plus size={14} /> Add Entregável
                        </button>
                        <button onClick={() => { setSelectedObligationId(ob.id); setActiveModal("noncompliance"); }} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 flex items-center gap-1">
                          <AlertTriangle size={14} /> Reportar Falha
                        </button>
                      </div>
                    </div>

                    {/* Lista de Entregáveis */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Entregas e Fiscalização</h4>
                      {ob.deliverables.length === 0 ? <p className="text-sm text-gray-400">Nenhum entregável definido.</p> : (
                        <div className="space-y-2">
                          {ob.deliverables.map(dev => (
                            <div key={dev.id} className="bg-white border p-3 rounded mb-2 transition-all">
                              <div className="flex justify-between items-center">
                                {/* Informações do Entregável */}
                                <div>
                                  <span className="font-medium">{dev.quantity} {dev.unit}</span>
                                  <span className="text-sm text-gray-500 mx-2">|</span>
                                  <span className={`text-sm ${new Date(dev.expectedDate) < new Date() && !dev.deliveredAt ? "text-red-600 font-bold" : "text-gray-500"}`}>
                                    Previsto: {new Date(dev.expectedDate).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Botões de Ação */}
                                <div className="flex gap-2 items-center">
                                  {/* 1. Botão para Abrir/Fechar o Histórico de Inspeções (NOVO) */}
                                  <button 
                                    onClick={() => viewingDeliverableId === dev.id ? setViewingDeliverableId(null) : fetchInspections(dev.id)} 
                                    className={`text-xs px-2 py-1 rounded flex gap-1 transition-colors ${viewingDeliverableId === dev.id ? "bg-gray-200 text-gray-800" : "border border-gray-300 hover:bg-gray-50 text-gray-600"}`}
                                    title="Ver histórico de inspeções"
                                  >
                                    <Camera size={14}/> {viewingDeliverableId === dev.id ? "Ocultar" : "Histórico"}
                                  </button>
                                  
                                  {/* 2. Botão Registrar Inspeção */}
                                  <button 
                                    onClick={() => { setSelectedDeliverableId(dev.id); setActiveModal("inspection"); }} 
                                    className="text-xs border border-blue-200 text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex gap-1" 
                                    title="Registrar Nova Inspeção"
                                  >
                                    <ClipboardCheck size={14}/> +Insp.
                                  </button>

                                  {/* 3. Botão Anexar Evidência (JÁ EXISTIA) */}
                                  <button 
                                    onClick={() => { setSelectedDeliverableId(dev.id); setActiveModal("evidence"); }} 
                                    className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 flex gap-1" 
                                    title="Anexar Arquivo de Evidência"
                                  >
                                    <UploadCloud size={14}/> Evid.
                                  </button>

                                  {/* 4. Status de Entrega (JÁ EXISTIA) */}
                                  {dev.deliveredAt ? (
                                    <span className="text-green-600 text-sm font-bold flex items-center gap-1 px-2 bg-green-50 rounded border border-green-100">
                                      <CheckCircle size={14}/> Entregue
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => handleMarkDelivered(dev.id)} 
                                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 shadow-sm"
                                    >
                                      Concluir
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* --- ÁREA EXPANSÍVEL DE HISTÓRICO DE INSPEÇÕES (NOVO) --- */}
                              {/* Só aparece se viewingDeliverableId for igual ao ID deste entregável */}
                              {viewingDeliverableId === dev.id && (
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                  <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <FileText size={14}/> Histórico de Fiscalização
                                  </h5>
                                  
                                  {inspectionsList.length === 0 ? (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                      <p className="text-xs text-gray-400">Nenhuma inspeção registrada para este item.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                                      {inspectionsList.map(ins => (
                                        <div key={ins.id} className="text-sm bg-gray-50 p-3 rounded-r-lg border-b border-gray-100 last:border-0">
                                          <div className="flex justify-between font-semibold text-gray-700 mb-1">
                                            <span className="flex items-center gap-2">
                                              📅 {new Date(ins.date).toLocaleDateString()} 
                                              <span className="font-normal text-gray-400">|</span> 
                                              👤 {ins.inspector}
                                            </span>
                                          </div>
                                          <p className="text-gray-600 text-xs italic">“{ins.notes || "Sem observações registradas."}”</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lista de Não Conformidades */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Histórico de Falhas</h4>
                      {ob.nonCompliances.length === 0 ? <p className="text-sm text-gray-400">Nenhuma falha registrada.</p> : (
                        <div className="space-y-2">
                          {ob.nonCompliances.map(nc => (
                            <div key={nc.id} className="bg-red-50 border border-red-100 p-3 rounded">
                              <div className="flex justify-between">
                                <p className="font-bold text-red-800">{nc.severity} - {nc.reason}</p>
                                {!nc.penalty && (
                                  <button onClick={() => { setSelectedNcId(nc.id); setActiveModal("penalty"); }} className="text-xs bg-red-800 text-white px-2 py-1 rounded flex items-center gap-1">
                                    <Scale size={12} /> Aplicar Penalidade
                                  </button>
                                )}
                              </div>
                              {nc.penalty && (
                                <div className="mt-2 text-xs bg-white/50 p-2 rounded text-red-900">
                                  <strong>Penalidade Aplicada:</strong> {nc.penalty.type} (R$ {nc.penalty.amount})
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- MODAIS --- */}
        
        {/* Modal Entregável */}
        {activeModal === "deliverable" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="font-bold mb-4">Novo Entregável</h3>
              <select
                className="w-full border p-2 rounded mb-2"
                value={selectedObligationId}
                onChange={(e) => setSelectedObligationId(e.target.value)}
              >
                {contractDetails?.obligations.map((ob) => (
                  <option key={ob.id} value={ob.id}>
                    {ob.description}
                  </option>
                ))}
              </select>
              <input type="date" value={newDeliverable.expectedDate as string} className="w-full border p-2 rounded mb-2" onChange={e => setNewDeliverable({...newDeliverable, expectedDate: e.target.value})} />
              <input type="number" value={newDeliverable.quantity} placeholder="Quantidade" className="w-full border p-2 rounded mb-2" onChange={e => setNewDeliverable({...newDeliverable, quantity: Number(e.target.value)})} />
              <input type="text" value={newDeliverable.unit ?? ""} placeholder="Unidade (ex: Relatório, Km)" className="w-full border p-2 rounded mb-4" onChange={e => setNewDeliverable({...newDeliverable, unit: e.target.value})} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button onClick={handleCreateDeliverable} className="px-4 py-2 bg-primary text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Não Conformidade */}
        {activeModal === "noncompliance" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="font-bold mb-4">Registrar Falha</h3>
              <select
                className="w-full border p-2 rounded mb-2"
                value={selectedObligationId}
                onChange={(e) => setSelectedObligationId(e.target.value)}
              >
                {contractDetails?.obligations.map((ob) => (
                  <option key={ob.id} value={ob.id}>
                    {ob.description}
                  </option>
                ))}
              </select>
              <input type="text" placeholder="Motivo" className="w-full border p-2 rounded mb-2" onChange={e => setNewNonCompliance({...newNonCompliance, reason: e.target.value})} />
              <select className="w-full border p-2 rounded mb-4" onChange={e => setNewNonCompliance({...newNonCompliance, severity: e.target.value})}>
                <option value="Baixo">Baixo</option><option value="Médio">Médio</option><option value="Alto">Alto</option>
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button onClick={handleRegisterNonCompliance} className="px-4 py-2 bg-red-600 text-white rounded">Registrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Penalidade */}
        {activeModal === "penalty" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="font-bold mb-4">Aplicar Penalidade</h3>
              <select className="w-full border p-2 rounded mb-2" onChange={e => setNewPenalty({...newPenalty, type: e.target.value})}>
                <option value="Multa">Multa</option><option value="Advertência">Advertência</option><option value="Suspensão">Suspensão</option>
              </select>
              <input type="text" placeholder="Base Legal (Cláusula)" className="w-full border p-2 rounded mb-2" onChange={e => setNewPenalty({...newPenalty, legalBasis: e.target.value})} />
              <input type="number" placeholder="Valor (R$)" className="w-full border p-2 rounded mb-4" onChange={e => setNewPenalty({...newPenalty, amount: Number(e.target.value)})} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button onClick={handleApplyPenalty} className="px-4 py-2 bg-red-800 text-white rounded">Aplicar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Inspeção (NOVO) */}
        {activeModal === "inspection" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="font-bold mb-4">Registrar Inspeção</h3>
              <input type="date" className="w-full border p-2 rounded mb-2" onChange={e => setNewInspection({...newInspection, date: e.target.value})} />
              <input type="text" placeholder="Fiscal Responsável" className="w-full border p-2 rounded mb-2" onChange={e => setNewInspection({...newInspection, inspector: e.target.value})} />
              <textarea placeholder="Notas da Vistoria..." className="w-full border p-2 rounded mb-4" onChange={e => setNewInspection({...newInspection, notes: e.target.value})} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button onClick={handleRegisterInspection} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Evidência (NOVO) */}
        {activeModal === "evidence" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="font-bold mb-4">Anexar Evidência</h3>
              <div className="border-2 border-dashed border-gray-300 p-8 rounded text-center cursor-pointer hover:bg-gray-50 mb-4">
                 <input type="file" onChange={e => e.target.files && setEvidenceFile(e.target.files[0])} />
                 <p className="text-xs text-gray-500 mt-2">Selecione foto ou documento</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button onClick={handleUploadEvidence} disabled={!evidenceFile} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Enviar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}