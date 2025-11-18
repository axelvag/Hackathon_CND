export type SeverityLevel = 'High' | 'Medium' | 'Low';
export type LogType = 'Bug' | 'Attack';

export interface SecurityLog {
  id: string;
  timestamp: Date;
  firewallId: string;
  severity: SeverityLevel;
  explanation: string;
  type: LogType;
  attackSubtype?: string;
}

export interface SeverityStats {
  high: number;
  medium: number;
  low: number;
}
