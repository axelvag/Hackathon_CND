import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MessageSquare, Send, Bot, User, AlertTriangle, Shield, Clock, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { SecurityLog, formatLogId } from '../types';
import { useColors } from '../contexts/ThemeContext';
import { formatRelativeTime } from '../utils/timeUtils';
import { loadLogComments, addLogComment, LogComment } from '../utils/storage';
import { llmService } from '../services/llmService';

interface LogDetailProps {
  log: SecurityLog;
  allLogs: SecurityLog[];
  isResolved: boolean;
  onBack: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function LogDetail({ log, allLogs, isResolved, onBack, onResolve }: LogDetailProps) {
  const COLORS = useColors();
  const navigate = useNavigate();
  const [comments, setComments] = useState<LogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  
  // Refs pour le scroll automatique
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Couleur verte plus claire et visible pour le dark mode
  const resolvedGreen = '#10b981';
  const resolvedGreenBg = isResolved ? `${resolvedGreen}25` : 'transparent';
  const resolvedGreenBorder = isResolved ? `${resolvedGreen}60` : 'none';

  // Charger les commentaires depuis localStorage
  useEffect(() => {
    const loadedComments = loadLogComments(log.id);
    setComments(loadedComments);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cyberdefense_log_comments') {
        const loadedComments = loadLogComments(log.id);
        setComments(loadedComments);
      }
    };

    const handleCommentUpdate = () => {
      const loadedComments = loadLogComments(log.id);
      setComments(loadedComments);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logCommentUpdated', handleCommentUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logCommentUpdated', handleCommentUpdate as EventListener);
    };
  }, [log.id]);

  // Scroll automatique pour les messages du chat IA
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isLoadingChat]);

  // Scroll automatique pour les commentaires
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return COLORS.severity.high;
      case 'Medium':
        return COLORS.severity.medium;
      case 'Low':
        return COLORS.severity.low;
      default:
        return COLORS.text.muted;
    }
  };

  const similarLogs = allLogs
    .filter((l) => l.id !== log.id)
    .map((l) => {
      let score = 0;
      if (l.severity === log.severity) score += 3;
      if (l.type === log.type) score += 2;
      if (l.attackSubtype && log.attackSubtype && l.attackSubtype === log.attackSubtype) score += 5;
      return { log: l, score };
    })
    .filter((item) => item.score > 0) // Ne garder que les logs avec au moins un tag commun
    .sort((a, b) => b.score - a.score) // Trier par score décroissant
    .slice(0, 3) // Prendre les 3 meilleurs
    .map((item) => item.log) // Extraire uniquement les logs
    .filter((l, index, self) => 
      // Dédupliquer : ne garder que le premier log avec cet ID
      index === self.findIndex((log) => log.id === l.id)
    );

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = addLogComment(log.id, {
        author: 'Utilisateur',
        content: newComment,
      });
      setComments([...comments, comment]);
      setNewComment('');
      window.dispatchEvent(new CustomEvent('logCommentUpdated'));
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isLoadingChat) return;

    const userMessage = chatInput;
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    
    setChatMessages((prev) => [...prev, newUserMessage]);
    setChatInput('');
    setIsLoadingChat(true);
    setLlmError(null);

    try {
      // Construire le contexte du log
      const logContext = `Log ${log.id} - Sévérité: ${log.severity}, Type: ${log.type}${
        log.attackSubtype ? `, Attaque: ${log.attackSubtype}` : ''
      }. Explication: ${log.explanation}`;

      // Appeler l'API réelle
      const response = await llmService.answerLogQuestion(
        logContext,
        userMessage,
        chatMessages
      );

      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur LLM chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion au LLM';
      setLlmError(errorMessage);
      
      // Message d'erreur pour l'utilisateur
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: `❌ Erreur: ${errorMessage}. Vérifiez votre configuration API.`,
      };
      setChatMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const suggestions = [
    {
      title: 'Vérifier les règles du pare-feu pour bloquer cette source',
      details: 'Examinez les règles de filtrage actuelles du pare-feu pour identifier si la source IP ou le port sont déjà bloqués. Si ce n\'est pas le cas, créez une nouvelle règle de blocage spécifique. Vérifiez également les règles temporaires qui pourraient expirer et nécessiter une mise à jour permanente.',
    },
    {
      title: 'Mettre à jour les signatures de détection d\'intrusion',
      details: 'Les systèmes de détection d\'intrusion (IDS/IPS) doivent être régulièrement mis à jour avec les dernières signatures de menaces. Vérifiez la version actuelle de votre base de signatures et effectuez une mise à jour si nécessaire. Cette action permettra de détecter des attaques similaires à l\'avenir.',
    },
    {
      title: 'Analyser les logs du système pour identifier la source',
      details: 'Consultez les logs système, les logs d\'application et les logs réseau pour retracer l\'origine de l\'attaque. Recherchez des patterns similaires dans les logs historiques pour déterminer si cette attaque fait partie d\'une campagne plus large. Documentez toutes les informations pertinentes pour l\'analyse forensique.',
    },
    {
      title: 'Isoler le système affecté du réseau principal',
      details: 'En cas de compromission confirmée ou suspectée, isolez immédiatement le système affecté du reste du réseau pour empêcher la propagation de la menace. Utilisez le réseau de quarantaine si disponible, ou déconnectez physiquement le système. Assurez-vous de préserver les preuves pour l\'analyse ultérieure.',
    },
    {
      title: 'Contacter l\'équipe de sécurité pour une analyse approfondie',
      details: 'Si l\'attaque est de nature critique ou si vous avez besoin d\'une expertise supplémentaire, contactez immédiatement l\'équipe de sécurité informatique (SOC). Fournissez tous les détails pertinents : timestamp, source IP, type d\'attaque, et actions déjà entreprises. Une réponse coordonnée est essentielle pour gérer efficacement l\'incident.',
    },
  ];

  return (
    <div 
      className="flex flex-col transition-all duration-500 ease-in-out rounded-lg p-6"
      style={{
        backgroundColor: resolvedGreenBg,
        border: isResolved 
          ? `2px solid ${resolvedGreenBorder}` 
          : 'none',
        height: 'calc(100vh - 64px - 64px)', // 100vh - navigation (64px) - padding main (64px = 32px top + 32px bottom)
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{
            backgroundColor: COLORS.background.card,
            borderColor: COLORS.border,
            borderWidth: '1px',
            color: COLORS.text.primary,
          }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <div className="flex items-center space-x-2">
          {isResolved ? (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg" style={{ backgroundColor: `${resolvedGreen}30`, color: resolvedGreen }}>
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Résolu</span>
            </div>
          ) : (
            <button
              onClick={onResolve}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
              style={{
                backgroundColor: `${COLORS.success}20`,
                color: COLORS.success,
              }}
            >
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Marquer comme résolu</span>
            </button>
          )}
        </div>
      </div>

      {/* Afficher erreur LLM si présente */}
      {llmError && (
        <div
          className="rounded-lg p-4 border-l-4 flex-shrink-0 mb-6"
          style={{
            backgroundColor: `${COLORS.severity.high}10`,
            borderLeftColor: COLORS.severity.high,
          }}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} style={{ color: COLORS.severity.high }} />
            <p className="text-sm font-medium" style={{ color: COLORS.severity.high }}>
              Erreur de connexion au LLM
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: COLORS.text.secondary }}>
            {llmError}
          </p>
          <p className="text-xs mt-2" style={{ color: COLORS.text.muted }}>
            💡 Ajoutez plus de contexte à vôtre message
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Colonne gauche - Suggestions (25%) */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          {/* Suggestions de correction */}
          <div
            className="rounded-lg p-6 border flex flex-col h-full"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex-shrink-0" style={{ color: COLORS.text.primary }}>
              Suggestions de correction
            </h3>
            <ul className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {suggestions.map((suggestion, index) => {
                const isExpanded = expandedSuggestion === index;
                return (
                  <li
                    key={index}
                    className="rounded-lg overflow-hidden transition-all transition-all hover:bg-opacity-80"
                    style={{ backgroundColor: COLORS.background.hover }}
                  >
                    <button
                      onClick={() => setExpandedSuggestion(isExpanded ? null : index)}
                      className="w-full flex items-start space-x-3 p-3 text-left hover:opacity-80 transition-all"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${COLORS.accent.deepBlue}20`,
                          color: COLORS.accent.deepBlue,
                        }}
                      >
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                          {suggestion.title}
                        </p>
                      </div>
                      <div className="flex-shrink-0 mt-0.5">
                        {isExpanded ? (
                          <ChevronUp size={18} style={{ color: COLORS.text.muted }} />
                        ) : (
                          <ChevronDown size={18} style={{ color: COLORS.text.muted }} />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pl-11">
                        <div
                          className="p-3 rounded-lg border-l-2"
                          style={{
                            backgroundColor: COLORS.background.card,
                            borderLeftColor: COLORS.accent.deepBlue,
                          }}
                        >
                          <p className="text-sm leading-relaxed" style={{ color: COLORS.text.secondary }}>
                            {suggestion.details}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Colonne principale - Milieu (50%) */}
        <div className="lg:col-span-2 flex flex-col space-y-6 min-h-0">
          {/* Informations principales */}
          <div
            className="rounded-lg p-6 border transition-all duration-500"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
              borderLeftWidth: '4px',
              borderLeftColor: isResolved 
                ? resolvedGreen 
                : getSeverityColor(log.severity),
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="px-3 py-1 rounded text-sm font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${getSeverityColor(log.severity)}20`,
                    color: getSeverityColor(log.severity),
                  }}
                >
                  {log.severity}
                </div>
                <div
                  className="px-3 py-1 rounded text-sm font-medium"
                  style={{
                    backgroundColor: COLORS.background.hover,
                    color: log.type === 'Attack' ? COLORS.accent.frenchRed : COLORS.text.secondary,
                  }}
                >
                  {log.type}
                </div>
                {log.attackSubtype && (
                  <div
                    className="px-3 py-1 rounded text-sm font-medium"
                    style={{
                      backgroundColor: `${COLORS.accent.frenchRed}15`,
                      color: COLORS.accent.frenchRed,
                    }}
                  >
                    {log.attackSubtype}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2" style={{ color: COLORS.text.muted }}>
                <Clock size={14} />
                <span className="text-xs">{formatRelativeTime(log.timestamp)}</span>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
              Explication détaillée
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: COLORS.text.secondary }}>
              {log.explanation}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
              <div className="flex items-center space-x-2">
                <Shield size={16} style={{ color: COLORS.accent.deepBlue }} />
                <div>
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>Pare-feu</p>
                  <p className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                    {log.firewallId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} style={{ color: COLORS.text.muted }} />
                <div>
                  <p className="text-xs" style={{ color: COLORS.text.muted }}>ID du log</p>
                  <p className="text-sm font-medium" style={{ color: COLORS.text.primary }}>
                    {formatLogId(log.id)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat avec LLM */}
          <div
            className="rounded-lg p-6 border flex flex-col flex-1 min-h-0"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 flex-shrink-0" style={{ color: COLORS.text.primary }}>
              <Bot size={20} />
              <span>Assistant IA</span>
            </h3>
            <div className="space-y-3 mb-4 flex-1 overflow-y-auto min-h-0">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: COLORS.text.muted }}>
                  Posez une question sur ce log
                </p>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${COLORS.accent.deepBlue}20`,
                          color: COLORS.accent.deepBlue,
                        }}
                      >
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                      }`}
                      style={{
                        backgroundColor:
                          msg.role === 'user' ? COLORS.accent.deepBlue : COLORS.background.hover,
                        color: msg.role === 'user' ? '#fff' : COLORS.text.secondary,
                      }}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${COLORS.text.muted}20`,
                          color: COLORS.text.muted,
                        }}
                      >
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoadingChat && (
                <div className="flex items-center space-x-2">
                  <Bot size={16} style={{ color: COLORS.accent.deepBlue }} />
                  <span className="text-sm" style={{ color: COLORS.text.muted }}>
                    En train de réfléchir...
                  </span>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoadingChat && handleChatSubmit()}
                placeholder="Posez une question..."
                disabled={isLoadingChat}
                className="flex-1 px-4 py-2 rounded-lg border outline-none text-sm"
                style={{
                  backgroundColor: COLORS.background.hover,
                  borderColor: COLORS.border,
                  color: COLORS.text.primary,
                }}
              />
              <button
                onClick={handleChatSubmit}
                disabled={isLoadingChat}
                className="px-4 py-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: COLORS.accent.deepBlue,
                  color: '#fff',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite - Tickets similaires et Commentaires (25%) */}
        <div className="lg:col-span-1 flex flex-col space-y-6 min-h-0">
          {/* Tickets similaires */}
          <div
            className="rounded-lg p-6 border flex flex-col flex-1 min-h-0"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex-shrink-0" style={{ color: COLORS.text.primary }}>
              Tickets similaires
            </h3>
            {similarLogs.length === 0 ? (
              <p className="text-sm" style={{ color: COLORS.text.muted }}>
                Aucune suggestion trouvée pour le moment
              </p>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                {similarLogs.map((similarLog) => {
                  const formatSubtype = (subtype: string): string => {
                    return subtype
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                  };

                  const commonTags: string[] = [];
                  if (similarLog.severity === log.severity) commonTags.push('Severity');
                  if (similarLog.type === log.type) commonTags.push('Type');
                  if (similarLog.attackSubtype && log.attackSubtype && similarLog.attackSubtype === log.attackSubtype) {
                    commonTags.push('Subtype');
                  }

                  return (
                    <div
                      key={similarLog.id}
                      onClick={() => navigate(`/logs/${similarLog.id}`)}
                      className="p-3 rounded-lg cursor-pointer transition-all hover:opacity-80"
                      style={{ backgroundColor: COLORS.background.hover }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getSeverityColor(similarLog.severity) }}
                          />
                          <span className="text-xs font-medium" style={{ color: COLORS.text.primary }}>
                            {formatLogId(similarLog.id)}
                          </span>
                        </div>
                        {commonTags.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ 
                            backgroundColor: `${COLORS.accent.deepBlue}20`,
                            color: COLORS.accent.deepBlue 
                          }}>
                            {commonTags.length} tag{commonTags.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 mb-2">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${getSeverityColor(similarLog.severity)}20`,
                            color: getSeverityColor(similarLog.severity),
                          }}
                        >
                          {similarLog.severity}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: COLORS.background.card,
                            color: similarLog.type === 'Attack' ? COLORS.accent.frenchRed : COLORS.text.secondary,
                          }}
                        >
                          {similarLog.type}
                        </span>
                        {similarLog.attackSubtype && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: similarLog.type === 'Attack' 
                                ? `${COLORS.accent.frenchRed}15` 
                                : `${COLORS.accent.deepBlue}15`,
                              color: similarLog.type === 'Attack' 
                                ? COLORS.accent.frenchRed 
                                : COLORS.accent.deepBlue,
                            }}
                          >
                            {formatSubtype(similarLog.attackSubtype)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs line-clamp-2" style={{ color: COLORS.text.secondary }}>
                        {similarLog.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat avec LLM (API OVH réelle) */}
          <div
            className="rounded-lg p-6 border flex flex-col flex-1 min-h-0"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 flex-shrink-0" style={{ color: COLORS.text.primary }}>
              <MessageSquare size={20} />
              <span>Commentaires d'avancement</span>
            </h3>

            <div className="space-y-3 mb-4 flex-1 overflow-y-auto min-h-0">
              {comments.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: COLORS.text.muted }}>
                  Aucun commentaire pour le moment
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: COLORS.background.hover }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User size={14} style={{ color: COLORS.text.muted }} />
                        <span className="text-xs font-medium" style={{ color: COLORS.text.primary }}>
                          {comment.author}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Ajouter un commentaire..."
                className="flex-1 px-4 py-2 rounded-lg border outline-none text-sm"
                style={{
                  backgroundColor: COLORS.background.hover,
                  borderColor: COLORS.border,
                  color: COLORS.text.primary,
                }}
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{
                  backgroundColor: COLORS.accent.deepBlue,
                  color: '#fff',
                }}
              >
                {isLoadingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}