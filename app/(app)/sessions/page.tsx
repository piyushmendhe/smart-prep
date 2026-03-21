'use client';

import { useState } from 'react';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { Brain, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionSummary {
  id: string;
  date: string;
  topicsCovered: string[];
  struggles: string;
  nextFocus: string;
  aiResponse?: string;
  type: 'dsa' | 'system-design' | 'de' | 'general';
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored: SessionSummary[] = JSON.parse(localStorage.getItem('ai-sessions') || '[]');
      return [...stored].reverse();
    } catch {
      return [];
    }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('ai-sessions', JSON.stringify([...updated].reverse()));
  };

  const clearAll = () => {
    if (confirm('Clear all session history?')) {
      setSessions([]);
      localStorage.removeItem('ai-sessions');
    }
  };

  const typeColors: Record<string, string> = {
    dsa: 'text-accent border-accent',
    'system-design': 'text-yellow-400 border-yellow-400',
    de: 'text-purple-400 border-purple-400',
    general: 'text-muted border-neutral-600',
  };

  return (
    <PageContainer title="AI Sessions" description="Your history of AI-assisted learning sessions">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted">{sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded</p>
        {sessions.length > 0 && (
          <button onClick={clearAll} className="text-xs text-secondary hover:underline">
            Clear all
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-12 h-12 text-muted mb-4" />
            <h3 className="font-heading font-semibold text-foreground mb-2">No sessions yet</h3>
            <p className="text-muted text-sm">
              Use &quot;Paste Your Solution&quot; on the DSA page or &quot;Quiz Me&quot; on any track page to create AI sessions.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs border px-2 py-0.5 rounded capitalize ${typeColors[session.type] || typeColors.general}`}>
                        {session.type.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(session.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {session.topicsCovered.length > 0 && (
                      <p className="text-sm text-foreground mb-1">
                        <span className="text-muted">Covered: </span>
                        {session.topicsCovered.join(', ')}
                      </p>
                    )}
                    {session.struggles && (
                      <p className="text-sm mb-1">
                        <span className="text-muted">Struggled with: </span>
                        <span className="text-secondary">{session.struggles}</span>
                      </p>
                    )}
                    {session.nextFocus && (
                      <p className="text-sm">
                        <span className="text-muted">Next focus: </span>
                        <span className="text-success">{session.nextFocus}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {session.aiResponse && (
                      <button
                        onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                        className="text-muted hover:text-foreground"
                      >
                        {expandedId === session.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="text-muted hover:text-secondary transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === session.id && session.aiResponse && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-neutral-700"
                    >
                      <h4 className="text-xs text-accent font-semibold mb-2">AI Feedback</h4>
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                        {session.aiResponse}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
