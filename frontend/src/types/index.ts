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
  // Métadonnées des logs bruts
  srcIp?: string;
  dstIp?: string;
  srcPort?: number;
  dstPort?: number;
  protocol?: string;
  action?: string;
  bytes?: number;
  durationMs?: number;
  ruleId?: string;
  sessionId?: string;
  user?: string;
  status?: string;
  flags?: string;
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
