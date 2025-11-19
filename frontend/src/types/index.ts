export type SeverityLevel = 'High' | 'Medium' | 'Low';
export type LogType = 'Bug' | 'Attack';

export interface SecurityLog {
  id: number; // Stocké comme nombre dans le storage
  timestamp: Date;
  firewallId: string;
  severity: SeverityLevel;
  explanation: string;
  type: LogType;
  attackSubtype?: string;
}

/**
 * Formate un ID numérique en format d'affichage LOG-0000x
 */
export function formatLogId(id: number): string {
  return `LOG-${String(id).padStart(5, '0')}`;
}

export interface SeverityStats {
  high: number;
  medium: number;
  low: number;
}
