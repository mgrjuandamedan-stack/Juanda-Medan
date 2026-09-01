export interface Department {
  id: string;
  name: string;
  category: 'Furniture' | 'Accessories' | 'Commercial' | 'Special';
  target: number; // in Rupiah, no decimal
  actual: number; // in Rupiah, no decimal
  psName: string; // Product Specialist / Person in Charge
  dailyTarget: number;
  dailyActual: number;
  icon?: string;
}

export interface SMTPerformance {
  id: string;
  name: string;
  nik: string;
  photoUrl: string;
  targetFurniture: number; // in Rupiah, no decimal
  actualFurniture: number; // in Rupiah, no decimal
  targetAccessories: number; // in Rupiah, no decimal
  actualAccessories: number; // in Rupiah, no decimal
  comser: number; // Commercial service in Rupiah, no decimal
  polis: number; // Insurance policies count, integer
  notes?: string;
  phone?: string;
}

export interface ComputedDepartment extends Department {
  kekurangan: number; // Target - Actual (0 if reached or surplus)
  surplus: number;
  mtdPercent: number; // with 2 decimal places
  dailyKekurangan: number;
  dailyPercent: number;
  status: 'achieved' | 'on_track' | 'warning' | 'critical';
}

export interface ComputedSMT extends SMTPerformance {
  kekuranganFurniture: number; // Target - Actual
  kekuranganAccessories: number; // Target - Actual
  totalTarget: number;
  totalActual: number;
  mtdPercentFurniture: number;
  mtdPercentAccessories: number;
  mtdPercent: number; // overall percentage (2 decimal places)
  isFurnitureAchieved: boolean; // >= 100%
  isAccessoriesAchieved: boolean; // >= 100%
  isInsentifQualified: boolean; // TRUE only if Furniture >= 100% AND Accessories >= 100%
  insentifEstimated: number; // Estimated incentive in Rupiah
  statusReason: string;
}

export interface StoreSummary {
  storeName: string;
  branchCode: string;
  location: string;
  currentDate: string;
  monthName: string;
  year: number;
  totalTargetMTD: number;
  totalActualMTD: number;
  kekuranganMTD: number;
  mtdPercent: number;
  dailyTarget: number;
  dailyActual: number;
  dailyKekurangan: number;
  dailyPercent: number;
  targetFurnitureMTD: number;
  actualFurnitureMTD: number;
  targetAccessoriesMTD: number;
  actualAccessoriesMTD: number;
  totalComser: number;
  totalPolis: number;
  totalQualifiedSMT: number;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'milestone' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  smtId?: string;
  deptId?: string;
}

export interface GoogleSheetsConfig {
  sheetUrl: string;
  sheetId: string;
  apiKey?: string;
  autoSync: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt?: string;
  isSyncing: boolean;
  status: 'connected' | 'idle' | 'error';
  errorMessage?: string;
}
