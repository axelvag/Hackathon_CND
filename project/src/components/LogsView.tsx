import { Filter, Search } from 'lucide-react';
import { SecurityLog, SeverityLevel } from '../types';
import { COLORS } from '../constants/theme';
import LogCard from './LogCard';
import { useState } from 'react';

interface LogsViewProps {
  logs: SecurityLog[];
}

export default function LogsView({ logs }: LogsViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = filterSeverity === 'All' || log.severity === filterSeverity;
    const matchesSearch =
      searchTerm === '' ||
      log.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.firewallId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.attackSubtype?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const severityOrder = { High: 0, Medium: 1, Low: 2 };
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            Journal des Événements
          </h2>
          <p className="text-sm" style={{ color: COLORS.text.secondary }}>
            {sortedLogs.length} événements trouvés (triés par priorité)
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
          sortedLogs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
