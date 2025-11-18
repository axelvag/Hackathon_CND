import { useState, useMemo } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LogsView from './components/LogsView';
import Firewall from './components/Firewall';
import Statistics from './components/Statistics';
import { generateMockLogs } from './utils/mockData';
import { COLORS } from './constants/theme';
import { SeverityStats } from './types';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const logs = useMemo(() => generateMockLogs(50), []);

  const stats: SeverityStats = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        if (log.severity === 'High') acc.high++;
        else if (log.severity === 'Medium') acc.medium++;
        else if (log.severity === 'Low') acc.low++;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [logs]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background.primary }}>
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeSection === 'dashboard' && <Dashboard stats={stats} totalLogs={logs.length} logs={logs} />}
        {activeSection === 'statistics' && <Statistics logs={logs} totalLogs={logs.length} />}
        {activeSection === 'logs' && <LogsView logs={logs} />}
        {activeSection === 'threats' && <Firewall totalLogs={logs.length} />}
        {activeSection === 'settings' && (
          <div
            className="rounded-lg p-12 border text-center"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.text.primary }}>
              Configuration Système
            </h2>
            <p className="text-sm" style={{ color: COLORS.text.secondary }}>
              Paramètres de sécurité et administration
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
