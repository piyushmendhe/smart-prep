'use client';

import { useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { CheckCircle2, Circle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryType {
  id: string;
  name: string;
  description: string;
  color: string;
}

const STORY_TYPES: StoryType[] = [
  {
    id: 'technical-challenge',
    name: 'Technical Challenge',
    description: 'Overcame a complex technical problem',
    color: 'from-accent to-cyan-400',
  },
  {
    id: 'conflict-resolution',
    name: 'Conflict Resolution',
    description: 'Resolved disagreement with team members',
    color: 'from-yellow-400 to-orange-400',
  },
  {
    id: 'ownership',
    name: 'Ownership',
    description: 'Took initiative beyond responsibilities',
    color: 'from-success to-emerald-400',
  },
  {
    id: 'failure-learning',
    name: 'Failure & Learning',
    description: 'Failed, learned, and improved',
    color: 'from-secondary to-pink-400',
  },
  {
    id: 'prioritization',
    name: 'Prioritization',
    description: 'Made impactful prioritization decision',
    color: 'from-purple-400 to-blue-400',
  },
  {
    id: 'leadership-mentoring',
    name: 'Leadership/Mentoring',
    description: 'Guided or mentored someone',
    color: 'from-indigo-400 to-purple-500',
  },
  {
    id: 'data-driven-decision',
    name: 'Data-Driven Decision',
    description: 'Made decision backed by data',
    color: 'from-teal-400 to-cyan-400',
  },
  {
    id: 'customer-impact',
    name: 'Customer Impact',
    description: 'Directly improved customer experience',
    color: 'from-lime-400 to-emerald-400',
  },
];

interface Modal {
  storyId: string | null;
}

export default function Behavioral() {
  const { data, isLoaded, updateBehavioralStory, exportData } = useProgress();
  const [modal, setModal] = useState<Modal>({ storyId: null });

  if (!isLoaded) return null;

  const completedStories = Object.values(data.behavioral.stories).filter(
    s => s.completed
  ).length;

  const getStory = (storyId: string) => {
    return (
      data.behavioral.stories[storyId] || {
        situation: '',
        task: '',
        action: '',
        result: '',
        completed: false,
      }
    );
  };

  const handleExport = () => {
    exportData();
  };

  return (
    <PageContainer
      title="Behavioral Stories"
      description="Master STAR framework with real experiences"
    >
      {/* Header with Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h3 className="font-heading font-semibold text-lg text-foreground">
            Stories Progress
          </h3>
          <p className="text-sm text-muted">
            {completedStories} / {STORY_TYPES.length} stories completed
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-opacity-90 transition-all"
        >
          <Download className="w-4 h-4" />
          Export All
        </button>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedStories / STORY_TYPES.length) * 100}%` }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-accent to-success rounded-full"
          />
        </div>
      </motion.div>

      {/* Stories Grid */}
      <div className="grid grid-cols-2 gap-6">
        {STORY_TYPES.map((storyType, index) => {
          const story = getStory(storyType.id);
          const isComplete = story.completed;

          return (
            <motion.div
              key={storyType.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard
                hoverable
                onClick={() => setModal({ storyId: storyType.id })}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    onClick={e => {
                      e.stopPropagation();
                      updateBehavioralStory(storyType.id, {
                        ...story,
                        completed: !story.completed,
                      });
                    }}
                    className="flex-shrink-0 mt-1"
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted hover:text-accent" />
                    )}
                  </motion.div>

                  <div className="flex-1">
                    <h3 className={`font-heading font-semibold text-lg transition-all ${
                      isComplete ? 'text-muted line-through' : 'text-foreground'
                    }`}>
                      {storyType.name}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {storyType.description}
                    </p>
                    {story.result && (
                      <p className="text-xs text-accent mt-2 line-clamp-2">
                        &quot;{story.result.substring(0, 60)}...&quot;
                      </p>
                    )}
                  </div>

                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                      story.situation && story.task && story.action && story.result
                        ? 'bg-success'
                        : 'bg-neutral-700'
                    }`}
                  />
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal.storyId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setModal({ storyId: null })}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-neutral-700 rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto"
            >
              {(() => {
                const storyType = STORY_TYPES.find(s => s.id === modal.storyId);
                const story = getStory(modal.storyId!);

                return (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-heading font-bold text-2xl text-foreground">
                        {storyType?.name}
                      </h2>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        onClick={() =>
                          updateBehavioralStory(modal.storyId!, {
                            ...story,
                            completed: !story.completed,
                          })
                        }
                        className="cursor-pointer"
                      >
                        {story.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-success" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted" />
                        )}
                      </motion.div>
                    </div>

                    <p className="text-muted mb-6">{storyType?.description}</p>

                    {/* STAR Fields */}
                    <div className="space-y-6">
                      {['Situation', 'Task', 'Action', 'Result'].map(
                        (field, index) => {
                          const key = field.toLowerCase() as keyof typeof story;
                          const value = story[key] as string;
                          const isResult = field === 'Result';
                          const charCount = value.length;

                          return (
                            <motion.div
                              key={field}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <label className="block mb-2">
                                <p className="font-heading font-semibold text-foreground mb-2">
                                  {field}
                                </p>
                                {isResult && (
                                  <p className="text-xs text-muted mb-1">
                                    Quantify your impact •{' '}
                                    <span
                                      className={
                                        charCount < 50
                                          ? 'text-muted'
                                          : charCount < 200
                                          ? 'text-yellow-400'
                                          : 'text-success'
                                      }
                                    >
                                      {charCount} / 500
                                    </span>
                                  </p>
                                )}
                              </label>
                              <textarea
                                value={value}
                                onChange={e => {
                                  const newValue = e.target.value;
                                  if (isResult && newValue.length > 500) return;
                                  updateBehavioralStory(modal.storyId!, {
                                    ...story,
                                    [key]: newValue,
                                  });
                                }}
                                placeholder={`Tell your ${field.toLowerCase()} (${isResult ? '2-3 sentences with metrics' : '1-2 sentences'})`}
                                className="w-full bg-neutral-800 bg-opacity-50 border border-neutral-700 rounded-lg p-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none h-24"
                              />
                            </motion.div>
                          );
                        }
                      )}
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setModal({ storyId: null })}
                      className="w-full mt-8 px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-opacity-90 transition-all"
                    >
                      Done
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
