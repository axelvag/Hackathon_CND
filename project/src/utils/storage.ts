import { SecurityLog } from '../types';

export const STORAGE_KEYS = {
  LOGS: 'cyberdefense_logs',
  RESOLVED_LOGS: 'cyberdefense_resolved_logs',
  DISMISSED_LOGS: 'cyberdefense_dismissed_logs',
  LOG_COMMENTS: 'cyberdefense_log_comments',
  LAST_LOG_ID: 'cyberdefense_last_log_id',
} as const;

export interface LogComment {
  logId: number; // ID numérique du log
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface StoredLogState {
  resolvedLogs: Set<string>;
  dismissedLogs: Set<string>;
  comments: Map<string, LogComment[]>;
}

/**
 * Charge l'état des logs depuis le localStorage
 */
export function loadLogState(): StoredLogState {
  try {
    const resolved = localStorage.getItem(STORAGE_KEYS.RESOLVED_LOGS);
    const dismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED_LOGS);
    const comments = localStorage.getItem(STORAGE_KEYS.LOG_COMMENTS);

    return {
      resolvedLogs: new Set(resolved ? JSON.parse(resolved) : []),
      dismissedLogs: new Set(dismissed ? JSON.parse(dismissed) : []),
      comments: new Map(
      comments
        ? Object.entries(JSON.parse(comments)).map(([logId, comments]) => [
            logId,
            (comments as any[]).map((c) => ({
              ...c,
              logId: typeof c.logId === 'number' ? c.logId : parseInt(c.logId.toString(), 10),
              timestamp: new Date(c.timestamp),
            })),
          ])
        : []
      ),
    };
  } catch (error) {
    console.error('Error loading log state from localStorage:', error);
    return {
      resolvedLogs: new Set<string>(),
      dismissedLogs: new Set<string>(),
      comments: new Map<string, LogComment[]>(),
    };
  }
}

/**
 * Sauvegarde les logs résolus dans le localStorage
 */
export function saveResolvedLogs(resolvedLogs: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RESOLVED_LOGS, JSON.stringify(Array.from(resolvedLogs)));
  } catch (error) {
    console.error('Error saving resolved logs to localStorage:', error);
  }
}

/**
 * Sauvegarde les logs dismissés dans le localStorage
 */
export function saveDismissedLogs(dismissedLogs: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_LOGS, JSON.stringify(Array.from(dismissedLogs)));
  } catch (error) {
    console.error('Error saving dismissed logs to localStorage:', error);
  }
}

/**
 * Sauvegarde les commentaires d'un log dans le localStorage
 */
export function saveLogComments(logId: number, comments: LogComment[]): void {
  try {
    const allComments = loadAllComments();
    allComments[logId.toString()] = comments.map((c) => ({
      ...c,
      logId: c.logId, // Garder le logId comme number
      timestamp: c.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEYS.LOG_COMMENTS, JSON.stringify(allComments));
  } catch (error) {
    console.error('Error saving log comments to localStorage:', error);
  }
}

/**
 * Charge tous les commentaires depuis le localStorage
 */
function loadAllComments(): Record<string, any[]> {
  try {
    const comments = localStorage.getItem(STORAGE_KEYS.LOG_COMMENTS);
    return comments ? JSON.parse(comments) : {};
  } catch (error) {
    console.error('Error loading comments from localStorage:', error);
    return {};
  }
}

/**
 * Charge les commentaires d'un log spécifique
 */
export function loadLogComments(logId: number): LogComment[] {
  const allComments = loadAllComments();
  const comments = allComments[logId.toString()] || [];
  return comments.map((c) => ({
    ...c,
    logId: typeof c.logId === 'number' ? c.logId : parseInt(c.logId.toString(), 10),
    timestamp: new Date(c.timestamp),
  }));
}

/**
 * Ajoute un commentaire à un log
 */
export function addLogComment(logId: number, comment: Omit<LogComment, 'logId' | 'id' | 'timestamp'>): LogComment {
  const comments = loadLogComments(logId);
  const newComment: LogComment = {
    ...comment,
    logId,
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };
  const updatedComments = [...comments, newComment];
  saveLogComments(logId, updatedComments);
  return newComment;
}

/**
 * Sauvegarde les logs générés dans le localStorage pour les réutiliser
 */
export function saveGeneratedLogs(logs: SecurityLog[]): void {
  try {
    const logsToSave = logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logsToSave));
  } catch (error) {
    console.error('Error saving logs to localStorage:', error);
  }
}

/**
 * Charge les logs sauvegardés depuis le localStorage
 */
export function loadGeneratedLogs(): SecurityLog[] | null {
  try {
    const logs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!logs) return null;
    const parsedLogs = JSON.parse(logs);
    return parsedLogs.map((log: any) => {
      // Migrer les anciens IDs string vers number si nécessaire
      let logId: number;
      if (typeof log.id === 'number') {
        logId = log.id;
      } else if (typeof log.id === 'string') {
        const match = log.id.match(/LOG-(\d+)/);
        logId = match ? parseInt(match[1], 10) : 0;
      } else {
        logId = 0;
      }
      
      return {
        ...log,
        id: logId,
        timestamp: new Date(log.timestamp),
      };
    });
  } catch (error) {
    console.error('Error loading logs from localStorage:', error);
    return null;
  }
}

/**
 * Récupère le dernier ID de log utilisé et l'incrémente
 */
export function getNextLogId(): number {
  try {
    let maxId = 0;
    
    // Vérifier d'abord le dernier ID stocké dans localStorage
    const lastIdStr = localStorage.getItem(STORAGE_KEYS.LAST_LOG_ID);
    if (lastIdStr) {
      const lastId = parseInt(lastIdStr, 10);
      if (!isNaN(lastId) && lastId > 0) {
        maxId = lastId;
      }
    }
    
    // Si on a des logs existants, vérifier le plus grand ID numérique
    const existingLogs = loadGeneratedLogs();
    if (existingLogs && existingLogs.length > 0) {
      existingLogs.forEach(log => {
        // L'ID est maintenant un nombre directement
        const logId = (log as any).id; // Utiliser any pour gérer la migration
        if (typeof logId === 'number' && logId > maxId) {
          maxId = logId;
        } else if (typeof logId === 'string') {
          // Gérer la migration depuis l'ancien format string
          const logIdMatch = logId.match(/LOG-(\d+)/);
          if (logIdMatch) {
            const logIdNum = parseInt(logIdMatch[1], 10);
            if (!isNaN(logIdNum) && logIdNum > maxId) {
              maxId = logIdNum;
            }
          }
        }
      });
    }
    
    // Incrémenter et sauvegarder
    const nextId = maxId + 1;
    localStorage.setItem(STORAGE_KEYS.LAST_LOG_ID, nextId.toString());
    return nextId;
  } catch (error) {
    console.error('Error getting next log ID:', error);
    // En cas d'erreur, utiliser 1 comme fallback
    const fallbackId = 1;
    localStorage.setItem(STORAGE_KEYS.LAST_LOG_ID, fallbackId.toString());
    return fallbackId;
  }
}

/**
 * Efface tous les logs du localStorage
 */
export function clearAllLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.RESOLVED_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DISMISSED_LOGS);
    localStorage.removeItem(STORAGE_KEYS.LOG_COMMENTS);
    localStorage.removeItem(STORAGE_KEYS.LAST_LOG_ID);
  } catch (error) {
    console.error('Error clearing all logs:', error);
  }
}

