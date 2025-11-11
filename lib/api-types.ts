export interface ContractSimpleDto {
    id: string;
    officialNumber: string;
    status: string;
    isDeleted: boolean;
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