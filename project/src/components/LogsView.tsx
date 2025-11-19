import { Search, Trash2, X } from 'lucide-react';
import { SecurityLog, SeverityLevel, LogType } from '../types';
import { COLORS } from '../constants/theme';
import LogCard from './LogCard';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface LogsViewProps {
  logs: SecurityLog[];
  resolvedLogs: Set<string>;
  dismissedLogs: Set<string>;
  onResolveLog: (logId: number) => void;
  onDismissLog: (logId: number) => void;
  onClearAllLogs: () => void;
}

export default function LogsView({ 
  logs, 
  resolvedLogs, 
  dismissedLogs, 
  onDismissLog,
  onClearAllLogs
}: LogsViewProps) {
  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'All'>('All');
  const [filterType, setFilterType] = useState<LogType | 'All'>('All');
  const [filterSubtype, setFilterSubtype] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [enteringLogs, setEnteringLogs] = useState<Set<string>>(new Set());
  const previousLogsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);

  // Extraire tous les subtypes uniques disponibles dans les logs
  const availableSubtypes = useMemo(() => {
    const subtypes = new Set<string>();
    logs.forEach(log => {
      if (log.attackSubtype) {
        subtypes.add(log.attackSubtype);
      }
    });
    return Array.from(subtypes).sort();
  }, [logs]);

  // Fonction pour formater le subtype pour l'affichage
  const formatSubtype = (subtype: string): string => {
    return subtype
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Exclure les logs dismissés
      if (dismissedLogs.has(log.id.toString())) return false;
      
      const matchesSeverity = filterSeverity === 'All' || log.severity === filterSeverity;
      const matchesType = filterType === 'All' || log.type === filterType;
      const matchesSubtype = filterSubtype === 'All' || log.attackSubtype === filterSubtype;
      const matchesSearch =
        searchTerm === '' ||
        log.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.firewallId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.attackSubtype?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSeverity && matchesType && matchesSubtype && matchesSearch;
    });
  }, [logs, filterSeverity, filterType, filterSubtype, searchTerm, dismissedLogs]);

  // Réinitialiser le filtre subtype si le type change et que le subtype n'est plus valide
  useEffect(() => {
    if (filterSubtype !== 'All' && !availableSubtypes.includes(filterSubtype)) {
      setFilterSubtype('All');
    }
  }, [filterType, availableSubtypes, filterSubtype]);

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setFilterSeverity('All');
    setFilterType('All');
    setFilterSubtype('All');
    setSearchTerm('');
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filterSeverity !== 'All' || filterType !== 'All' || filterSubtype !== 'All' || searchTerm !== '';

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      // Trier d'abord par timestamp (du plus récent au plus ancien)
      const timestampDiff = b.timestamp.getTime() - a.timestamp.getTime();
      if (timestampDiff !== 0) return timestampDiff;
      // Si les timestamps sont identiques, trier par sévérité (High, Medium, Low)
      const severityOrder = { High: 0, Medium: 1, Low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [filteredLogs]);

  // Détecter les nouveaux logs et appliquer l'animation
  useEffect(() => {
    const currentLogIds = new Set(sortedLogs.map(log => log.id.toString()));
    const previousLogIds = previousLogsRef.current;

    // Au premier chargement, initialiser la référence sans animation
    if (isInitialMountRef.current) {
      previousLogsRef.current = currentLogIds;
      isInitialMountRef.current = false;
      return;
    }

    // Trouver les nouveaux logs (présents maintenant mais pas avant)
    const newLogIds = new Set<string>();
    currentLogIds.forEach(id => {
      if (!previousLogIds.has(id)) {
        newLogIds.add(id);
      }
    });

    if (newLogIds.size > 0) {
      // Marquer les nouveaux logs pour l'animation
      setEnteringLogs(newLogIds);

      // Retirer le marqueur après l'animation
      const timer = setTimeout(() => {
        setEnteringLogs(prev => {
          const updated = new Set(prev);
          newLogIds.forEach(id => updated.delete(id));
          return updated;
        });
      }, 500); // Durée de l'animation

      // Mettre à jour la référence
      previousLogsRef.current = currentLogIds;

      return () => clearTimeout(timer);
    } else {
      // Mettre à jour la référence même s'il n'y a pas de nouveaux logs
      previousLogsRef.current = currentLogIds;
    }
  }, [sortedLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            Journal des Événements
          </h2>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
            {sortedLogs.length} événement{sortedLogs.length > 1 ? 's' : ''} affiché{sortedLogs.length > 1 ? 's' : ''} (triés par date, du plus récent au plus ancien)
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Barre de recherche */}
        <div className="flex-1 relative w-full lg:w-auto">
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

        {/* Filtres à droite */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filtre par Sévérité */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium whitespace-nowrap" style={{ color: COLORS.text.muted }}>
              Priorité:
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'All')}
              className="px-3 py-2 rounded-lg border outline-none transition-all text-sm font-medium"
              style={{
                backgroundColor: COLORS.background.card,
                borderColor: filterSeverity !== 'All' 
                  ? COLORS.severity[filterSeverity.toLowerCase() as 'high' | 'medium' | 'low']
                  : COLORS.border,
                color: COLORS.text.primary,
              }}
            >
              <option value="All">Toutes</option>
              <option value="High">Critique</option>
              <option value="Medium">Moyenne</option>
              <option value="Low">Faible</option>
            </select>
          </div>

          {/* Filtre par Type */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium whitespace-nowrap" style={{ color: COLORS.text.muted }}>
              Type:
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as LogType | 'All');
                // Réinitialiser le subtype quand on change de type
                setFilterSubtype('All');
              }}
              className="px-3 py-2 rounded-lg border outline-none transition-all text-sm font-medium"
              style={{
                backgroundColor: COLORS.background.card,
                borderColor: filterType !== 'All' 
                  ? (filterType === 'Attack' ? COLORS.accent.frenchRed : COLORS.text.secondary)
                  : COLORS.border,
                color: COLORS.text.primary,
              }}
            >
              <option value="All">Tous</option>
              <option value="Attack">Attaque</option>
              <option value="Bug">Bug</option>
            </select>
          </div>

          {/* Filtre par Subtype */}
          {availableSubtypes.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium whitespace-nowrap" style={{ color: COLORS.text.muted }}>
                Sous-type:
              </label>
              <select
                value={filterSubtype}
                onChange={(e) => setFilterSubtype(e.target.value)}
                className="px-3 py-2 rounded-lg border outline-none transition-all text-sm font-medium"
                style={{
                  backgroundColor: COLORS.background.card,
                  borderColor: filterSubtype !== 'All' ? COLORS.accent.deepBlue : COLORS.border,
                  color: COLORS.text.primary,
                }}
              >
                <option value="All">Tous</option>
                {availableSubtypes.map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {formatSubtype(subtype)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bouton réinitialiser */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 px-2 py-2 rounded text-xs hover:opacity-80 transition-all whitespace-nowrap"
              style={{
                backgroundColor: COLORS.background.hover,
                color: COLORS.text.muted,
              }}
              title="Réinitialiser tous les filtres"
            >
              <X size={12} />
              <span>Réinitialiser</span>
            </button>
          )}

          {/* Bouton effacer */}
          <button
            onClick={onClearAllLogs}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg border outline-none transition-all text-sm font-medium hover:opacity-80 whitespace-nowrap"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.severity.high,
              color: COLORS.severity.high,
            }}
            title="Effacer tous les logs"
          >
            <Trash2 size={16} />
            <span>Effacer</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedLogs.length === 0 ? (
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
          sortedLogs.map((log) => {
            const isResolved = resolvedLogs.has(log.id.toString());
            const isEntering = enteringLogs.has(log.id.toString());
            
            return (
              <div 
                key={log.id}
                className={isEntering ? 'log-enter' : ''}
              >
                <div onClick={() => navigate(`/logs/${log.id}`)} className="cursor-pointer">
                  <LogCard
                    log={log}
                    isResolved={isResolved}
                    onDismiss={(e) => {
                      e.stopPropagation();
                      onDismissLog(log.id);
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
