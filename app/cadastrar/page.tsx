"use client"

import Sidebar from "@/components/sidebar"
import { Upload, FileText, CheckCircle, Plus, Building2, Users, Trash2, FileSignature } from "lucide-react"
import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"
import { ContractSimpleDto, AttachmentDto, SupplierDto, OrgUnitDto, CreateContractRequest, CreateSupplierRequest, CreateOrgUnitRequest, ContractModality, ContractType } from "@/lib/api-types"

export default function CadastrarPage() {
  const [activeTab, setActiveTab] = useState<"contract" | "document" | "supplier" | "orgUnit">("contract")

  // --- Estados Gerais ---
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([])
  const [orgUnits, setOrgUnits] = useState<OrgUnitDto[]>([])
  const [contracts, setContracts] = useState<ContractSimpleDto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // --- Formulários ---
  const [contractForm, setContractForm] = useState<CreateContractRequest>({
    officialNumber: "",
    supplierId: "",
    orgUnitId: "",
    type: "Servico",
    modality: "Pregao",
    termStart: "",
    termEnd: "",
    totalAmount: 0,
    currency: "BRL",
    administrativeProcess: ""
  })
  
  const [supplierForm, setSupplierForm] = useState<CreateSupplierRequest>({
    corporateName: "", cnpj: "", active: true
  })

  const [orgUnitForm, setOrgUnitForm] = useState<CreateOrgUnitRequest>({
    name: "", code: ""
  })

  // --- Upload ---
  const [uploadedFiles, setUploadedFiles] = useState<AttachmentDto[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // --- Carregamento Inicial ---
  const fetchAllData = async () => {
    try {
      const [supRes, orgRes, conRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/suppliers`),
        fetch(`${API_BASE_URL}/api/orgunits`),
        fetch(`${API_BASE_URL}/api/contracts`)
      ])
      if (supRes.ok) setSuppliers(await supRes.json())
      if (orgRes.ok) setOrgUnits(await orgRes.json())
      if (conRes.ok) {
        const data = await conRes.json()
        setContracts(data)
        if (data.length > 0 && !selectedContractId) setSelectedContractId(data[0].id)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  useEffect(() => { fetchAllData() }, [])

  // --- Handlers Genéricos ---
  const handleInputChange = (setter: any) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setter((prev: any) => ({
      ...prev,
      [name]: name === 'totalAmount' ? Number(value) : value
    }))
  }

  // --- Submits ---
  const submitForm = async (url: string, body: any, successMsg: string, clearForm: () => void) => {
    setIsLoading(true)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error("Erro na requisição")
      
      toast.success(successMsg) // <--- LINHA ALTERADA
      clearForm()
      fetchAllData() 
    } catch (err) {
      console.error(err)
      toast.error("Ocorreu um erro ao tentar salvar.") // <--- LINHA ALTERADA
    } finally {
      setIsLoading(false)
    }
  }

  const handleContractSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload: CreateContractRequest = {
      ...contractForm,
      termStart: new Date(contractForm.termStart).toISOString(),
      termEnd: new Date(contractForm.termEnd).toISOString(),
      officialNumber: contractForm.officialNumber || null,
      administrativeProcess: contractForm.administrativeProcess || null,
      currency: contractForm.currency || null,
    }

    submitForm(`${API_BASE_URL}/api/contracts`, payload, "Contrato criado!", () => setContractForm({
      ...contractForm,
      officialNumber: "",
      administrativeProcess: "",
      termStart: "",
      termEnd: "",
    }))
  }

  const handleSupplierSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitForm(`${API_BASE_URL}/api/suppliers`, supplierForm, "Fornecedor cadastrado!", () => setSupplierForm({ corporateName: "", cnpj: "", active: true }))
  }

  const handleOrgUnitSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitForm(`${API_BASE_URL}/api/orgunits`, orgUnitForm, "Unidade cadastrada!", () => setOrgUnitForm({ name: "", code: "" }))
  }

  // --- Deletes ---
  const handleDelete = async (url: string) => {
    // Podemos usar um toast com promessa ou confirmação customizada no futuro, 
    // mas por enquanto o confirm nativo é seguro para deleção crítica.
    if (!confirm("Tem certeza que deseja excluir?")) return
    
    try {
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Item excluído com sucesso!") // <--- ADICIONADO
      fetchAllData()
    } catch (err) {
      toast.error("Erro ao excluir. O item pode estar em uso.") // <--- ADICIONADO
    }
  }

  // --- Upload Logic ---
  const handleUploadSubmit = async () => {
    if (!selectedFile || !selectedContractId) {
        toast.warning("Selecione um contrato e um arquivo.");
        return;
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("File", selectedFile)

    try {
      const res = await fetch(`${API_BASE_URL}/api/contracts/${selectedContractId}/attachments`, {
        method: "POST", 
        body: formData
      })

      if (!res.ok) throw new Error("Falha no upload")
      
      const newAtt = await res.json()
      setUploadedFiles(prev => [newAtt, ...prev])
      setSelectedFile(null)
      
      // AQUI ESTAVA O ALERT: Substituído pelo toast
      toast.success("Documento enviado com sucesso!") 
      
    } catch (err) { 
      console.error(err);
      // AQUI ESTAVA O ALERT: Substituído pelo toast
      toast.error("Erro ao enviar o documento. Tente novamente.") 
    }
    finally { setIsLoading(false) }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Central de Cadastros</h1>
          <p className="text-muted-foreground">Gerencie contratos, documentos e tabelas auxiliares</p>
        </div>

        {/* Navegação de Abas */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-1">
          {[
            { id: "contract", label: "Novo Contrato", icon: FileSignature },
            { id: "document", label: "Upload de Documentos", icon: Upload },
            { id: "supplier", label: "Fornecedores", icon: Users },
            { id: "orgUnit", label: "Unidades Org.", icon: Building2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium flex items-center gap-2 rounded-t-lg transition-colors ${
                activeTab === tab.id ? "bg-white text-primary border-x border-t border-gray-200 -mb-px" : "text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-sm p-8 border border-gray-200">
          
          {/* ABA: CONTRATO */}
          {activeTab === "contract" && (
            <form onSubmit={handleContractSubmit} className="space-y-6 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">Dados Principais</h3>
                  <input required name="officialNumber" value={contractForm.officialNumber} onChange={handleInputChange(setContractForm)} placeholder="Número Oficial" className="w-full border p-2 rounded" />
                  <input name="administrativeProcess" value={contractForm.administrativeProcess} onChange={handleInputChange(setContractForm)} placeholder="Processo Admin." className="w-full border p-2 rounded" />
                  <select required name="supplierId" value={contractForm.supplierId} onChange={handleInputChange(setContractForm)} className="w-full border p-2 rounded">
                    <option value="">Selecione Fornecedor...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.corporateName}</option>)}
                  </select>
                  <select required name="orgUnitId" value={contractForm.orgUnitId} onChange={handleInputChange(setContractForm)} className="w-full border p-2 rounded">
                    <option value="">Selecione Unidade...</option>
                    {orgUnits.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold border-b pb-2">Detalhes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <select name="type" value={contractForm.type}
                      onChange={handleInputChange(setContractForm)} className="border p-2 rounded">
                      {["Servico", "Obra", "Fornecimento", "Locacao", "Outro"].map(option => (
                        <option key={option} value={option as ContractType}>{option}</option>
                      ))}
                    </select>
                    <select name="modality" value={contractForm.modality}
                      onChange={handleInputChange(setContractForm)} className="border p-2 rounded">
                      {["Pregao", "Concorrencia", "TomadaPreco", "Convite", "Dispensa", "Inexigibilidade", "RDC", "Credenciamento"].map(option => (
                        <option key={option} value={option as ContractModality}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="date" name="termStart" value={contractForm.termStart} onChange={handleInputChange(setContractForm)} className="border p-2 rounded" />
                    <input required type="date" name="termEnd" value={contractForm.termEnd} onChange={handleInputChange(setContractForm)} className="border p-2 rounded" />
                  </div>
                  <h3 className="font-semibold border-b pb-2">Valor Total</h3>
                  <input required type="number" step="0.01" name="totalAmount" value={contractForm.totalAmount} onChange={handleInputChange(setContractForm)} placeholder="Valor Total" className="w-full border p-2 rounded" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 w-full md:w-auto">Salvar Contrato</button>
            </form>
          )}

          {/* ABA: UPLOAD */}
          {activeTab === "document" && (
            <div className="flex flex-col items-center space-y-6">
               <div className="w-full max-w-xl border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary transition-colors">
                  <Upload size={48} className="mx-auto text-primary mb-4" />
                  <p className="mb-4">{selectedFile ? selectedFile.name : "Arraste ou selecione um arquivo"}</p>
                  <label className="bg-primary text-white px-4 py-2 rounded cursor-pointer hover:bg-primary/90">
                    Selecionar <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                  </label>
               </div>
               <div className="w-full max-w-xl space-y-2">
                 <select className="w-full border p-2 rounded" value={selectedContractId} onChange={(e) => setSelectedContractId(e.target.value)}>
                    {contracts.length === 0 ? <option>Carregando contratos...</option> : contracts.map(c => <option key={c.id} value={c.id}>{c.officialNumber}</option>)}
                 </select>
                 <button onClick={handleUploadSubmit} disabled={isLoading || !selectedFile} className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 disabled:opacity-50">Enviar Documento</button>
               </div>
               <div className="w-full max-w-xl">
                  <h4 className="font-semibold mb-2">Enviados Recentemente:</h4>
                  {uploadedFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-sm p-2 border rounded mb-1">
                      <CheckCircle size={16} className="text-green-500" /> {f.fileName}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* ABA: FORNECEDORES */}
          {activeTab === "supplier" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <form onSubmit={handleSupplierSubmit} className="space-y-4 border p-4 rounded-lg h-fit">
                <h3 className="font-semibold text-lg">Novo Fornecedor</h3>
                <input required name="corporateName" value={supplierForm.corporateName} onChange={handleInputChange(setSupplierForm)} placeholder="Razão Social" className="w-full border p-2 rounded" />
                <input required name="cnpj" value={supplierForm.cnpj} onChange={handleInputChange(setSupplierForm)} placeholder="CNPJ" className="w-full border p-2 rounded" />
                <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-2 rounded">Salvar</button>
              </form>
              <div className="lg:col-span-2 space-y-2">
                <h3 className="font-semibold text-lg">Lista de Fornecedores</h3>
                {suppliers.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{s.corporateName}</p>
                      <p className="text-sm text-muted-foreground">{s.cnpj}</p>
                    </div>
                    <button onClick={() => handleDelete(`${API_BASE_URL}/api/suppliers/${s.id}`)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: UNIDADES */}
          {activeTab === "orgUnit" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <form onSubmit={handleOrgUnitSubmit} className="space-y-4 border p-4 rounded-lg h-fit">
                <h3 className="font-semibold text-lg">Nova Unidade</h3>
                <input required name="name" value={orgUnitForm.name} onChange={handleInputChange(setOrgUnitForm)} placeholder="Nome do Departamento" className="w-full border p-2 rounded" />
                <input name="code" value={orgUnitForm.code} onChange={handleInputChange(setOrgUnitForm)} placeholder="Código (Opcional)" className="w-full border p-2 rounded" />
                <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-2 rounded">Salvar</button>
              </form>
              <div className="lg:col-span-2 space-y-2">
                <h3 className="font-semibold text-lg">Lista de Unidades</h3>
                {orgUnits.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.code || "Sem código"}</p>
                    </div>
                    <button onClick={() => handleDelete(`${API_BASE_URL}/api/orgunits/${u.id}`)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}