import { useState, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LogsView from './components/LogsView';
import Firewall from './components/Firewall';
import LogDetail from './components/LogDetail';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { getColors } from './constants/theme';
import { SeverityStats, SecurityLog } from './types';
import { 
  loadGeneratedLogs, 
  saveGeneratedLogs, 
  loadLogState, 
  saveResolvedLogs, 
  saveDismissedLogs,
  getNextLogId,
  clearAllLogs,
  STORAGE_KEYS,
  loadPhoneNumber,
  loadNotificationsEnabled
} from './utils/storage';
import { callService } from './services/callService';
import { ViewProvider } from './contexts/ViewContext';
import { csvService } from './services/csvService';
import { logAnalysisService } from './services/logAnalysisService';

// Configuration de la vitesse d'apparition des logs (en secondes)
const LOG_GENERATION_MIN_DELAY = 1; // Délai minimum entre chaque log (en secondes)
const LOG_GENERATION_MAX_DELAY = 2; // Délai maximum entre chaque log (en secondes)

// Initialiser l'état depuis localStorage de manière synchrone
function getInitialLogState() {
  try {
    const logState = loadLogState();
    return {
      resolvedLogs: logState.resolvedLogs,
      dismissedLogs: logState.dismissedLogs,
    };
  } catch (error) {
    console.error('Error loading initial log state:', error);
    return {
      resolvedLogs: new Set<string>(),
      dismissedLogs: new Set<string>(),
    };
  }
}

function AppContent() {
  const { theme } = useTheme();
  const COLORS = getColors(theme);
  const initialState = getInitialLogState();
  // Initialiser les logs depuis localStorage de manière synchrone
  const initialLogs = (() => {
    try {
      const savedLogs = loadGeneratedLogs();
      return savedLogs && savedLogs.length > 0 ? savedLogs : [];
    } catch (error) {
      console.error('Error loading initial logs:', error);
      return [];
    }
  })();
  
  const [logs, setLogs] = useState<SecurityLog[]>(initialLogs);
  const [resolvedLogs, setResolvedLogs] = useState<Set<string>>(initialState.resolvedLogs);
  const [dismissedLogs, setDismissedLogs] = useState<Set<string>>(initialState.dismissedLogs);
  
  // Référence pour stocker les intervalles d'appels téléphoniques par log ID
  const callIntervalsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Charger les logs depuis localStorage (pour synchronisation entre onglets)
  useEffect(() => {
    const savedLogs = loadGeneratedLogs();
    if (savedLogs && savedLogs.length > 0) {
      setLogs(savedLogs);
      // Initialiser le dernier ID en fonction des logs existants (sans l'incrémenter)
      // On ne veut pas incrémenter ici, juste s'assurer que LAST_LOG_ID est à jour
      let maxId = 0;
      savedLogs.forEach(log => {
        const logId = (log as any).id; // Utiliser any pour gérer la migration
        if (typeof logId === 'number' && logId > maxId) {
          maxId = logId;
        } else if (typeof logId === 'string') {
          // Gérer la migration depuis l'ancien format
          const logIdMatch = logId.match(/LOG-(\d+)/);
          if (logIdMatch) {
            const logIdNum = parseInt(logIdMatch[1], 10);
            if (!isNaN(logIdNum) && logIdNum > maxId) {
              maxId = logIdNum;
            }
          }
        }
      });
      // Sauvegarder le maxId trouvé (ou 0 si aucun ID numérique trouvé)
      localStorage.setItem(STORAGE_KEYS.LAST_LOG_ID, maxId.toString());
    } else {
      // Pas de logs au démarrage, ils seront générés automatiquement
      setLogs([]);
      // Initialiser le dernier ID à 0 (sans l'incrémenter)
      localStorage.setItem(STORAGE_KEYS.LAST_LOG_ID, '0');
    }

    // Charger l'état des logs (résolus/dismissés)
    const logState = loadLogState();
    setResolvedLogs(logState.resolvedLogs);
    setDismissedLogs(logState.dismissedLogs);

    // Écouter les changements de localStorage depuis d'autres onglets
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cyberdefense_resolved_logs' || e.key === 'cyberdefense_dismissed_logs' || e.key === 'cyberdefense_log_comments') {
        const logState = loadLogState();
        setResolvedLogs(logState.resolvedLogs);
        setDismissedLogs(logState.dismissedLogs);
      }
      if (e.key === 'cyberdefense_logs') {
        const savedLogs = loadGeneratedLogs();
        if (savedLogs && savedLogs.length > 0) {
          setLogs(savedLogs);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sauvegarder les logs résolus dans localStorage quand ils changent
  useEffect(() => {
    if (resolvedLogs.size > 0 || localStorage.getItem('cyberdefense_resolved_logs')) {
      saveResolvedLogs(resolvedLogs);
    }
  }, [resolvedLogs]);

  // Sauvegarder les logs dismissés dans localStorage quand ils changent
  useEffect(() => {
    if (dismissedLogs.size > 0 || localStorage.getItem('cyberdefense_dismissed_logs')) {
      saveDismissedLogs(dismissedLogs);
    }
  }, [dismissedLogs]);

  // Générer automatiquement de nouveaux logs depuis le CSV via le backend
  useEffect(() => {
    let currentTimeout: NodeJS.Timeout | null = null;
    let isActive = true;
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 5; // Arrêter après 5 erreurs consécutives

    const generateAndAddLog = async () => {
      if (!isActive) return;
      
      try {
        // Récupérer le prochain log brut du CSV
        let rawLog = await csvService.getNextLog();
        
        // Si plus de logs, réinitialiser le CSV
        if (!rawLog) {
          console.log('📄 Tous les logs du CSV ont été traités. Réinitialisation...');
          csvService.reset();
          rawLog = await csvService.getNextLog();
        }

        if (!rawLog) {
          console.warn('⚠️ Aucun log disponible dans le CSV. Arrêt de la génération.');
          return;
        }

        // Analyser le log via le backend
        const logId = getNextLogId();
        const newLog = await logAnalysisService.analyzeLog(rawLog, logId);
        
        // Si le log n'est pas à traiter (null), passer au suivant sans erreur
        if (!newLog) {
          // Réinitialiser le compteur d'erreurs car ce n'est pas une erreur
          consecutiveErrors = 0;
          // Planifier le prochain log immédiatement (avec un petit délai)
          if (isActive) {
            const minDelayMs = LOG_GENERATION_MIN_DELAY * 1000;
            const maxDelayMs = LOG_GENERATION_MAX_DELAY * 1000;
            const delay = Math.random() * (maxDelayMs - minDelayMs) + minDelayMs;
            currentTimeout = setTimeout(() => {
              generateAndAddLog();
            }, delay);
          }
          return;
        }
        
        // Réinitialiser le compteur d'erreurs en cas de succès
        consecutiveErrors = 0;

        setLogs((prevLogs) => {
          // Vérifier que le log n'existe pas déjà (par sécurité)
          const logExists = prevLogs.some(log => log.id === newLog.id);
          if (logExists) {
            return prevLogs;
          }
          // Ajouter le nouveau log au début de la liste
          const updatedLogs = [newLog, ...prevLogs];
          // Sauvegarder dans localStorage
          saveGeneratedLogs(updatedLogs);
          return updatedLogs;
        });

        // Vérifier si on doit déclencher des appels téléphoniques périodiques
        // Si le log est HIGH et que les notifications sont activées
        if (newLog.severity === 'High') {
          const notificationsEnabled = loadNotificationsEnabled();
          const phoneNumber = loadPhoneNumber();
          
          if (notificationsEnabled && phoneNumber) {
            // Déclencher le premier appel immédiatement via le backend
            callService.triggerCall(phoneNumber, newLog).catch((error) => {
              console.error('Erreur lors du déclenchement de l\'appel téléphonique:', error);
            });
            
            // Démarrer les appels périodiques toutes les 15 à 30 secondes
            const startPeriodicCalls = () => {
              const getRandomDelay = () => {
                const minDelay = 15000; // 15 secondes
                const maxDelay = 30000; // 30 secondes
                return Math.random() * (maxDelay - minDelay) + minDelay;
              };
              
              const scheduleNextCall = () => {
                const interval = setTimeout(() => {
                  // Vérifier que les notifications sont toujours activées et que le log existe toujours
                  const stillEnabled = loadNotificationsEnabled();
                  const stillPhoneNumber = loadPhoneNumber();
                  
                  if (stillEnabled && stillPhoneNumber) {
                    callService.triggerCall(stillPhoneNumber, newLog).catch((error) => {
                      console.error('Erreur lors du déclenchement de l\'appel téléphonique périodique:', error);
                    });
                    scheduleNextCall(); // Planifier le prochain appel
                  } else {
                    // Arrêter si les notifications sont désactivées
                    callIntervalsRef.current.delete(newLog.id);
                  }
                }, getRandomDelay());
              
                callIntervalsRef.current.set(newLog.id, interval);
              };
              
              scheduleNextCall();
            };
            
            startPeriodicCalls();
          }
        }

        // Planifier le prochain log avec un délai aléatoire
        if (isActive) {
          const minDelayMs = LOG_GENERATION_MIN_DELAY * 1000;
          const maxDelayMs = LOG_GENERATION_MAX_DELAY * 1000;
          const delay = Math.random() * (maxDelayMs - minDelayMs) + minDelayMs;
          currentTimeout = setTimeout(() => {
            generateAndAddLog();
          }, delay);
        }
      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ Erreur lors de l'analyse du log via le backend (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);
        
        // Si trop d'erreurs consécutives, arrêter la génération
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error('🛑 Trop d\'erreurs consécutives. Arrêt de la génération de logs.');
          console.error('💡 Vérifiez que le backend est démarré et accessible à:', logAnalysisService.getBaseUrl());
          return;
        }

        // Réessayer après un délai plus long en cas d'erreur
        if (isActive) {
          const errorDelay = 10000; // 10 secondes en cas d'erreur
          currentTimeout = setTimeout(() => {
            generateAndAddLog();
          }, errorDelay);
        }
      }
    };

    // Démarrer la génération automatique après un délai initial
    const minDelayMs = LOG_GENERATION_MIN_DELAY * 1000;
    const maxDelayMs = LOG_GENERATION_MAX_DELAY * 1000;
    const initialDelay = Math.random() * (maxDelayMs - minDelayMs) + minDelayMs;
    currentTimeout = setTimeout(() => {
      generateAndAddLog();
    }, initialDelay);

    // Nettoyer les timeouts au démontage
    return () => {
      isActive = false;
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  // Fonction pour gérer la résolution d'un log
  const handleResolveLog = (logId: number) => {
    setResolvedLogs((prev) => {
      const newSet = new Set(prev);
      newSet.add(logId.toString());
      return newSet;
    });
    // Arrêter les appels téléphoniques périodiques pour ce log
    const interval = callIntervalsRef.current.get(logId);
    if (interval) {
      clearTimeout(interval);
      callIntervalsRef.current.delete(logId);
    }
  };

  // Fonction pour gérer le dismiss d'un log
  const handleDismissLog = (logId: number) => {
    setDismissedLogs((prev) => {
      const newSet = new Set(prev);
      newSet.add(logId.toString());
      return newSet;
    });
    // Arrêter les appels téléphoniques périodiques pour ce log
    const interval = callIntervalsRef.current.get(logId);
    if (interval) {
      clearTimeout(interval);
      callIntervalsRef.current.delete(logId);
    }
  };

  // Fonction pour effacer tous les logs
  const handleClearAllLogs = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les logs ? Cette action est irréversible.')) {
      clearAllLogs();
      setLogs([]);
      setResolvedLogs(new Set());
      setDismissedLogs(new Set());
      // Réinitialiser le dernier ID
      getNextLogId();
    }
  };

  // Filtrer les logs non dismissés pour les statistiques
  const activeLogs = useMemo(() => {
    return logs.filter(log => !dismissedLogs.has(log.id.toString()));
  }, [logs, dismissedLogs]);

  const stats: SeverityStats = useMemo(() => {
    return activeLogs.reduce(
      (acc, log) => {
        if (log.severity === 'High') acc.high++;
        else if (log.severity === 'Medium') acc.medium++;
        else if (log.severity === 'Low') acc.low++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [activeLogs]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background.primary }}>
      <Navigation />

      <main className="max-w-[98%] mx-auto px-6 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                stats={stats} 
                totalLogs={activeLogs.length} 
                logs={activeLogs}
                resolvedLogs={resolvedLogs}
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/" replace />} 
          />
          <Route 
            path="/logs" 
            element={
              <LogsView 
                logs={logs}
                resolvedLogs={resolvedLogs}
                dismissedLogs={dismissedLogs}
                onResolveLog={handleResolveLog}
                onDismissLog={handleDismissLog}
                onClearAllLogs={handleClearAllLogs}
              />
            } 
          />
          <Route 
            path="/logs/:logId" 
            element={<LogDetailRoute logs={logs} resolvedLogs={resolvedLogs} onResolveLog={handleResolveLog} onDismissLog={handleDismissLog} />} 
          />
          <Route 
            path="/threats" 
            element={<Firewall totalLogs={activeLogs.length} />} 
          />
          <Route path="/statistics" element={<Statistics logs={activeLogs} totalLogs={activeLogs.length} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Composant pour gérer la route des détails de log
function LogDetailRoute({ 
  logs, 
  resolvedLogs, 
  onResolveLog, 
  onDismissLog 
}: { 
  logs: SecurityLog[]; 
  resolvedLogs: Set<string>; 
  onResolveLog: (logId: number) => void; 
  onDismissLog: (logId: number) => void;
}) {
  const { theme } = useTheme();
  const COLORS = getColors(theme);
  const { logId } = useParams<{ logId: string }>();
  
  // Essayer de trouver le log par ID (format LOG-00001 ou nombre)
  const log = useMemo(() => {
    if (!logId) return null;
    
    // Si c'est un nombre, chercher directement
    const numericId = parseInt(logId, 10);
    if (!isNaN(numericId)) {
      return logs.find(l => l.id === numericId);
    }
    
    // Si c'est au format LOG-00001, extraire le nombre
    const match = logId.match(/LOG-(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      return logs.find(l => l.id === id);
    }
    
    return null;
  }, [logId, logs]);
  
  if (!log) {
    return (
      <div className="rounded-lg p-12 border text-center" style={{ backgroundColor: COLORS.background.card, borderColor: COLORS.border }}>
        <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.text.primary }}>
          Log introuvable
        </h2>
        <p className="text-sm mb-4" style={{ color: COLORS.text.secondary }}>
          Le log demandé n'existe pas ou a été supprimé.
        </p>
        <Link to="/logs" className="text-sm underline" style={{ color: COLORS.accent.deepBlue }}>
          Retour à la liste des logs
        </Link>
      </div>
    );
  }
  
  return (
    <LogDetail
      log={log}
      allLogs={logs}
      isResolved={resolvedLogs.has(log.id.toString())}
      onBack={() => window.history.back()}
      onResolve={() => onResolveLog(log.id)}
      onDismiss={() => onDismissLog(log.id)}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <ViewProvider>
        <AppContent />
      </ViewProvider>
    </ThemeProvider>
  );
}

export default App;
