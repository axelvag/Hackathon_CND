export type SeverityLevel = 'High' | 'Medium' | 'Low';
export type LogType = 'Bug' | 'Attack';

export interface RemediationStep {
  title: string;
  description: string;
}

// Type pour les logs bruts du CSV
export interface RawCSVLog {
  timestamp: string;
  firewall_id: string;
  src_ip: string;
  dst_ip: string;
  src_port: string;
  dst_port: string;
  protocol: string;
  action: string;
  bytes: string;
  duration_ms: string;
  rule_id: string;
  session_id: string;
  user: string;
  reason: string;
  status: string;
  flags: string;
}

export interface SecurityLog {
  id: number; // Stocké comme nombre dans le storage
  timestamp: string; // Timestamp live au format ISO string - moment où le frontend reçoit la réponse du backend
  timestampRaw: string; // Timestamp original du fichier CSV des logs firewall (format ISO string)
  firewallId: string;
  severity: SeverityLevel;
  explanation: string;
  type: LogType;
  attackSubtype?: string;
  title?: string; // Titre de l'événement depuis le backend
  remediation?: RemediationStep[]; // Étapes de remédiation depuis le backend
  knownType?: boolean; // Indique si le type d'événement est connu (depuis le backend)
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
  logRaw?: RawCSVLog; // Log brut original du CSV pour affichage en mode expert
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
