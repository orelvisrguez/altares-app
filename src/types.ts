export interface Altar {
  id: string;
  name: string;
  level: number;
  effect: string;
  neighbors: string[];
  occupiedBy: string;
  protectionTimeInput: string; // e.g., "1d 03:50 H" or "2d 03:52 HORAS"
  protectionExpiresAt: string | null; // ISO Timestamp or null
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
  notes?: string;
  coordX?: number;
  coordY?: number;
}

export interface AllianceStat {
  alliance: string;
  count: number;
  color: string;
  bonuses: string[];
}

export type AltarActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'RENEW' | 'OCCUPANT_CHANGE' | 'IMPORT' | 'RESET';

export interface AltarEvent {
  id: string;
  actionType: AltarActionType;
  altarName?: string;
  altarId?: string;
  description: string;
  timestamp: string; // ISO String
}
