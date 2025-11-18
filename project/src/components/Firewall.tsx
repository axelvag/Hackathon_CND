import { useState } from 'react';
import { Activity, TrendingUp, Settings, Plus, X, Shield, Wifi, Clock } from 'lucide-react';
import { COLORS } from '../constants/theme';

interface FirewallProps {
  totalLogs: number;
}

interface FirewallConfig {
  name: string;
  ipAddress: string;
  port: string;
  protocol: string;
  apiKey: string;
}

export default function Firewall({ totalLogs }: FirewallProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedFirewall, setSelectedFirewall] = useState<string | null>(null);
  const [newFirewallConfig, setNewFirewallConfig] = useState<FirewallConfig>({
    name: '',
    ipAddress: '',
    port: '443',
    protocol: 'HTTPS',
    apiKey: '',
  });

  const firewalls = [
    {
      id: 'FW-A',
      name: 'Firewall FW-A',
      status: 'online',
      ipAddress: '192.168.1.100',
      lastSeen: '2 min ago',
      threats: 145,
      throughput: '2.3 GB/s',
    },
    {
      id: 'FW-B',
      name: 'Firewall FW-B',
      status: 'online',
      ipAddress: '192.168.1.101',
      lastSeen: '1 min ago',
      threats: 89,
      throughput: '1.8 GB/s',
    },
  ];

  const openConfig = (firewallId: string | null) => {
    setSelectedFirewall(firewallId);
    if (firewallId) {
      const fw = firewalls.find((f) => f.id === firewallId);
      if (fw) {
        setNewFirewallConfig({
          name: fw.name,
          ipAddress: fw.ipAddress,
          port: '443',
          protocol: 'HTTPS',
          apiKey: '••••••••••••••••',
        });
      }
    } else {
      setNewFirewallConfig({
        name: '',
        ipAddress: '',
        port: '443',
        protocol: 'HTTPS',
        apiKey: '',
      });
    }
    setShowConfigModal(true);
  };

  const closeModal = () => {
    setShowConfigModal(false);
    setSelectedFirewall(null);
  };

  const handleSave = () => {
    // Logique de sauvegarde ici
    console.log('Saving firewall config:', newFirewallConfig);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
          Gestion des Pare-feu
        </h2>
        <p className="text-sm" style={{ color: COLORS.text.secondary }}>
          Surveillance et configuration des pare-feu actifs
        </p>
      </div>

      {/* Firewall Widgets - 3 grandes cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: FW-A */}
        <div
          className="rounded-lg p-6 border relative group hover:shadow-lg transition-all"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
            minHeight: '280px',
          }}
        >
          {/* Header avec statut */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.accent.deepBlue}20` }}
              >
                <Shield size={24} style={{ color: COLORS.accent.deepBlue }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
                  {firewalls[0].name}
                </h3>
                <p className="text-xs" style={{ color: COLORS.text.muted }}>
                  {firewalls[0].ipAddress}
                </p>
              </div>
            </div>
            <button
              onClick={() => openConfig('FW-A')}
              className="p-2 rounded-md transition-all hover:scale-110"
              style={{
                backgroundColor: COLORS.background.hover,
                color: COLORS.text.secondary,
              }}
              title="Configuration"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2 mb-4">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: COLORS.success }}
            />
            <span className="text-sm font-medium" style={{ color: COLORS.success }}>
              En ligne
            </span>
            <span className="text-xs" style={{ color: COLORS.text.muted }}>
              • Vu il y a {firewalls[0].lastSeen}
            </span>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: COLORS.background.hover }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                  Menaces détectées
                </span>
                <span className="text-lg font-bold" style={{ color: COLORS.severity.high }}>
                  {firewalls[0].threats}
                </span>
              </div>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: COLORS.background.hover }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                  Débit réseau
                </span>
                <span className="text-lg font-bold" style={{ color: COLORS.accent.deepBlue }}>
                  {firewalls[0].throughput}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: COLORS.text.muted }}>Uptime: 99.8%</span>
              <div className="flex items-center space-x-1">
                <Wifi size={12} style={{ color: COLORS.success }} />
                <span style={{ color: COLORS.success }}>Stable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: FW-B */}
        <div
          className="rounded-lg p-6 border relative group hover:shadow-lg transition-all"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
            minHeight: '280px',
          }}
        >
          {/* Header avec statut */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.accent.deepBlue}20` }}
              >
                <Shield size={24} style={{ color: COLORS.accent.deepBlue }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: COLORS.text.primary }}>
                  {firewalls[1].name}
                </h3>
                <p className="text-xs" style={{ color: COLORS.text.muted }}>
                  {firewalls[1].ipAddress}
                </p>
              </div>
            </div>
            <button
              onClick={() => openConfig('FW-B')}
              className="p-2 rounded-md transition-all hover:scale-110"
              style={{
                backgroundColor: COLORS.background.hover,
                color: COLORS.text.secondary,
              }}
              title="Configuration"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2 mb-4">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: COLORS.success }}
            />
            <span className="text-sm font-medium" style={{ color: COLORS.success }}>
              En ligne
            </span>
            <span className="text-xs" style={{ color: COLORS.text.muted }}>
              • Vu il y a {firewalls[1].lastSeen}
            </span>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: COLORS.background.hover }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                  Menaces détectées
                </span>
                <span className="text-lg font-bold" style={{ color: COLORS.severity.high }}>
                  {firewalls[1].threats}
                </span>
              </div>
            </div>
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: COLORS.background.hover }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: COLORS.text.secondary }}>
                  Débit réseau
                </span>
                <span className="text-lg font-bold" style={{ color: COLORS.accent.deepBlue }}>
                  {firewalls[1].throughput}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: COLORS.text.muted }}>Uptime: 99.5%</span>
              <div className="flex items-center space-x-1">
                <Wifi size={12} style={{ color: COLORS.success }} />
                <span style={{ color: COLORS.success }}>Stable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 3: Add Firewall */}
        <div
          className="rounded-lg p-6 border relative group hover:shadow-lg transition-all cursor-pointer"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
            borderStyle: 'dashed',
            minHeight: '280px',
          }}
          onClick={() => openConfig(null)}
        >
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{
                backgroundColor: `${COLORS.accent.deepBlue}10`,
                border: `2px dashed ${COLORS.accent.deepBlue}`,
              }}
            >
              <Plus size={40} style={{ color: COLORS.accent.deepBlue }} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-1" style={{ color: COLORS.text.primary }}>
                Ajouter un Pare-feu
              </h3>
              <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                Cliquez pour configurer un nouveau pare-feu
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats existantes */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: COLORS.background.card,
          borderColor: COLORS.border,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity size={20} style={{ color: COLORS.accent.deepBlue }} />
            <h3 className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
              Activité Système
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} style={{ color: COLORS.success }} />
            <span className="text-sm font-medium" style={{ color: COLORS.success }}>
              Opérationnel
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
              {totalLogs}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Total Événements
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.accent.deepBlue }}>
              {firewalls.length}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Pare-feu Actifs
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.success }}>
              98.7%
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Disponibilité
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: COLORS.background.hover }}>
            <p className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
              247ms
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
              Latence Moyenne
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Configuration */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={closeModal}
        >
          <div
            className="rounded-lg p-6 w-full max-w-2xl"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
              border: '1px solid',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold" style={{ color: COLORS.text.primary }}>
                  {selectedFirewall ? `Configuration ${selectedFirewall}` : 'Nouveau Pare-feu'}
                </h3>
                <p className="text-sm mt-1" style={{ color: COLORS.text.secondary }}>
                  {selectedFirewall
                    ? 'Modifier les paramètres du pare-feu'
                    : 'Configurer et connecter un nouveau pare-feu'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-md transition-all hover:scale-110"
                style={{
                  backgroundColor: COLORS.background.hover,
                  color: COLORS.text.secondary,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.text.primary }}
                >
                  Nom du Pare-feu
                </label>
                <input
                  type="text"
                  value={newFirewallConfig.name}
                  onChange={(e) =>
                    setNewFirewallConfig({ ...newFirewallConfig, name: e.target.value })
                  }
                  placeholder="ex: Firewall FW-C"
                  className="w-full px-4 py-2 rounded-md border"
                  style={{
                    backgroundColor: COLORS.background.hover,
                    borderColor: COLORS.border,
                    color: COLORS.text.primary,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.text.primary }}
                  >
                    Adresse IP
                  </label>
                  <input
                    type="text"
                    value={newFirewallConfig.ipAddress}
                    onChange={(e) =>
                      setNewFirewallConfig({ ...newFirewallConfig, ipAddress: e.target.value })
                    }
                    placeholder="192.168.1.102"
                    className="w-full px-4 py-2 rounded-md border"
                    style={{
                      backgroundColor: COLORS.background.hover,
                      borderColor: COLORS.border,
                      color: COLORS.text.primary,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.text.primary }}
                  >
                    Port
                  </label>
                  <input
                    type="text"
                    value={newFirewallConfig.port}
                    onChange={(e) =>
                      setNewFirewallConfig({ ...newFirewallConfig, port: e.target.value })
                    }
                    placeholder="443"
                    className="w-full px-4 py-2 rounded-md border"
                    style={{
                      backgroundColor: COLORS.background.hover,
                      borderColor: COLORS.border,
                      color: COLORS.text.primary,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.text.primary }}
                >
                  Protocole
                </label>
                <select
                  value={newFirewallConfig.protocol}
                  onChange={(e) =>
                    setNewFirewallConfig({ ...newFirewallConfig, protocol: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-md border"
                  style={{
                    backgroundColor: COLORS.background.hover,
                    borderColor: COLORS.border,
                    color: COLORS.text.primary,
                  }}
                >
                  <option>HTTPS</option>
                  <option>HTTP</option>
                  <option>SSH</option>
                  <option>SNMP</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.text.primary }}
                >
                  Clé API / Token d'authentification
                </label>
                <input
                  type="password"
                  value={newFirewallConfig.apiKey}
                  onChange={(e) =>
                    setNewFirewallConfig({ ...newFirewallConfig, apiKey: e.target.value })
                  }
                  placeholder="Entrez la clé API"
                  className="w-full px-4 py-2 rounded-md border"
                  style={{
                    backgroundColor: COLORS.background.hover,
                    borderColor: COLORS.border,
                    color: COLORS.text.primary,
                  }}
                />
              </div>

              {/* Info box */}
              <div
                className="p-4 rounded-md border-l-4"
                style={{
                  backgroundColor: `${COLORS.accent.deepBlue}10`,
                  borderLeftColor: COLORS.accent.deepBlue,
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: COLORS.text.secondary }}>
                  <strong style={{ color: COLORS.accent.deepBlue }}>Note:</strong> Assurez-vous que
                  le pare-feu est accessible depuis ce serveur. Les credentials seront chiffrés et
                  stockés de manière sécurisée.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-md transition-all"
                style={{
                  backgroundColor: COLORS.background.hover,
                  color: COLORS.text.secondary,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md transition-all"
                style={{
                  backgroundColor: COLORS.accent.deepBlue,
                  color: '#ffffff',
                }}
              >
                {selectedFirewall ? 'Enregistrer les modifications' : 'Ajouter le pare-feu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}