const CALL_API_ENDPOINT = import.meta.env.VITE_CALL_API_ENDPOINT || 'http://localhost:8000/call';

interface CallRequest {
  to: string;
  text: string;
}

interface CallResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Service pour déclencher un appel téléphonique via l'API backend
 */
export class CallService {
  private endpoint: string;

  constructor() {
    this.endpoint = CALL_API_ENDPOINT;

    if (!import.meta.env.VITE_CALL_API_ENDPOINT) {
      console.warn('⚠️ URL de l\'endpoint d\'appel non configurée. Utilisation de la valeur par défaut: http://localhost:8000/call');
    }
  }

  /**
   * Convertit un numéro de téléphone du format +33XXXXXXXXX vers 33XXXXXXXXX (sans le +)
   */
  private formatPhoneNumberForAPI(phoneNumber: string): string {
    // Enlever le + si présent
    if (phoneNumber.startsWith('+')) {
      return phoneNumber.substring(1);
    }
    return phoneNumber;
  }

  /**
   * Génère le texte de l'appel basé sur les informations du log
   */
  private generateCallText(log: {
    id: number;
    severity: string;
    type: string;
    explanation: string;
    firewallId: string;
    attackSubtype?: string;
  }): string {
    const logId = `LOG-${String(log.id).padStart(5, '0')}`;
    const severityText = log.severity === 'High' ? 'HAUTE' : log.severity === 'Medium' ? 'MOYENNE' : 'FAIBLE';
    const typeText = log.type === 'Attack' ? 'ATTAQUE' : 'BUG';
    
    let message = `Alerte sécurité CYBERDEFENSE. Log ${logId} détecté. `;
    message += `Sévérité ${severityText}. Type ${typeText}. `;
    message += `${log.explanation} `;
    message += `Firewall ${log.firewallId}. `;
    
    if (log.attackSubtype) {
      message += `Sous-type ${log.attackSubtype}. `;
    }
    
    message += `Action requise immédiatement.`;
    
    return message;
  }

  /**
   * Déclenche un appel téléphonique pour un log HIGH
   */
  async triggerCall(
    phoneNumber: string,
    log: {
      id: number;
      severity: string;
      type: string;
      explanation: string;
      firewallId: string;
      attackSubtype?: string;
    }
  ): Promise<CallResponse> {
    try {
      const formattedPhone = this.formatPhoneNumberForAPI(phoneNumber);
      const callText = this.generateCallText(log);

      const request: CallRequest = {
        to: formattedPhone,
        text: callText,
      };

      // Utiliser fetch natif avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        console.error('❌ Erreur lors de l\'appel téléphonique:', errorData);
        return {
          success: false,
          error: `Erreur serveur: ${response.status} - ${JSON.stringify(errorData)}`,
        };
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('✅ Appel téléphonique déclenché avec succès:', responseData);
      
      return {
        success: true,
        message: 'Appel téléphonique déclenché avec succès',
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('❌ Timeout lors de l\'appel téléphonique');
          return {
            success: false,
            error: 'Timeout: Le serveur n\'a pas répondu dans les temps. Vérifiez que le backend est démarré.',
          };
        }
        console.error('❌ Erreur lors de l\'appel téléphonique:', error.message);
        return {
          success: false,
          error: `Erreur: ${error.message}`,
        };
      }
      console.error('❌ Erreur inconnue lors de l\'appel téléphonique:', error);
      return {
        success: false,
        error: 'Erreur inconnue lors de l\'appel téléphonique',
      };
    }
  }
}

// Instance singleton
export const callService = new CallService();

