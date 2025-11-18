import { Shield, LayoutDashboard, FileText, AlertTriangle, Settings, BarChart3 } from 'lucide-react';
import { COLORS } from '../constants/theme';
import logo from '../Ministère_des_Armées_et_des_Anciens_Combattants.webp';

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3 },
    { id: 'threats', label: 'Firewall', icon: AlertTriangle },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className="border-b"
      style={{
        backgroundColor: COLORS.background.secondary,
        borderColor: COLORS.border,
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img 
                src={logo} 
                alt="Ministère des Armées" 
                className="h-12 w-auto"
              />
              {/* Séparateur vertical */}
              <div 
                className="h-10 w-px"
                style={{ backgroundColor: COLORS.border }}
              />
              <div className="relative">
                <Shield
                  size={32}
                  style={{ color: COLORS.accent.deepBlue }}
                  strokeWidth={2}
                />
                <div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS.accent.frenchRed }}
                />
              </div>
              <div>
                <h1
                  className="text-xl font-bold tracking-tight"
                  style={{ color: COLORS.text.primary }}
                >
                  CYBER<span style={{ color: COLORS.accent.frenchRed }}>DEFENSE</span>
                </h1>
                <p
                  className="text-xs font-medium"
                  style={{ color: COLORS.text.muted }}
                >
                  Ministère des Armées
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md transition-all"
                    style={{
                      backgroundColor: isActive ? COLORS.background.hover : 'transparent',
                      color: isActive ? COLORS.text.primary : COLORS.text.secondary,
                    }}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md" style={{ backgroundColor: COLORS.background.card }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.success }} />
              <span className="text-xs font-medium" style={{ color: COLORS.text.secondary }}>
                Système Actif
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}