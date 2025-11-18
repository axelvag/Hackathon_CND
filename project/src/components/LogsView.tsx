import { Filter, Search } from 'lucide-react';
import { SecurityLog, SeverityLevel } from '../types';
import { COLORS } from '../constants/theme';
import LogCard from './LogCard';
import LogDetail from './LogDetail';
import { useState, useEffect, useMemo } from 'react';

interface LogsViewProps {
  logs: SecurityLog[];
}

export default function LogsView({ logs }: LogsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dismissedLogs, setDismissedLogs] = useState<Set<string>>(new Set());
  const [resolvedLogs, setResolvedLogs] = useState<Set<string>>(new Set());
  const [visibleLogs, setVisibleLogs] = useState<SecurityLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [enteringLogs, setEnteringLogs] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Exclure les logs dismissés
      if (dismissedLogs.has(log.id)) return false;
      
      const matchesSeverity = filterSeverity === 'All' || log.severity === filterSeverity;
      const matchesSearch =
        searchTerm === '' ||
        log.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.firewallId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.attackSubtype?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [logs, filterSeverity, searchTerm, dismissedLogs]);

  const severityOrder = { High: 0, Medium: 1, Low: 2 };
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [filteredLogs]);

  // Initialiser avec les 11 premiers logs quand les logs triés changent
  useEffect(() => {
    if (sortedLogs.length > 0) {
      const now = new Date();
      const initialLogs = sortedLogs.slice(0, 11).map((log, index) => ({
        ...log,
        timestamp: new Date(now.getTime() - (index * 1000))
      }));
      setVisibleLogs(initialLogs);
      setCurrentIndex(11); // Commencer à partir du 12ème log
      setEnteringLogs(new Set());
    } else {
      setVisibleLogs([]);
      setCurrentIndex(0);
      setEnteringLogs(new Set());
    }
  }, [sortedLogs]);

  // Affichage progressif des logs restants (à partir de l'index 11)
  useEffect(() => {
    if (currentIndex < sortedLogs.length) {
      // Délai aléatoire entre 1 et 5 secondes
      const delay = Math.random() * 4000 + 1000; // 1000ms à 5000ms
      
      const timer = setTimeout(() => {
        const newLog = sortedLogs[currentIndex];
        const now = new Date();
        
        setVisibleLogs((prev) => {
          // Le nouveau log a le timestamp le plus récent (maintenant)
          const adjustedLog = {
            ...newLog,
            timestamp: new Date(now)
          };

          // Marquer le nouveau log pour l'animation d'entrée
          setEnteringLogs((prevEntering) => new Set(prevEntering).add(adjustedLog.id));
          
          // Retirer le marqueur d'entrée après l'animation
          setTimeout(() => {
            setEnteringLogs((prevEntering) => {
              const newSet = new Set(prevEntering);
              newSet.delete(adjustedLog.id);
              return newSet;
            });
          }, 400); // Durée de l'animation

          // Les logs existants sont décalés d'une seconde vers le passé
          // pour maintenir la cohérence : log[0] = maintenant, log[1] = -1s, log[2] = -2s, etc.
          const updatedPrev = prev.map((log, idx) => ({
            ...log,
            timestamp: new Date(now.getTime() - ((idx + 1) * 1000))
          }));

          // Ajouter le nouveau log en haut de la liste
          return [adjustedLog, ...updatedPrev];
        });
        
        setCurrentIndex((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, sortedLogs]);

  const handleResolve = (logId: string) => {
    setResolvedLogs((prev) => new Set(prev).add(logId));
    if (selectedLog?.id === logId) {
      setSelectedLog({ ...selectedLog });
    }
  };

  const handleDismiss = (logId: string) => {
    setDismissedLogs((prev) => new Set(prev).add(logId));
    if (selectedLog?.id === logId) {
      setSelectedLog(null);
    }
  };

  if (selectedLog) {
    return (
      <LogDetail
        log={selectedLog}
        allLogs={logs}
        isResolved={resolvedLogs.has(selectedLog.id)}
        onBack={() => setSelectedLog(null)}
        onResolve={() => handleResolve(selectedLog.id)}
        onDismiss={() => handleDismiss(selectedLog.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            Journal des Événements
          </h2>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
            {visibleLogs.length} événements affichés sur {sortedLogs.length} trouvés (triés par priorité)
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
            style={{ color: COLORS.text.muted }}
          />
          <input
            type="text"
            placeholder="Rechercher dans les logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
              color: COLORS.text.primary,
            }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter size={18} style={{ color: COLORS.text.muted }} />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'All')}
            className="px-4 py-2.5 rounded-lg border outline-none transition-all text-sm font-medium"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
              color: COLORS.text.primary,
            }}
          >
            <option value="All">Toutes les priorités</option>
            <option value="High">Critique</option>
            <option value="Medium">Moyenne</option>
            <option value="Low">Faible</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {visibleLogs.length === 0 ? (
          <div
            className="text-center py-12 rounded-lg border"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              Aucun événement trouvé avec les filtres actuels
            </p>
          </div>
        ) : (
          visibleLogs.map((log) => {
            const isResolved = resolvedLogs.has(log.id);
            const isEntering = enteringLogs.has(log.id);
            return (
              <div
                key={log.id}
                className={isEntering ? 'log-enter' : ''}
              >
                <LogCard
                  log={log}
                  isResolved={isResolved}
                  onDismiss={(e) => {
                    e.stopPropagation();
                    handleDismiss(log.id);
                  }}
                  onClick={() => setSelectedLog(log)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
