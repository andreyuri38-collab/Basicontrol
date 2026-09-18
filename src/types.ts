export type UserRole = 'admin' | 'campo';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedFrenteIds?: string[];
  assignedWorkIds?: string[];
  createdAt?: string;
}

export type WorkStatus = 'orcamento' | 'em_andamento' | 'concluida' | 'cancelada';

export interface Work {
  id: string;
  name: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  address: string;
  totalAreaM2: number;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: WorkStatus;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type FrenteStatus = 'nao_iniciada' | 'em_andamento' | 'concluida';

export interface Frente {
  id: string;
  workId: string;
  name: string; // Ex: Torre A, Pavimento 3, Bloco 1
  areaM2: number;
  targetProductivityM2PerDay: number; // Ex: 350 m²/dia configurável
  startDate: string;
  endDate: string; // Previsão original
  status: FrenteStatus;
  createdAt: string;
}

export type EmployeeRole = 'Engenheiro' | 'Encarregado' | 'Aplicador' | 'Auxiliar' | string;
export type EmployeeStatus = 'ativo' | 'inativo';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  hireDate: string;
  status: EmployeeStatus;
  assignedFrenteIds: string[];
  accessEmail?: string;
  createdAt: string;
}

export type EquipmentCategory = 'bombeamento' | 'misturador' | 'gerador' | 'laser_nivel' | 'veiculo' | 'outro';
export type EquipmentOwnership = 'proprio' | 'locado' | 'terceirizado';
export type EquipmentStatus = 'disponivel' | 'em_uso' | 'manutencao' | 'inativo';

export interface Equipment {
  id: string;
  name: string; // Ex: Bomba de Projeção Putzmeister P13, Misturador Turbomix
  code?: string; // Código patrimonial / TAG / Placa: EQ-01
  category: EquipmentCategory; // Bombeamento, Misturador, Nível Laser, Gerador, etc.
  ownership: EquipmentOwnership; // 'proprio' | 'locado' | 'terceirizado'
  status: EquipmentStatus;
  supplierOrRentalCompany?: string; // Nome da locadora ou fornecedor terceirizado
  rentalDailyCost?: number; // Custo diário ou de locação (R$)
  costResponsibilityDefault?: 'contratado' | 'contratante'; // Responsável padrão se terceirizado
  notes?: string;
  createdAt: string;
}

export type PumpingEquipmentType = 'proprio' | 'terceirizado' | 'nenhum';
export type PumpingCostResponsibility = 'contratado' | 'contratante';

export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  workId: string;
  frenteId: string;
  activity: string; // ex: Aplicação de primer, Aplicação de autonivelante, Cura, Lixamento
  assignedEmployeeIds: string[];
  // Equipamento de Bombeamento
  pumpingEquipmentType?: PumpingEquipmentType; // 'proprio' | 'terceirizado' | 'nenhum'
  pumpingEquipmentId?: string; // ID do equipamento cadastrado (se houver)
  pumpingCostResponsibility?: PumpingCostResponsibility; // 'contratado' | 'contratante' (se terceirizado)
  pumpingSupplier?: string; // Fornecedor / Empresa terceirizada ou Operador
  pumpingCost?: number; // Custo do bombeamento se aplicável
  assignedEquipmentIds?: string[]; // Outros equipamentos escalados (laser, misturador)
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ProductivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  workId: string;
  frenteId: string;
  m2Executed: number;
  presentEmployeeIds: string[];
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  createdBy?: string;
}

export type FinancialType = 'receber' | 'pagar';
export type FinancialStatus = 'pendente' | 'recebido' | 'pago' | 'atrasado';

export interface FinancialEntry {
  id: string;
  type: FinancialType;
  workId?: string; // Vinculado a uma obra se houver
  category: 'Medição' | 'Salário' | 'Diária' | 'Fornecedor' | 'Material' | 'Outro' | string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: FinancialStatus;
  partyName?: string; // Nome do cliente ou funcionário/fornecedor
  createdAt: string;
  createdBy?: string;
}

export interface CompanySettings {
  id: string;
  defaultProductivityM2PerDay: number;
  jobRoles: string[];
  updatedAt: string;
}

// Calculated productivity stats per frente
export interface FrenteStats {
  frente: Frente;
  work?: Work;
  totalExecutedM2: number;
  remainingM2: number;
  completionPercent: number;
  daysWithWork: number;
  avgProductivityM2PerDay: number;
  estimatedCompletionDate: string | null;
  originalEndDate: string;
  isDelayed: boolean;
  isBehindRhythm: boolean; // Rhythm below target productivity
  delayDays: number;
}
