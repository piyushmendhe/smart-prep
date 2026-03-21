'use client';

import { useState, useEffect, useRef } from 'react';
import { generateHeatmapData } from '@/lib/heatmap';
import { supabase } from '@/lib/supabase';

export interface DSAPattern {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problems: DSAProblem[];
}

export interface DSAProblem {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solved: boolean;
  notes: string;
}

export interface SystemDesignItem {
  id: string;
  name: string;
  concept: string;
  week: number;
  status: 'Not Started' | 'In Progress' | 'Done';
  reshaded: {
    requirements: boolean;
    estimation: boolean;
    storage: boolean;
    highLevel: boolean;
    apis: boolean;
    deepDive: boolean;
    edgeCases: boolean;
    discussion: boolean;
  };
  notes: string;
}

export interface ProgressData {
  dsa: {
    solvedProblems: string[];
    patternNotes: Record<string, string>;
  };
  systemDesign: {
    systems: Record<string, SystemDesignItem>;
    notes: Record<string, string>;
  };
  deRoadmap: {
    completedTopics: string[];
  };
  behavioral: {
    stories: Record<string, {
      situation: string;
      task: string;
      action: string;
      result: string;
      completed: boolean;
    }>;
  };
  dailyLogs: Record<string, string>;
  streak: {
    current: number;
    longest: number;
    lastActive: string;
  };
  settings: {
    name: string;
    targetCompany: string;
    startDate: string;
    dailyGoal: number;
    selectedTracks: string[];
  };
}

const STORAGE_KEY = 'smart-prep-progress';

const defaultData: ProgressData = {
  dsa: {
    solvedProblems: [],
    patternNotes: {},
  },
  systemDesign: {
    systems: {},
    notes: {},
  },
  deRoadmap: {
    completedTopics: [],
  },
  behavioral: {
    stories: {},
  },
  dailyLogs: {},
  streak: {
    current: 0,
    longest: 0,
    lastActive: new Date().toISOString().split('T')[0],
  },
  settings: {
    name: 'Prep Master',
    targetCompany: 'FAANG',
    startDate: new Date().toISOString().split('T')[0],
    dailyGoal: 5,
    selectedTracks: ['dsa', 'system-design', 'de-roadmap', 'behavioral'],
  },
};

export function useProgress() {
  const [data, setData] = useState<ProgressData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse progress data:', e);
        setData(defaultData);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage immediately on every change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // On mount: fetch latest from Supabase (source of truth for multi-device)
  useEffect(() => {
    if (!isLoaded) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: row } = await supabase
        .from('user_progress')
        .select('data')
        .eq('user_id', user.id)
        .single();
      if (row?.data && Object.keys(row.data as object).length > 0) {
        setData(row.data as ProgressData);
      }
    };
    load().catch(() => {}); // silent fail — localStorage is the fallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Debounced sync to Supabase (2s after last change)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!isLoaded) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase
            .from('user_progress')
            .upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
        } catch {
          // silent fail — localStorage is the backup
        }
      })();
    }, 2000);
    return () => clearTimeout(syncTimer.current);
  }, [data, isLoaded]);

  const updateStreak = () => {
    setData(prev => {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = prev.streak.lastActive;

      if (lastActive === today) return prev; // Already updated today

      const lastDate = new Date(lastActive);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const isConsecutive = nextDate.toISOString().split('T')[0] === today;

      const newCurrent = isConsecutive ? prev.streak.current + 1 : 1;
      return {
        ...prev,
        streak: {
          current: newCurrent,
          longest: Math.max(prev.streak.longest, newCurrent),
          lastActive: today,
        },
        dailyLogs: {
          ...prev.dailyLogs,
          [today]: prev.dailyLogs[today] || '',
        },
      };
    });
  };

  // Auto-update streak whenever the app is opened
  useEffect(() => {
    if (isLoaded) {
      updateStreak();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const toggleProblemSolved = (patternId: string, problemId: string) => {
    const problemFullId = `${patternId}-${problemId}`;
    setData(prev => ({
      ...prev,
      dsa: {
        ...prev.dsa,
        solvedProblems: prev.dsa.solvedProblems.includes(problemFullId)
          ? prev.dsa.solvedProblems.filter(id => id !== problemFullId)
          : [...prev.dsa.solvedProblems, problemFullId],
      },
    }));
    updateStreak();
  };

  const updateDailyLog = (content: string) => {
    const today = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [today]: content,
      },
    }));
    updateStreak();
  };

  const updateSystemStatus = (systemId: string, status: 'Not Started' | 'In Progress' | 'Done') => {
    setData(prev => {
      const existingSystem = prev.systemDesign.systems[systemId];
      
      return {
        ...prev,
        systemDesign: {
          ...prev.systemDesign,
          systems: {
            ...prev.systemDesign.systems,
            [systemId]: {
              ...(existingSystem || {
                id: systemId,
                name: systemId,
                concept: '',
                week: 1,
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
              }),
              status,
            },
          },
        },
      };
    });
  };

  const updateSystemReshaded = (systemId: string, key: keyof SystemDesignItem['reshaded'], value: boolean) => {
    setData(prev => {
      const existingSystem = prev.systemDesign.systems[systemId];
      
      return {
        ...prev,
        systemDesign: {
          ...prev.systemDesign,
          systems: {
            ...prev.systemDesign.systems,
            [systemId]: {
              ...(existingSystem || {
                id: systemId,
                name: systemId,
                concept: '',
                week: 1,
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
              }),
              reshaded: {
                ...(existingSystem?.reshaded || {
                  requirements: false,
                  estimation: false,
                  storage: false,
                  highLevel: false,
                  apis: false,
                  deepDive: false,
                  edgeCases: false,
                  discussion: false,
                }),
                [key]: value,
              },
            },
          },
        },
      };
    });
  };

  const updateBehavioralStory = (storyId: string, data_: any) => {
    setData(prev => ({
      ...prev,
      behavioral: {
        stories: {
          ...prev.behavioral.stories,
          [storyId]: data_,
        },
      },
    }));
    updateStreak();
  };

  const toggleTopicCompletion = (topicId: string) => {
    setData(prev => ({
      ...prev,
      deRoadmap: {
        completedTopics: prev.deRoadmap.completedTopics.includes(topicId)
          ? prev.deRoadmap.completedTopics.filter(id => id !== topicId)
          : [...prev.deRoadmap.completedTopics, topicId],
      },
    }));
    updateStreak();
  };

  const updateSettings = (settings: Partial<ProgressData['settings']>) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings,
      },
    }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-prep-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getHeatmapData = () => {
    return generateHeatmapData(data.dailyLogs);
  };

  return {
    data,
    isLoaded,
    toggleProblemSolved,
    updateDailyLog,
    updateSystemStatus,
    updateSystemReshaded,
    updateBehavioralStory,
    toggleTopicCompletion,
    updateSettings,
    exportData,
    getHeatmapData,
    updateStreak,
  };
}
