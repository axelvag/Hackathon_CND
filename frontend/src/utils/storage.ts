import { SecurityLog } from '../types';

export const STORAGE_KEYS = {
  LOGS: 'cyberdefense_logs',
  RESOLVED_LOGS: 'cyberdefense_resolved_logs',
  DISMISSED_LOGS: 'cyberdefense_dismissed_logs',
  LOG_COMMENTS: 'cyberdefense_log_comments',
  LOG_CHAT_MESSAGES: 'cyberdefense_log_chat_messages',
  LAST_LOG_ID: 'cyberdefense_last_log_id',
  PHONE_NUMBER: 'cyberdefense_phone_number',
  NOTIFICATIONS_ENABLED: 'cyberdefense_notifications_enabled',
  VIEW_MODE: 'cyberdefense_view_mode',
} as const;

export type ViewMode = 'technician' | 'expert';

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
    // Les timestamps sont déjà des strings, pas besoin de conversion
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
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
      
      // Migrer les anciens timestamps Date vers string si nécessaire
      let timestamp: string;
      if (typeof log.timestamp === 'string') {
        timestamp = log.timestamp;
      } else if (log.timestamp && typeof log.timestamp === 'object') {
        // Ancien format Date, convertir en ISO string
        timestamp = new Date(log.timestamp).toISOString();
      } else {
        // Fallback: utiliser la date actuelle
        timestamp = new Date().toISOString();
      }
      
      // Gérer timestampRaw (peut être absent pour les anciens logs)
      let timestampRaw: string;
      if (log.timestampRaw && typeof log.timestampRaw === 'string') {
        timestampRaw = log.timestampRaw;
      } else {
        // Pour les anciens logs sans timestampRaw, utiliser le timestamp comme fallback
        timestampRaw = timestamp;
      }
      
      // logRaw est optionnel, il peut être absent pour les anciens logs
      // On le garde tel quel s'il existe
      
      return {
        ...log,
        id: logId,
        timestamp,
        timestampRaw,
        // logRaw est déjà dans log si présent, sinon undefined
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
 * Interface pour les messages de chat
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/**
 * Charge tous les messages de chat depuis le localStorage
 */
function loadAllChatMessages(): Record<string, any[]> {
  try {
    const messages = localStorage.getItem(STORAGE_KEYS.LOG_CHAT_MESSAGES);
    return messages ? JSON.parse(messages) : {};
  } catch (error) {
    console.error('Error loading chat messages from localStorage:', error);
    return {};
  }
}

/**
 * Charge les messages de chat d'un log spécifique
 */
export function loadLogChatMessages(logId: number): ChatMessage[] {
  const allMessages = loadAllChatMessages();
  const messages = allMessages[logId.toString()] || [];
  return messages.map((m) => ({
    ...m,
    timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
  }));
}

/**
 * Sauvegarde les messages de chat d'un log dans le localStorage
 */
export function saveLogChatMessages(logId: number, messages: ChatMessage[]): void {
  try {
    const allMessages = loadAllChatMessages();
    allMessages[logId.toString()] = messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp ? m.timestamp.toISOString() : undefined,
    }));
    localStorage.setItem(STORAGE_KEYS.LOG_CHAT_MESSAGES, JSON.stringify(allMessages));
  } catch (error) {
    console.error('Error saving log chat messages to localStorage:', error);
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
    localStorage.removeItem(STORAGE_KEYS.LOG_CHAT_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.LAST_LOG_ID);
  } catch (error) {
    console.error('Error clearing all logs:', error);
  }
}

/**
 * Charge le numéro de téléphone depuis le localStorage
 */
export function loadPhoneNumber(): string | null {
  try {
    const phoneNumber = localStorage.getItem(STORAGE_KEYS.PHONE_NUMBER);
    return phoneNumber || null;
  } catch (error) {
    console.error('Error loading phone number from localStorage:', error);
    return null;
  }
}

/**
 * Sauvegarde le numéro de téléphone dans le localStorage
 */
export function savePhoneNumber(phoneNumber: string | null): void {
  try {
    if (phoneNumber) {
      localStorage.setItem(STORAGE_KEYS.PHONE_NUMBER, phoneNumber);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PHONE_NUMBER);
    }
  } catch (error) {
    console.error('Error saving phone number to localStorage:', error);
  }
}

/**
 * Charge l'état des notifications depuis le localStorage
 */
export function loadNotificationsEnabled(): boolean {
  try {
    const enabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return enabled === 'true';
  } catch (error) {
    console.error('Error loading notifications enabled from localStorage:', error);
    return false;
  }
}

/**
 * Sauvegarde l'état des notifications dans le localStorage
 */
export function saveNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());
  } catch (error) {
    console.error('Error saving notifications enabled to localStorage:', error);
  }
}

/**
 * Charge le mode de vue depuis le localStorage
 */
export function loadViewMode(): ViewMode {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (mode === 'expert' || mode === 'technician') ? mode : 'technician';
  } catch (error) {
    console.error('Error loading view mode from localStorage:', error);
    return 'technician';
  }
}

/**
 * Sauvegarde le mode de vue dans le localStorage
 */
export function saveViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  } catch (error) {
    console.error('Error saving view mode to localStorage:', error);
  }
}

