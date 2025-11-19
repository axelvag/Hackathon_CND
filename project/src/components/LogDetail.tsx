import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MessageSquare, Send, Bot, User, AlertTriangle, Shield, Clock } from 'lucide-react';
import { SecurityLog, formatLogId } from '../types';
import { COLORS } from '../constants/theme';
import { formatRelativeTime } from '../utils/timeUtils';
import { loadLogComments, addLogComment, LogComment } from '../utils/storage';

interface LogDetailProps {
  log: SecurityLog;
  allLogs: SecurityLog[];
  isResolved: boolean;
  onBack: () => void;
  onResolve: () => void;
  onDismiss: () => void;
}

export default function LogDetail({ log, allLogs, isResolved, onBack, onResolve }: LogDetailProps) {
  const navigate = useNavigate();
  const [comments, setComments] = useState<LogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Charger les commentaires depuis localStorage
  useEffect(() => {
    const loadedComments = loadLogComments(log.id);
    setComments(loadedComments);

    // Écouter les changements de localStorage (pour synchronisation entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cyberdefense_log_comments') {
        const loadedComments = loadLogComments(log.id);
        setComments(loadedComments);
      }
    };

    // Écouter les événements personnalisés pour synchronisation dans le même onglet
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

  // Trouver les logs similaires basés sur les tags communs (severity, type, attackSubtype)
  const similarLogs = allLogs
    .filter((l) => l.id !== log.id)
    .map((l) => {
      // Calculer un score de similarité basé sur les tags communs
      let score = 0;
      
      // Tag severity : 3 points si identique
      if (l.severity === log.severity) {
        score += 3;
      }
      
      // Tag type : 2 points si identique
      if (l.type === log.type) {
        score += 2;
      }
      
      // Tag attackSubtype : 5 points si identique (le plus important)
      if (l.attackSubtype && log.attackSubtype && l.attackSubtype === log.attackSubtype) {
        score += 5;
      }
      
      return { log: l, score };
    })
    .filter((item) => item.score > 0) // Ne garder que les logs avec au moins un tag commun
    .sort((a, b) => b.score - a.score) // Trier par score décroissant
    .slice(0, 5) // Prendre les 5 meilleurs
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
      // Déclencher un événement personnalisé pour synchroniser dans le même onglet
      window.dispatchEvent(new CustomEvent('logCommentUpdated'));
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages([...chatMessages, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsLoadingChat(true);

    // Simulation d'une réponse LLM (remplacer par un vrai appel API)
    setTimeout(() => {
      const response = `Basé sur l'analyse du log "${log.explanation}", je peux vous aider à comprendre cette menace. ${userMessage.toLowerCase().includes('correction') ? 'Pour corriger ce problème, je recommande de vérifier les règles du pare-feu et de mettre à jour les signatures de détection.' : 'Pouvez-vous préciser votre question ?'}`;
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsLoadingChat(false);
    }, 1000);
  };

  const suggestions = [
    'Vérifier les règles du pare-feu pour bloquer cette source',
    'Mettre à jour les signatures de détection d\'intrusion',
    'Analyser les logs du système pour identifier la source',
    'Isoler le système affecté du réseau principal',
    'Contacter l\'équipe de sécurité pour une analyse approfondie',
  ];

  // Couleur verte plus claire et visible pour le dark mode
  const resolvedGreen = '#10b981'; // Vert emerald plus clair et visible
  const resolvedGreenBg = isResolved ? `${resolvedGreen}25` : 'transparent';
  const resolvedGreenBorder = isResolved ? `${resolvedGreen}60` : 'none';

  return (
    <div 
      className="space-y-6 transition-all duration-500 ease-in-out rounded-lg p-6"
      style={{
        backgroundColor: resolvedGreenBg,
        border: isResolved 
          ? `2px solid ${resolvedGreenBorder}` 
          : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
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

          {/* Suggestions de correction */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
              Suggestions de correction
            </h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-lg"
                  style={{ backgroundColor: COLORS.background.hover }}
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
                  <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                    {suggestion}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Commentaires */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: COLORS.text.primary }}>
              <MessageSquare size={20} />
              <span>Commentaires d'avancement</span>
            </h3>
            <div className="space-y-4 mb-4">
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
                      <span className="text-xs" style={{ color: COLORS.text.muted }}>
                        {formatRelativeTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex space-x-2">
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
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Tickets similaires */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
              Tickets similaires
            </h3>
            {similarLogs.length === 0 ? (
              <p className="text-sm" style={{ color: COLORS.text.muted }}>
                Aucune suggestion trouvée pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {similarLogs.map((similarLog) => {
                  // Formater le subtype
                  const formatSubtype = (subtype: string): string => {
                    return subtype
                      .replace(/_/g, ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                  };

                  // Déterminer les tags communs
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

          {/* Chat avec LLM */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: COLORS.background.card,
              borderColor: COLORS.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2" style={{ color: COLORS.text.primary }}>
              <Bot size={20} />
              <span>Assistant IA</span>
            </h3>
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
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
            </div>
            <div className="flex space-x-2">
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
      </div>
    </div>
  );
}

