'use client';

import { useState } from 'react';
import { useProgress, SystemDesignItem } from '@/hooks/useProgress';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { Check, X, Brain, HelpCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callClaude } from '@/lib/claude';

const SYSTEMS = [
  { id: 'url-shortener', name: 'URL Shortener', concept: 'Hashing, DB Indexing', week: 1 },
  { id: 'twitter-feed', name: 'Twitter Feed', concept: 'Feeds, Rankings, Caching', week: 1 },
  { id: 'youtube', name: 'YouTube', concept: 'Video Processing, Streaming', week: 2 },
  { id: 'whatsapp', name: 'WhatsApp', concept: 'Real-time Messaging, Queues', week: 2 },
  { id: 'uber', name: 'Uber', concept: 'Geolocation, Matching', week: 3 },
  { id: 'rate-limiter', name: 'Rate Limiter', concept: 'Algorithms, Queueing', week: 3 },
  { id: 'key-value-store', name: 'Key-Value Store', concept: 'Distributed Storage', week: 4 },
  { id: 'search-autocomplete', name: 'Search Autocomplete', concept: 'Trie, Caching', week: 4 },
  { id: 'notification-system', name: 'Notification System', concept: 'Pub-Sub, Queues', week: 5 },
  { id: 'google-drive', name: 'Google Drive', concept: 'File Storage, Sync', week: 5 },
];

interface Modal {
  systemId: string | null;
}

interface QuizQuestion {
  type: 'mcq' | 'short' | 'architecture';
  question: string;
  options?: string[];
  correctAnswer?: string;
}

interface HintPanelState {
  systemId: string;
  systemName: string;
  tab: 'explain' | 'hint' | 'approach';
  content: string;
  loading: boolean;
  error: string;
}

export default function SystemDesign() {
  const { data, isLoaded, updateSystemStatus, updateSystemReshaded } = useProgress();
  const [modal, setModal] = useState<Modal>({ systemId: null });

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizSystem, setQuizSystem] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<number, { text: string; score: number }>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [checkingAnswer, setCheckingAnswer] = useState(false);

  // Hint panel state
  const [hintPanel, setHintPanel] = useState<HintPanelState | null>(null);

  if (!isLoaded) return null;

  const initializeSystem = (systemId: string): SystemDesignItem => {
    if (data.systemDesign.systems[systemId]) {
      return data.systemDesign.systems[systemId];
    }
    const systemData = SYSTEMS.find(s => s.id === systemId);
    return {
      id: systemId,
      name: systemData?.name || '',
      concept: systemData?.concept || '',
      week: systemData?.week || 1,
      status: 'Not Started',
      reshaded: {
        requirements: false,
        estimation: false,
        storage: false,
        highLevel: false,
        apis: false,
        deepDive: false,
        edgeCases: false,
        discussion: false,
      },
      notes: '',
    };
  };

  const getSystem = (systemId: string): SystemDesignItem => {
    return data.systemDesign.systems[systemId] || initializeSystem(systemId);
  };

  const statusCount = {
    'Not Started': SYSTEMS.filter(s => getSystem(s.id).status === 'Not Started').length,
    'In Progress': SYSTEMS.filter(s => getSystem(s.id).status === 'In Progress').length,
    'Done': SYSTEMS.filter(s => getSystem(s.id).status === 'Done').length,
  };

  const reshaded = ['Requirements', 'Estimation', 'Storage', 'High Level Design', 'APIs', 'Deep Dive', 'Edge Cases', 'Discussion'] as const;

  const startQuiz = async (systemName: string) => {
    setQuizOpen(true);
    setQuizSystem(systemName);
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizFeedback({});
    setQuizDone(false);
    setQuizError('');

    const prompt = `Generate a system design quiz about "${systemName}". Return EXACTLY this JSON (no markdown):
{
  "questions": [
    {"type":"mcq","question":"...","options":["A","B","C","D"],"correctAnswer":"A"},
    {"type":"mcq","question":"...","options":["A","B","C","D"],"correctAnswer":"B"},
    {"type":"short","question":"..."},
    {"type":"short","question":"..."},
    {"type":"architecture","question":"Design a specific component of ${systemName}..."}
  ]
}`;

    try {
      const raw = await callClaude(prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      const parsed = JSON.parse(jsonMatch[0]);
      setQuizQuestions(parsed.questions || []);
    } catch (e: unknown) {
      setQuizError(e instanceof Error ? e.message : 'Failed to generate quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const checkShortAnswer = async (questionIndex: number) => {
    const q = quizQuestions[questionIndex];
    const answer = quizAnswers[questionIndex] || '';
    if (!answer.trim()) return;
    setCheckingAnswer(true);
    try {
      const prompt = `System design quiz about "${quizSystem}": "${q.question}"
Student answer: "${answer}"
Evaluate and respond with JSON: {"score": 0-10, "feedback": "brief feedback"}`;
      const raw = await callClaude(prompt, false);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setQuizFeedback(prev => ({ ...prev, [questionIndex]: result }));
      }
    } catch {}
    setCheckingAnswer(false);
  };

  const openHintPanel = async (system: { id: string; name: string; concept: string }, tab: 'explain' | 'hint' | 'approach') => {
    const cacheKey = `sd-hint-${system.id}-${tab}`;
    const cached = localStorage.getItem(cacheKey);

    setHintPanel({ systemId: system.id, systemName: system.name, tab, content: cached || '', loading: !cached, error: '' });

    if (!cached) {
      const prompts: Record<string, string> = {
        explain: `Explain the "${system.name}" system design to a beginner using a real-world analogy. Focus on "${system.concept}". Under 200 words, no jargon.`,
        hint: `Give me a key design insight for "${system.name}" — the most important thing architects get wrong. Under 100 words.`,
        approach: `Give a step-by-step RESHADED framework walkthrough for designing "${system.name}". Cover: Requirements, Estimation, Storage, High Level, APIs, Deep Dive, Edge Cases, Discussion. Under 300 words.`,
      };
      try {
        const result = await callClaude(prompts[tab]);
        localStorage.setItem(cacheKey, result);
        setHintPanel(prev => prev ? { ...prev, content: result, loading: false } : null);
      } catch (e: unknown) {
        setHintPanel(prev => prev ? { ...prev, error: e instanceof Error ? e.message : 'Error', loading: false } : null);
      }
    }
  };

  const getQuizScore = () => {
    let total = 0;
    quizQuestions.forEach((q, i) => {
      if (q.type === 'mcq') {
        if (quizAnswers[i] === q.correctAnswer) total += 10;
      } else {
        total += quizFeedback[i]?.score || 0;
      }
    });
    return total;
  };

  return (
    <PageContainer title="System Design" description="Master 10 critical system design patterns">
      {/* Top bar with Quiz Me */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <button
          onClick={() => startQuiz('System Design (Mixed)')}
          className="flex items-center gap-2 px-4 py-2 bg-accent/20 hover:opacity-30 text-accent border border-accent rounded-lg text-sm font-medium transition-all"
        >
          <Brain className="w-4 h-4" />
          Quiz Me
        </button>
      </div>

      {/* Status Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-6 mb-8">
        <GlassCard>
          <p className="text-muted text-sm mb-2">Not Started</p>
          <p className="text-3xl font-heading font-bold text-muted">{statusCount['Not Started']}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-muted text-sm mb-2">In Progress</p>
          <p className="text-3xl font-heading font-bold text-yellow-400">{statusCount['In Progress']}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-muted text-sm mb-2">Completed</p>
          <p className="text-3xl font-heading font-bold text-success">{statusCount['Done']}</p>
        </GlassCard>
      </motion.div>

      {/* Systems Grid */}
      <div className="grid grid-cols-2 gap-6">
        {SYSTEMS.map((system, index) => {
          const systemData = getSystem(system.id);
          const statusColors = {
            'Not Started': 'bg-neutral-800 text-muted',
            'In Progress': 'bg-yellow-500/20 text-yellow-400',
            'Done': 'bg-success/20 text-success',
          };

          return (
            <motion.div key={system.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <GlassCard hoverable onClick={() => setModal({ systemId: system.id })}>
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{system.name}</h3>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={e => { e.stopPropagation(); openHintPanel(system, 'explain'); }}
                        title="Get explanation"
                        className="p-1.5 text-muted hover:text-accent transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); startQuiz(system.name); }}
                        title="Quiz this system"
                        className="p-1.5 text-muted hover:text-accent transition-colors"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted">{system.concept}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted mb-1">Week {system.week}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[systemData.status]}`}>
                      {systemData.status}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {Object.values(systemData.reshaded).map((completed, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${completed ? 'bg-success' : 'bg-neutral-800'}`} />
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal.systemId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setModal({ systemId: null })}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              {(() => {
                const systemData = getSystem(modal.systemId!);
                const system = SYSTEMS.find(s => s.id === modal.systemId);

                return (
                  <div className="p-8">
                    <h2 className="font-heading font-bold text-2xl text-foreground mb-2">{system?.name}</h2>
                    <p className="text-muted mb-6">{system?.concept}</p>

                    <div className="mb-6">
                      <p className="text-sm font-medium text-foreground mb-3">Status</p>
                      <div className="flex gap-2">
                        {(['Not Started', 'In Progress', 'Done'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => updateSystemStatus(modal.systemId!, status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              systemData.status === status ? 'bg-accent text-background' : 'bg-neutral-800 text-foreground hover:text-accent'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm font-medium text-foreground mb-3">RESHADED Framework</p>
                      <div className="space-y-2">
                        {reshaded.map(item => {
                          const key = item.toLowerCase().replace(/\s+/g, '') as keyof typeof systemData.reshaded;
                          const isChecked = systemData.reshaded[key];

                          return (
                            <label key={item} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800 hover:opacity-30 cursor-pointer transition-all">
                              <input type="checkbox" checked={isChecked} onChange={() => updateSystemReshaded(modal.systemId!, key, !isChecked)} className="hidden" />
                              <motion.div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-accent border-accent' : 'border-neutral-700 hover:border-accent'}`}>
                                {isChecked && <Check className="w-3 h-3 text-background" />}
                              </motion.div>
                              <span className="text-sm text-foreground">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button onClick={() => setModal({ systemId: null })} className="w-full mt-2 px-4 py-2 bg-accent text-background rounded-lg font-medium hover:opacity-90 transition-all">
                      Done
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Panel (Feature 4) */}
      <AnimatePresence>
        {quizOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-card border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground">Quiz: {quizSystem}</h3>
                  {quizQuestions.length > 0 && !quizDone && <p className="text-sm text-muted mt-1">Question {quizIndex + 1} of {quizQuestions.length}</p>}
                </div>
                <button onClick={() => setQuizOpen(false)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {quizLoading && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                  <span className="ml-3 text-muted">Generating quiz...</span>
                </div>
              )}
              {quizError && <div className="text-center py-8"><p className="text-secondary mb-4">{quizError}</p><button onClick={() => startQuiz(quizSystem)} className="text-accent text-sm hover:underline">Retry</button></div>}

              {quizQuestions.length > 0 && (
                <div className="h-1.5 bg-neutral-800 rounded-full mb-6 overflow-hidden">
                  <motion.div animate={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} className="h-full bg-accent rounded-full" />
                </div>
              )}

              {quizQuestions.length > 0 && !quizDone && !quizLoading && quizQuestions[quizIndex] && (
                <div>
                  <div className="mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${quizQuestions[quizIndex].type === 'mcq' ? 'bg-accent/20 text-accent' : quizQuestions[quizIndex].type === 'short' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-purple-400/20 text-purple-400'}`}>
                      {quizQuestions[quizIndex].type === 'mcq' ? 'Multiple Choice' : quizQuestions[quizIndex].type === 'short' ? 'Short Answer' : 'Architecture'}
                    </span>
                  </div>
                  <p className="text-foreground font-medium mb-4">{quizQuestions[quizIndex].question}</p>

                  {quizQuestions[quizIndex].type === 'mcq' && quizQuestions[quizIndex].options && (
                    <div className="space-y-2">
                      {quizQuestions[quizIndex].options!.map((opt, i) => {
                        const selected = quizAnswers[quizIndex] === opt;
                        const isCorrect = opt === quizQuestions[quizIndex].correctAnswer;
                        const hasAnswered = !!quizAnswers[quizIndex];
                        return (
                          <button key={i} onClick={() => !hasAnswered && setQuizAnswers(prev => ({ ...prev, [quizIndex]: opt }))}
                            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${hasAnswered ? isCorrect ? 'border-success bg-success/10 text-success' : selected ? 'border-secondary bg-secondary/10 text-secondary' : 'border-neutral-700 text-muted' : selected ? 'border-accent bg-accent/10 text-accent' : 'border-neutral-700 text-foreground hover:border-accent'}`}
                          >{opt}</button>
                        );
                      })}
                      {quizAnswers[quizIndex] && (
                        <p className={`text-sm mt-2 ${quizAnswers[quizIndex] === quizQuestions[quizIndex].correctAnswer ? 'text-success' : 'text-secondary'}`}>
                          {quizAnswers[quizIndex] === quizQuestions[quizIndex].correctAnswer ? '✓ Correct!' : `✗ Correct: ${quizQuestions[quizIndex].correctAnswer}`}
                        </p>
                      )}
                    </div>
                  )}

                  {(quizQuestions[quizIndex].type === 'short' || quizQuestions[quizIndex].type === 'architecture') && (
                    <div>
                      <textarea value={quizAnswers[quizIndex] || ''} onChange={e => setQuizAnswers(prev => ({ ...prev, [quizIndex]: e.target.value }))} placeholder="Type your answer..." rows={4} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none" />
                      {!quizFeedback[quizIndex] ? (
                        <button onClick={() => checkShortAnswer(quizIndex)} disabled={checkingAnswer || !quizAnswers[quizIndex]?.trim()} className="mt-2 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm disabled:opacity-50 flex items-center gap-2">
                          {checkingAnswer ? <><RefreshCw className="w-3 h-3 animate-spin" /> Checking...</> : 'Check Answer'}
                        </button>
                      ) : (
                        <div className="mt-3 p-3 bg-neutral-800 rounded-lg">
                          <p className="text-xs text-accent mb-1">Score: {quizFeedback[quizIndex].score}/10</p>
                          <p className="text-sm text-foreground">{quizFeedback[quizIndex].text}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between mt-6">
                    <button onClick={() => setQuizIndex(i => Math.max(0, i - 1))} disabled={quizIndex === 0} className="px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30">← Previous</button>
                    {quizIndex < quizQuestions.length - 1 ? (
                      <button onClick={() => setQuizIndex(i => i + 1)} className="px-4 py-2 bg-accent text-background rounded-lg text-sm font-medium flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
                    ) : (
                      <button onClick={() => setQuizDone(true)} className="px-4 py-2 bg-success/20 text-success border border-success rounded-lg text-sm">Finish Quiz</button>
                    )}
                  </div>
                </div>
              )}

              {quizDone && (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-accent mb-2">{getQuizScore()}/50</p>
                  <p className="text-muted mb-6">{getQuizScore() >= 40 ? 'Excellent!' : getQuizScore() >= 25 ? 'Good — review weak areas' : 'Keep practicing'}</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => startQuiz(quizSystem)} className="px-4 py-2 bg-accent/20 text-accent border border-accent rounded-lg text-sm">Retake</button>
                    <button onClick={() => setQuizOpen(false)} className="px-4 py-2 bg-neutral-800 text-foreground rounded-lg text-sm">Done</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Panel (Feature 5) */}
      <AnimatePresence>
        {hintPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHintPanel(null)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-96 bg-card border-l border-neutral-700 z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-lg text-foreground">{hintPanel.systemName}</h3>
                  <button onClick={() => setHintPanel(null)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex gap-1 mb-6 bg-neutral-800 rounded-lg p-1">
                  {(['explain', 'hint', 'approach'] as const).map(tab => (
                    <button key={tab} onClick={() => {
                      const sys = SYSTEMS.find(s => s.id === hintPanel.systemId);
                      if (sys) openHintPanel(sys, tab);
                    }} className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${hintPanel.tab === tab ? 'bg-accent text-background' : 'text-muted hover:text-foreground'}`}>
                      {tab === 'explain' ? 'Explain Simply' : tab === 'hint' ? 'Key Insight' : 'RESHADED Walk'}
                    </button>
                  ))}
                </div>

                {hintPanel.loading ? (
                  <div className="flex items-center gap-2 text-muted py-8"><RefreshCw className="w-5 h-5 animate-spin" /><span>Claude is thinking...</span></div>
                ) : hintPanel.error ? (
                  <p className="text-secondary text-sm">{hintPanel.error}</p>
                ) : (
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{hintPanel.content}</pre>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

