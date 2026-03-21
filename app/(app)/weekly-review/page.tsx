'use client';

import { useState, useEffect } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { ChevronLeft, ChevronRight, Brain, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { callClaude } from '@/lib/claude';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: 'dsa' | 'system-design' | 'de' | 'behavioral';
}

interface WeeklyReview {
  id: string;
  weekStart: string;
  summary: string;
  flashcards: Flashcard[];
  stats: {
    problemsSolved: number;
    systemsStudied: number;
    deTopics: number;
    quizzesTaken: number;
  };
  generatedAt: string;
}

export default function WeeklyReview() {
  const { data, isLoaded } = useProgress();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('weekly-reviews');
    if (stored) {
      const parsed: WeeklyReview[] = JSON.parse(stored);
      setReviews(parsed);
      if (parsed.length > 0) setCurrentReview(parsed[parsed.length - 1]);
    }
  }, []);

  const getWeekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  const generateReview = async () => {
    setGenerating(true);
    setGenError('');

    const problemsSolved = data.dsa.solvedProblems.length;
    const systemsStudied = Object.values(data.systemDesign.systems).filter(
      s => s.status === 'Done' || s.status === 'In Progress'
    ).length;
    const deTopics = data.deRoadmap.completedTopics.length;
    const sessions: {type?: string; topicsCovered?: string[]; struggles?: string; nextFocus?: string}[] = JSON.parse(localStorage.getItem('ai-sessions') || '[]');
    const recentSessions = sessions.slice(-5);

    const prompt = `You are a technical interview coach. Generate a concise weekly review for a FAANG candidate.

Stats this week:
- DSA problems solved (total): ${problemsSolved}
- System design systems studied: ${systemsStudied}
- DE roadmap topics completed: ${deTopics}
- Recent AI sessions: ${recentSessions.map(s => `[${s.type || 'general'}] ${(s.topicsCovered || []).join(', ')}`).join(' | ')}

Return a JSON object (no markdown, no code blocks) with this exact shape:
{
  "summary": "2-3 sentence motivational weekly recap mentioning specific topics",
  "flashcards": [
    { "id": "fc1", "front": "Question", "back": "Answer", "category": "dsa" },
    { "id": "fc2", "front": "Question", "back": "Answer", "category": "system-design" },
    { "id": "fc3", "front": "Question", "back": "Answer", "category": "dsa" },
    { "id": "fc4", "front": "Question", "back": "Answer", "category": "de" },
    { "id": "fc5", "front": "Question", "back": "Answer", "category": "dsa" },
    { "id": "fc6", "front": "Question", "back": "Answer", "category": "system-design" },
    { "id": "fc7", "front": "Question", "back": "Answer", "category": "de" },
    { "id": "fc8", "front": "Question", "back": "Answer", "category": "behavioral" },
    { "id": "fc9", "front": "Question", "back": "Answer", "category": "dsa" },
    { "id": "fc10", "front": "Question", "back": "Answer", "category": "system-design" }
  ]
}

Make the flashcard questions SPECIFIC and TECHNICAL, testing real interview knowledge. Vary difficulty. Back answers should be 1-3 sentences.`;

    try {
      const raw = await callClaude(prompt, false);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Failed to parse response');
      const parsed = JSON.parse(match[0]);

      const review: WeeklyReview = {
        id: Date.now().toString(),
        weekStart: getWeekStart(),
        summary: parsed.summary,
        flashcards: parsed.flashcards,
        stats: { problemsSolved, systemsStudied, deTopics, quizzesTaken: recentSessions.length },
        generatedAt: new Date().toISOString(),
      };

      const updated = [...reviews, review];
      setReviews(updated);
      setCurrentReview(review);
      setCardIndex(0);
      setFlipped(false);
      localStorage.setItem('weekly-reviews', JSON.stringify(updated));
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : 'Generation failed. Check your Claude API key.');
    } finally {
      setGenerating(false);
    }
  };

  const categoryColors: Record<Flashcard['category'], string> = {
    dsa: 'text-accent border-accent',
    'system-design': 'text-secondary border-secondary',
    de: 'text-purple-400 border-purple-400',
    behavioral: 'text-success border-success',
  };

  const currentCard = currentReview?.flashcards[cardIndex];

  if (!isLoaded) return null;

  return (
    <PageContainer title="Weekly Review" description="AI-generated revision + flashcards every week">
      {/* Generate / Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {currentReview && (
            <p className="text-sm text-muted">
              Generated: {new Date(currentReview.generatedAt).toLocaleDateString()} &nbsp;·&nbsp;
              {currentReview.flashcards.length} flashcards
            </p>
          )}
        </div>
        <button
          onClick={generateReview}
          disabled={generating}
          className="px-5 py-2.5 bg-accent text-[#0a0a0f] rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Brain className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
          {generating ? 'Generating…' : 'Generate This Week\'s Review'}
        </button>
      </div>

      {genError && (
        <div className="mb-6 p-3 rounded-lg bg-secondary/10 border border-secondary text-secondary text-sm">
          {genError}
        </div>
      )}

      {!currentReview && !generating && (
        <GlassCard>
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No weekly review yet. Click &quot;Generate&quot; to create your first one.</p>
          </div>
        </GlassCard>
      )}

      {currentReview && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Problems Solved', value: currentReview.stats.problemsSolved, color: 'text-accent' },
              { label: 'Systems Studied', value: currentReview.stats.systemsStudied, color: 'text-secondary' },
              { label: 'DE Topics', value: currentReview.stats.deTopics, color: 'text-purple-400' },
              { label: 'AI Sessions', value: currentReview.stats.quizzesTaken, color: 'text-success' },
            ].map(stat => (
              <GlassCard key={stat.label}>
                <p className="text-xs text-muted mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
              </GlassCard>
            ))}
          </div>

          {/* AI Summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <GlassCard>
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                Weekly Summary
              </h3>
              <p className="text-muted leading-relaxed">{currentReview.summary}</p>
            </GlassCard>
          </motion.div>

          {/* Flashcard Deck */}
          {currentCard && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-foreground">
                  Flashcards ({cardIndex + 1} / {currentReview.flashcards.length})
                </h3>
                <span className={`text-xs px-2 py-1 rounded border font-medium capitalize ${categoryColors[currentCard.category]}`}>
                  {currentCard.category.replace('-', ' ')}
                </span>
              </div>

              {/* Card - 3D flip */}
              <div
                className="relative cursor-pointer mb-6"
                style={{ perspective: '1200px', height: '220px' }}
                onClick={() => setFlipped(f => !f)}
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative' }}
                >
                  {/* Front */}
                  <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
                    <GlassCard>
                      <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center">
                        <p className="text-xs text-accent uppercase font-semibold mb-3 tracking-widest">Question</p>
                        <p className="text-lg text-foreground font-medium">{currentCard.front}</p>
                        <p className="text-xs text-muted mt-4">Click to reveal answer</p>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Back */}
                  <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}>
                    <GlassCard>
                      <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-center">
                        <p className="text-xs text-success uppercase font-semibold mb-3 tracking-widest">Answer</p>
                        <p className="text-base text-foreground leading-relaxed">{currentCard.back}</p>
                        <p className="text-xs text-muted mt-4">Click to flip back</p>
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
                  disabled={cardIndex === 0}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>

                <button
                  onClick={() => { setCardIndex(0); setFlipped(false); }}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-muted flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restart
                </button>

                <button
                  onClick={() => {
                    setCardIndex(i => Math.min(currentReview.flashcards.length - 1, i + 1));
                    setFlipped(false);
                  }}
                  disabled={cardIndex === currentReview.flashcards.length - 1}
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Dot progress */}
              <div className="flex justify-center gap-1.5 mt-4">
                {currentReview.flashcards.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCardIndex(i); setFlipped(false); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === cardIndex ? 'bg-accent' : 'bg-neutral-700 hover:bg-neutral-500'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past reviews list */}
          {reviews.length > 1 && (
            <div className="mt-12">
              <h3 className="font-heading font-semibold text-foreground mb-4">Past Reviews</h3>
              <div className="space-y-2">
                {[...reviews].reverse().map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setCurrentReview(r); setCardIndex(0); setFlipped(false); }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentReview?.id === r.id
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-neutral-700 bg-neutral-800 text-muted hover:border-neutral-500 hover:text-foreground'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      Week of {new Date(r.weekStart).toLocaleDateString()}
                    </span>
                    <span className="text-xs ml-3">
                      {r.flashcards.length} cards · {r.stats.problemsSolved} problems
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
