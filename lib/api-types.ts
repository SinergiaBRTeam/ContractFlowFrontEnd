export interface ContractSimpleDto {
    id: string;
    officialNumber: string;
    status: string;
    isDeleted: boolean;
    supplierName?: string;
    totalValue?: number;
    currency?: string;
    createdAt?: string;
}

export interface SupplierDto {
    id: string;
    corporateName: string;
    cnpj: string;
    active: boolean;
}

export interface OrgUnitDto {
    id: string;
    name: string;
    code?: string;
}

export interface CreateContractRequest {
    officialNumber: string;
    supplierId: string;
    orgUnitId: string;
    type: number;
    modality: number;
    termStart: string;
    termEnd: string;
    totalAmount: number;
    currency: string;
    administrativeProcess?: string;
}

export interface CreateSupplierRequest {
    corporateName: string;
    cnpj: string;
    active: boolean;
}

export interface UpdateSupplierRequest {
    corporateName: string;
    cnpj: string;
    active: boolean;
}

export interface CreateOrgUnitRequest {
    name: string;
    code?: string;
}

export interface UpdateOrgUnitRequest {
    name: string;
    code?: string;
}

export interface CreateObligationRequest {
    clauseRef: string;
    description: string;
    dueDate?: string;
    status?: string;
}

export interface UpdateObligationRequest {
    clauseRef: string;
    description: string;
    dueDate?: string;
    status: string;
}

export interface PenaltyDto {
    id: string;
    type: string;
    legalBasis?: string;
    amount?: number;
}

export interface NonComplianceDto {
    id: string;
    reason: string;
    severity: string;
    registeredAt: string; 
    penalty?: PenaltyDto;
}

export interface DeliverableDto {
    id: string;
    expectedDate: string; 
    quantity: number;
    unit: string;
    deliveredAt?: string;
}

export interface ObligationDto {
    id: string;
    clauseRef: string;
    description: string;
    dueDate?: string;
    status: string;
    deliverables: DeliverableDto[];
    nonCompliances: NonComplianceDto[];
}

export interface ContractDetailsDto {
    id: string;
    officialNumber: string;
    administrativeProcess?: string;
    type: string;
    modality: string;
    status: string;
    termStart: string; 
    termEnd: string; 
    totalAmount: number;
    currency: string;
    supplierId: string;
    supplierName: string;
    supplierCnpj: string;
    orgUnitId: string;
    orgUnitName: string;
    orgUnitCode?: string;
    obligations: ObligationDto[];
}

export interface AlertDto {
    id: string;
    message: string;
    contractId?: string;
    deliverableId?: string;
    targetDate: string;
    createdAt: string;
}

export interface PenaltyReportDto {
    penaltyId: string;
    nonComplianceId: string;
    contractId: string;
    reason: string;
    severity: string;
    registeredAt: string;
    type: string;
    legalBasis?: string;
    amount?: number;
}

export interface AttachmentDto {
    id: string;
    contractId: string;
    fileName: string;
    mimeType: string;
    storagePath: string;
}

export interface CreateDeliverableRequest {
    expectedDate: string;
    quantity: number;
    unit: string;
}

export interface MarkDeliveredRequest {
    deliveredAt: string;
}

export interface RegisterNonComplianceRequest {
    reason: string;
    severity: string;
}

export interface ApplyPenaltyRequest {
    type: string;
    legalBasis: string;
    amount: number;
}

// DTOs para Relatórios
export interface DueDeliverableReportDto {
    contractId: string;
    officialNumber: string;
    deliverableId: string;
    description: string; 
    expectedDate: string;
    daysOverdue: number;
}

export interface DashboardStatsDto {
    activeContracts: number;
    pendingActions: number;
    overdueDeliverables: number;
}

export interface CreateInspectionRequest {
    date: string;
    inspector: string;
    notes: string;
}

export interface UpdateInspectionRequest {
    date: string;
    inspector: string;
    notes: string;
}

export interface InspectionDto {
    id: string;
    date: string;
    inspector: string;
    notes: string;
}

export interface EvidenceDto {
    id: string;
    fileName: string;
    mimeType: string;
    notes?: string;
    deliverableId?: string;
    inspectionId?: string;
}

export interface DeliveriesBySupplierDto {
    supplierName: string;
    totalDeliveries: number;
    onTime: number;
    late: number;
}

export interface DeliveriesByOrgUnitDto {
    orgUnitName: string;
    totalDeliveries: number;
}