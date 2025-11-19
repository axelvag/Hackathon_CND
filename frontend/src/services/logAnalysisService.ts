/**
 * Service pour appeler l'API backend d'analyse de logs
 */

import axios, { AxiosError } from 'axios';
import { RawCSVLog, SecurityLog } from '../types';

// Types correspondant aux schémas du backend
export interface LogLine {
  timestamp: string;
  firewall_id: string;
  src_ip: string;
  dst_ip: string;
  protocol: string;
  action: string;
  bytes: number;
  duration_ms: number;
  src_port?: number | string;
  dst_port?: number | string;
  reason?: string;
  status?: string;
  flags?: string;
  rule_id?: string;
  session_id?: string;
}

export interface RemediationStep {
  title: string;
  description: string;
}

export interface EventInfo {
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High';
  type: 'Bug' | 'Attack';
  precise_type: string;
  firewall_id: string;
  title: string;
  explanation: string;
  remediation: RemediationStep[];
  known_type: boolean;
}

export interface LogAnalysisResponse {
  results: EventInfo[];
}

export class LogAnalysisService {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 secondes

  constructor() {
    // Utiliser l'URL du backend depuis les variables d'environnement ou par défaut
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    if (!this.baseUrl) {
      console.warn('⚠️ URL backend non configurée. Utilisation de http://localhost:8000');
    }
  }

  /**
   * Retourne l'URL du backend (pour les messages d'erreur)
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Convertit un RawCSVLog en LogLine pour l'API backend
   */
  private csvLogToLogLine(csvLog: RawCSVLog): LogLine {
    // Convertir les ports en nombre si possible, sinon garder comme string
    const parsePort = (port: string): number | string => {
      const parsed = parseInt(port, 10);
      return isNaN(parsed) ? port : parsed;
    };

    return {
      timestamp: csvLog.timestamp, // Utiliser le timestamp du CSV (format ISO)
      firewall_id: csvLog.firewall_id,
      src_ip: csvLog.src_ip,
      dst_ip: csvLog.dst_ip,
      protocol: csvLog.protocol,
      action: csvLog.action,
      bytes: parseInt(csvLog.bytes, 10) || 0,
      duration_ms: parseInt(csvLog.duration_ms, 10) || 0,
      src_port: csvLog.src_port ? parsePort(csvLog.src_port) : undefined,
      dst_port: csvLog.dst_port ? parsePort(csvLog.dst_port) : undefined,
      reason: csvLog.reason || undefined,
      status: csvLog.status || undefined,
      flags: csvLog.flags || undefined,
      rule_id: csvLog.rule_id || undefined,
      session_id: csvLog.session_id || undefined,
    };
  }

  /**
   * Convertit un EventInfo (réponse backend) en SecurityLog (format frontend)
   */
  private eventInfoToSecurityLog(eventInfo: EventInfo, logId: number, rawLog: RawCSVLog): SecurityLog {
    return {
      id: logId,
      timestamp: new Date().toISOString(), // Timestamp live : moment où le frontend reçoit la réponse
      timestampRaw: rawLog.timestamp, // Timestamp original du CSV
      firewallId: eventInfo.firewall_id,
      severity: eventInfo.severity,
      explanation: eventInfo.explanation,
      type: eventInfo.type,
      attackSubtype: eventInfo.precise_type,
      title: eventInfo.title, // Titre de l'événement depuis le backend
      remediation: eventInfo.remediation || [], // Étapes de remédiation depuis le backend
      knownType: eventInfo.known_type, // Indique si le type d'événement est connu
      // Métadonnées des logs bruts
      srcIp: rawLog.src_ip,
      dstIp: rawLog.dst_ip,
      srcPort: rawLog.src_port ? parseInt(rawLog.src_port, 10) : undefined,
      dstPort: rawLog.dst_port ? parseInt(rawLog.dst_port, 10) : undefined,
      protocol: rawLog.protocol,
      action: rawLog.action,
      bytes: parseInt(rawLog.bytes, 10) || undefined,
      durationMs: parseInt(rawLog.duration_ms, 10) || undefined,
      ruleId: rawLog.rule_id || undefined,
      sessionId: rawLog.session_id || undefined,
      user: rawLog.user || undefined,
      status: rawLog.status || undefined,
      flags: rawLog.flags || undefined,
      logRaw: rawLog, // Stocker le log brut pour affichage en mode expert
    };
  }

  /**
   * Analyse un log brut via l'API backend
   * Retourne null si le log n'est pas à traiter (pas de résultat du backend)
   * Retourne SecurityLog si le log a été analysé avec succès
   * Lance une exception en cas d'erreur réseau ou serveur
   */
  async analyzeLog(csvLog: RawCSVLog, logId: number): Promise<SecurityLog | null> {
    try {
      const logLine = this.csvLogToLogLine(csvLog);

      console.log(`🔄 Envoi du log ${logId} au backend pour analyse...`);

      const response = await axios.post<LogAnalysisResponse>(
        `${this.baseUrl}/analyze-logs`,
        {
          log_lines: [logLine],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.defaultTimeout,
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status >= 400) {
        throw new Error(`Erreur API ${response.status}: ${JSON.stringify(response.data)}`);
      }

      // Si aucun résultat, le log n'est pas à traiter (cas nominal)
      if (!response.data.results || response.data.results.length === 0) {
        console.log(`ℹ️ Log ${logId} ignoré: aucun résultat retourné par le backend (log non traitable)`);
        return null;
      }

      const eventInfo = response.data.results[0];
      const securityLog = this.eventInfoToSecurityLog(eventInfo, logId, csvLog);

      console.log(`✅ Log ${logId} analysé avec succès: ${eventInfo.type} - ${eventInfo.severity}`);
      
      return securityLog;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          throw new Error('Timeout lors de l\'analyse du log. Le backend met trop de temps à répondre.');
        }

        if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
          throw new Error('Impossible de joindre le backend. Vérifiez que le serveur est démarré et que VITE_BACKEND_URL est correctement configuré.');
        }

        if (axiosError.response) {
          const status = axiosError.response.status;
          const errorData = axiosError.response.data as any;

          if (status === 500) {
            throw new Error(`Erreur serveur: ${errorData?.detail || axiosError.message}`);
          }
          throw new Error(`Erreur API ${status}: ${errorData?.detail || axiosError.message}`);
        }

        throw new Error(`Erreur réseau: ${axiosError.message}`);
      }

      throw new Error(`Erreur inconnue lors de l'analyse du log: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie si le backend est accessible
   */
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });

      if (response.status === 200) {
        return { success: true, message: '✅ Backend accessible' };
      }

      return { success: false, message: `Backend répond avec le statut ${response.status}` };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return {
            success: false,
            message: `❌ Backend inaccessible à ${this.baseUrl}. Vérifiez que le serveur est démarré.`,
          };
        }
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }
}

// Export singleton
export const logAnalysisService = new LogAnalysisService();

