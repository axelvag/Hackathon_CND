import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_OVH_AI_ENDPOINT_URL || 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1';
const API_KEY = import.meta.env.VITE_OVH_AI_ACCESS_TOKEN;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OVHChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService {
  private apiKey: string;
  private baseUrl: string;
  private defaultTimeout: number = 600000; // Augmenté à 60 secondes

  constructor() {
    this.apiKey = API_KEY || '';
    this.baseUrl = BASE_URL;
    if (!this.apiKey) {
      console.error('⚠️ Veillez ajouter plus de contexte dans vôtre message.');
    }
  }

  /**
   * Appel API OVH AI Endpoints pour chat completion
   * CORRECTIFS:
   * 1. Timeout augmenté à 60s (au lieu de 30s)
   * 2. Ajout de retry logic
   * 3. Meilleure gestion d'erreurs
   * 4. Validation du token avant l'appel
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
      timeout?: number;
      retries?: number;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Token API OVH manquant. Configurez VITE_OVH_AI_ACCESS_TOKEN');
    }

    // Paramètres avec valeurs par défaut
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 512;
    const model = options?.model || 'gpt-oss-120b';
    const timeout = options?.timeout || this.defaultTimeout;
    const retries = options?.retries ?? 2;

    // Fonction de retry avec backoff exponentiel
    const attemptRequest = async (attempt: number): Promise<string> => {
      try {
        console.log(`🔄 Tentative ${attempt + 1}/${retries + 1} - Appel API OVH...`);
        
        const response = await axios.post<OVHChatResponse>(
          `${this.baseUrl}/chat/completions`,
          {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            // Ajout de paramètres pour éviter les timeouts
            stream: false, // Désactiver le streaming
            top_p: 0.9,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout,
            // Ajout de paramètres axios pour mieux gérer les timeouts
            validateStatus: (status) => status < 500, // Accepter les 4xx pour mieux les gérer
          }
        );

        // Vérifier le statut de la réponse
        if (response.status === 401) {
          throw new Error('Token API invalide ou expiré. Vérifiez VITE_OVH_AI_ACCESS_TOKEN');
        }

        if (response.status === 429) {
          throw new Error('Limite de taux atteinte. Réessayez dans quelques instants.');
        }

        if (response.status >= 400) {
          throw new Error(`Erreur API ${response.status}: ${JSON.stringify(response.data)}`);
        }

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Réponse vide du modèle');
        }

        console.log('✅ Réponse reçue avec succès');
        return content;

      } catch (error) {
        // Gestion spécifique des timeouts
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;

          // Timeout détecté
          if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
            console.warn(`⏱️ Timeout détecté (tentative ${attempt + 1}/${retries + 1})`);
            
            // Retry si des tentatives restent
            if (attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel: 1s, 2s, 4s
              console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return attemptRequest(attempt + 1);
            }
            
            throw new Error(`Timeout après ${retries + 1} tentatives. Le modèle OVH met trop de temps à répondre.`);
          }

          // Erreur réseau
          if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
            throw new Error('Impossible de joindre l\'API OVH. Vérifiez votre connexion internet.');
          }

          // Erreur HTTP spécifique
          if (axiosError.response) {
            const status = axiosError.response.status;
            const errorData = axiosError.response.data as any;
            
            if (status === 401) {
              throw new Error('Token API invalide ou expiré');
            }
            if (status === 429) {
              throw new Error('Limite de taux atteinte. Réessayez plus tard.');
            }
            if (status === 503) {
              throw new Error('Service OVH temporairement indisponible');
            }
            
            throw new Error(`Erreur API ${status}: ${errorData?.error?.message || axiosError.message}`);
          }

          throw new Error(`Erreur réseau: ${axiosError.message}`);
        }

        throw new Error('Erreur inconnue lors de l\'appel API');
      }
    };

    return attemptRequest(0);
  }

  /**
   * Répondre à une question sur un log spécifique
   * OPTIMISÉ: limite l'historique de conversation
   */
  async answerLogQuestion(
    logContext: string,
    userQuestion: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const systemPrompt = `Assistant cybersécurité. Réponses précises et concises en français.`;

    // Limiter l'historique pour réduire les tokens
    const limitedHistory = conversationHistory.slice(-4); // Garder seulement les 4 derniers messages

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Contexte: ${logContext}` },
      ...limitedHistory,
      { role: 'user', content: userQuestion },
    ];

    return this.chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 300,
      timeout: 45000,
      retries: 1, // Moins de retries pour le chat en temps réel
    });
  }

  /**
   * Générer des suggestions de correction
   * OPTIMISÉ: prompt minimal pour réponse rapide
   */
  async generateRemediationSteps(logData: {
    severity: string;
    type: string;
    attackSubtype?: string;
    explanation: string;
  }): Promise<string[]> {
    const prompt = `${logData.severity} - ${logData.type}${
      logData.attackSubtype ? ` - ${logData.attackSubtype}` : ''
    }: ${logData.explanation}

Liste 5 actions de remédiation:
1.
2.
3.
4.
5.`;

    try {
      const response = await this.chatCompletion(
        [{ role: 'user', content: prompt }],
        {
          temperature: 0.3,
          maxTokens: 250,
          timeout: 30000,
        }
      );

      // Parser la réponse
      return response
        .split('\n')
        .filter((line) => line.trim() && /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5);
    } catch (error) {
      console.error('Erreur génération suggestions:', error);
      // Retourner des suggestions par défaut en cas d'erreur
      return [
        'Bloquer l\'adresse IP source',
        'Analyser les logs pour identifier l\'origine',
        'Mettre à jour les règles de sécurité',
        'Vérifier l\'intégrité des systèmes',
        'Documenter l\'incident',
      ];
    }
  }

  /**
   * Tester la connexion à l'API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.chatCompletion(
        [{ role: 'user', content: 'Bonjour' }],
        {
          maxTokens: 10,
          timeout: 15000,
          retries: 0,
        }
      );
      return { success: true, message: '✅ Connexion API OVH opérationnelle' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }
}

// Export singleton
export const llmService = new LLMService();