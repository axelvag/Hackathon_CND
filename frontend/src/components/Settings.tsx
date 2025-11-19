import { useState, useEffect } from 'react';
import { Phone, Bell, BellOff, Save, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../constants/theme';
import { loadPhoneNumber, savePhoneNumber, loadNotificationsEnabled, saveNotificationsEnabled } from '../utils/storage';

/**
 * Parse un numéro de téléphone français et le convertit au format international +33
 * Accepte les formats : 07 39 85 47 85, 0739854785, +33 7 39 85 47 85, etc.
 */
function parseFrenchPhoneNumber(input: string): string | null {
  // Supprimer tous les espaces, tirets, points, parenthèses
  const cleaned = input.replace(/[\s\-\.\(\)]/g, '');
  
  // Si le numéro commence par +33, on le garde tel quel après nettoyage
  if (cleaned.startsWith('+33')) {
    const number = cleaned.substring(3); // Enlever +33
    if (number.length === 9 && /^[1-9]\d{8}$/.test(number)) {
      return `+33${number}`;
    }
    return null;
  }
  
  // Si le numéro commence par 33 (sans +)
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    const number = cleaned.substring(2); // Enlever 33
    if (number.length === 9 && /^[1-9]\d{8}$/.test(number)) {
      return `+33${number}`;
    }
    return null;
  }
  
  // Si le numéro commence par 0 (format français classique)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    const number = cleaned.substring(1); // Enlever le 0
    if (number.length === 9 && /^[1-9]\d{8}$/.test(number)) {
      return `+33${number}`;
    }
    return null;
  }
  
  // Si le numéro fait 9 chiffres et commence par 1-9 (sans indicatif)
  if (cleaned.length === 9 && /^[1-9]\d{8}$/.test(cleaned)) {
    return `+33${cleaned}`;
  }
  
  return null;
}

/**
 * Formate un numéro de téléphone pour l'affichage (format français)
 */
function formatPhoneNumberForDisplay(phoneNumber: string): string {
  // Enlever le +33
  if (phoneNumber.startsWith('+33')) {
    const number = phoneNumber.substring(3);
    // Formater comme 07 39 85 47 85
    if (number.length === 9) {
      return `0${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`;
    }
  }
  return phoneNumber;
}

export default function Settings() {
  const { theme } = useTheme();
  const COLORS = getColors(theme);
  
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Charger les valeurs depuis localStorage au montage
  useEffect(() => {
    const savedPhone = loadPhoneNumber();
    const savedNotifications = loadNotificationsEnabled();
    
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      setPhoneInput(formatPhoneNumberForDisplay(savedPhone));
    }
    
    setNotificationsEnabled(savedNotifications);
  }, []);

  // Parser le numéro de téléphone en temps réel
  useEffect(() => {
    if (!phoneInput.trim()) {
      setPhoneNumber(null);
      setPhoneError(null);
      return;
    }

    const parsed = parseFrenchPhoneNumber(phoneInput);
    if (parsed) {
      setPhoneNumber(parsed);
      setPhoneError(null);
    } else {
      setPhoneNumber(null);
      if (phoneInput.trim().length > 0) {
        setPhoneError('Format invalide. Utilisez le format français (ex: 07 39 85 47 85)');
      } else {
        setPhoneError(null);
      }
    }
  }, [phoneInput]);

  const handleSave = () => {
    if (phoneNumber) {
      savePhoneNumber(phoneNumber);
    } else {
      // Si pas de numéro valide, supprimer celui enregistré
      savePhoneNumber(null);
    }
    saveNotificationsEnabled(notificationsEnabled);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: COLORS.background.card,
          borderColor: COLORS.border,
        }}
      >
        <h2
          className="text-2xl font-bold mb-6"
          style={{ color: COLORS.text.primary }}
        >
          Paramètres
        </h2>

        {/* Section Numéro de téléphone */}
        <div className="mb-8">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.text.primary }}
          >
            Numéro de téléphone
          </label>
          <p
            className="text-xs mb-4"
            style={{ color: COLORS.text.muted }}
          >
            Recevez un appel automatique lorsqu'un log de niveau HIGH est détecté
          </p>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Phone size={18} style={{ color: COLORS.text.muted }} />
            </div>
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="07 39 85 47 85"
              className="w-full pl-10 pr-4 py-3 rounded-md border transition-all"
              style={{
                backgroundColor: COLORS.background.primary,
                borderColor: phoneError ? COLORS.severity.high : COLORS.border,
                color: COLORS.text.primary,
              }}
            />
          </div>
          
          {phoneError && (
            <div className="mt-2 flex items-center space-x-2">
              <AlertCircle size={16} style={{ color: COLORS.severity.high }} />
              <span className="text-sm" style={{ color: COLORS.severity.high }}>
                {phoneError}
              </span>
            </div>
          )}
          
          {phoneNumber && !phoneError && (
            <div className="mt-2">
              <p className="text-xs" style={{ color: COLORS.text.muted }}>
                Format international : <span className="font-mono font-medium" style={{ color: COLORS.text.secondary }}>{phoneNumber}</span>
              </p>
            </div>
          )}
        </div>

        {/* Section Notifications */}
        <div className="mb-8">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.text.primary }}
          >
            Notifications
          </label>
          <p
            className="text-xs mb-4"
            style={{ color: COLORS.text.muted }}
          >
            Activer ou désactiver les notifications téléphoniques pour les logs HIGH
          </p>
          
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="flex items-center space-x-3 px-4 py-3 rounded-md border transition-all hover:opacity-80"
            style={{
              backgroundColor: notificationsEnabled ? COLORS.background.hover : COLORS.background.primary,
              borderColor: COLORS.border,
            }}
          >
            {notificationsEnabled ? (
              <Bell size={20} style={{ color: COLORS.accent.deepBlue }} />
            ) : (
              <BellOff size={20} style={{ color: COLORS.text.muted }} />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.text.primary }}
            >
              {notificationsEnabled ? 'Notifications activées' : 'Notifications désactivées'}
            </span>
          </button>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: COLORS.border }}>
          <div>
            {saveSuccess && (
              <p className="text-sm" style={{ color: COLORS.success }}>
                Paramètres sauvegardés avec succès
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={phoneInput.trim() && !phoneNumber}
            className="flex items-center space-x-2 px-6 py-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: phoneInput.trim() && !phoneNumber ? COLORS.background.hover : COLORS.accent.deepBlue,
              color: '#FFFFFF',
            }}
          >
            <Save size={18} />
            <span className="font-medium">Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

