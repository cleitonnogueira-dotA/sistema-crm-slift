export enum JobType {
  MRI = 'Ressonância Magnética',
  CT = 'Tomografia',
  OTHER = 'Outro'
}

export enum StaffRole {
  DRIVER = 'Motorista',
  HELPER = 'Ajudante'
}

export enum TripStatus {
  OPEN = 'Em Aberto',
  IN_PROGRESS = 'Em Andamento',
  FINISHED = 'Finalizado'
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
  phone?: string;
  vehicleType?: string; // Carro, Van, Moto
  plate?: string;
  kmRate?: number; // Valor do Km acordado com o motorista
}

export interface Trip {
  id: string;
  date: string;
  clientName: string;
  origin: string;
  destination: string;
  distanceKm: number;
  jobType: JobType;
  status: TripStatus;
  
  driverIds: string[]; // Supports multiple drivers
  driverId?: string; // Deprecated, kept for backward compatibility
  helperIds: string[];
  
  isWeekend: boolean;
  baseValue: number; // Valor do exame (MRI/CT)
  driverKmCost: number; // Custo TOTAL dos motoristas (Soma dos fretes)
  totalCost: number; // Soma de tudo
  notes?: string;
}

export interface Payment {
  id: string;
  staffId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Settings {
  mriRate: number; 
  ctRate: number;  
  helperBonusMRI: number; 
  helperBonusCT: number;
  fuelCostPerKm: number;
  logo?: string; // Base64 string for the logo
}

export type ViewState = 'dashboard' | 'trips' | 'staff' | 'freights' | 'bonuses' | 'settings';