'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, ProgressRing, GlassCard } from '@/components/ui/components';
import { BarChart3, CheckCircle, Flame, Users, Zap, AlertTriangle, TrendingUp, RefreshCw, Brain, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callClaude } from '@/lib/claude';
import Link from 'next/link';

interface HeatmapDay {
  date: string;
  count: number;
  level: 'empty' | 'low' | 'medium' | 'high' | 'very-high';
}

interface SessionSummary {
  date: string;
  topicsCovered: string[];
  struggles: string;
  nextFocus: string;
}

interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
  username: string;
}

const TOTAL_PROBLEMS = 250;
const SYSTEMS_COUNT = 10;

const WEEKLY_TARGETS = [
  { weeks: '1-4', label: 'Pattern Mastery', problemsPerWeek: 14, systemsPerWeek: 1 },
  { weeks: '5-8', label: 'Depth & Design', problemsPerWeek: 16, systemsPerWeek: 2 },
  { weeks: '9-12', label: 'Simulation', problemsPerWeek: 10, systemsPerWeek: 2 },
];

export default function Dashboard() {
  const { data, isLoaded, getHeatmapData, updateDailyLog } = useProgress();
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [todayLog, setTodayLog] = useState('');
  const [lastSession, setLastSession] = useState<SessionSummary | null>(null);
  const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(null);
  const [catchUpPlan, setCatchUpPlan] = useState('');
  const [loadingCatchUp, setLoadingCatchUp] = useState(false);
  const [catchUpError, setCatchUpError] = useState('');

  useEffect(() => {
    if (isLoaded) {
      const heatmapData = getHeatmapData();
      setHeatmap(heatmapData);

      const today = new Date().toISOString().split('T')[0];
      setTodayLog(data.dailyLogs[today] || '');

      // Load last session
      try {
        const sessions: SessionSummary[] = JSON.parse(localStorage.getItem('ai-sessions') || '[]');
        if (sessions.length > 0) setLastSession(sessions[sessions.length - 1]);
      } catch {}

      // Load LeetCode stats
      try {
        const lc = JSON.parse(localStorage.getItem('leetcode-stats') || 'null');
        if (lc) setLeetcodeStats(lc);
      } catch {}
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  const solvedCount = data.dsa.solvedProblems.length;
  const systemsDoneCount = Object.values(data.systemDesign.systems).filter(
    s => s.status === 'Done'
  ).length;
  const storiesCount = Object.values(data.behavioral.stories).filter(
    s => s.completed
  ).length;

  const handleLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTodayLog(value);
    updateDailyLog(value);
  };

  // Calculate time metrics
  const startDate = new Date(data.settings.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);
  const today = new Date();
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weeksLeft = Math.ceil(daysLeft / 7);
  const currentDay = Math.min(Math.max(daysElapsed + 1, 1), 90);
  const currentWeek = Math.ceil(currentDay / 7);

  // Backlog calculations — daily granularity (how many should be done BY TODAY)
  const d = Math.max(0, daysElapsed); // days elapsed since start
  const expectedProblems = Math.min(
    Math.floor(
      d <= 28 ? d * 2 :
      d <= 56 ? 28 * 2 + (d - 28) * (16 / 7) :
      28 * 2 + 28 * (16 / 7) + (d - 56) * (10 / 7)
    ),
    TOTAL_PROBLEMS
  );
  const expectedSystems = Math.min(
    Math.floor(
      d <= 28 ? d * (1 / 7) :
      d <= 56 ? 28 * (1 / 7) + (d - 28) * (2 / 7) :
      4 + 8
    ),
    SYSTEMS_COUNT
  );
  const problemBacklog = Math.max(0, expectedProblems - solvedCount);
  const systemBacklog = Math.max(0, expectedSystems - systemsDoneCount);
  // How many per day needed to clear backlog by end of sprint
  const problemsPerDayNeeded = daysLeft > 0
    ? Math.ceil((TOTAL_PROBLEMS - solvedCount) / daysLeft)
    : 0;
  const systemsPerDayNeeded = daysLeft > 0
    ? parseFloat(((SYSTEMS_COUNT - systemsDoneCount) / daysLeft).toFixed(1))
    : 0;

  const backlogColor = (backlog: number, threshold: number) => {
    if (backlog === 0) return 'text-success';
    if (backlog <= threshold) return 'text-yellow-400';
    return 'text-secondary';
  };

  const progressPercent = Math.min((currentDay / 90) * 100, 100);
  const progressColor = daysLeft > 30 ? '#00ff88' : daysLeft > 14 ? '#ffd700' : '#ff6b6b';
  const currentTarget = currentWeek <= 4 ? WEEKLY_TARGETS[0] : currentWeek <= 8 ? WEEKLY_TARGETS[1] : WEEKLY_TARGETS[2];

  const handleCatchUpPlan = async () => {
    setLoadingCatchUp(true);
    setCatchUpError('');
    try {
      const prompt = `I am preparing for FAANG interviews on a 90-day plan. I'm on day ${currentDay} of 90.

Current status:
- DSA problems solved: ${solvedCount} (expected: ${expectedProblems}, backlog: ${problemBacklog})
- Systems designed: ${systemsDoneCount} (expected: ${expectedSystems}, backlog: ${systemBacklog})
- Current week: ${currentWeek} of 12, days left: ${daysLeft}

Generate a prioritized 1-week catch-up schedule to get back on track. Be specific with daily tasks (Monday-Sunday). Format clearly. Under 300 words.`;

      const plan = await callClaude(prompt, false);
      setCatchUpPlan(plan);
    } catch (e: unknown) {
      setCatchUpError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setLoadingCatchUp(false);
    }
  };

  return (
    <PageContainer title="Dashboard" description="Your FAANG interview prep journey">


      {/* 90-Day Countdown & Streak */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">90-Day Sprint</h3>
            <div className="flex items-end gap-4 mb-3">
              <div>
                <motion.p key={daysLeft} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-4xl font-heading font-bold text-accent">
                  {daysLeft}
                </motion.p>
                <p className="text-sm text-muted">Days left</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-secondary">{weeksLeft}</p>
                <p className="text-sm text-muted">Weeks</p>
              </div>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                style={{ backgroundColor: progressColor }}
                className="h-full rounded-full"
              />
            </div>
            <p className="text-xs text-muted mt-2">Day {currentDay} of 90</p>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Current Streak</h3>
            <div className="flex items-center gap-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}>
                <Flame className="w-10 h-10 text-secondary" />
              </motion.div>
              <div>
                <motion.p
                  key={data.streak.current}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl font-heading font-bold text-secondary leading-none"
                >
                  {data.streak.current}
                </motion.p>
                <p className="text-sm text-muted mt-1">days &middot; Record: {data.streak.longest}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Last Session Card (Feature 1) */}
      {lastSession && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6">
          <GlassCard className="border-accent border-opacity-40">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="w-5 h-5 text-accent" />
                <h3 className="font-heading font-semibold text-foreground">Resume Last Session</h3>
              </div>
              <Link href="/sessions" className="text-xs text-accent hover:underline">View all →</Link>
            </div>
            <p className="text-sm text-muted mb-1">Last session: <span className="text-foreground">{new Date(lastSession.date).toLocaleDateString()}</span></p>
            <p className="text-sm text-muted mb-1">You covered: <span className="text-foreground">{lastSession.topicsCovered.join(', ') || 'various topics'}</span></p>
            {lastSession.struggles && (
              <p className="text-sm text-muted mb-1">You struggled with: <span className="text-secondary">{lastSession.struggles}</span></p>
            )}
            {lastSession.nextFocus && (
              <p className="text-sm text-muted">Today focus on: <span className="text-success font-medium">{lastSession.nextFocus}</span></p>
            )}
          </GlassCard>
        </motion.div>
      )}

      {/* LeetCode Stats Card (Feature 6) */}
      {leetcodeStats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }} className="mt-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">LeetCode Stats — {leetcodeStats.username}</h3>
              <Link href="/profile" className="text-xs text-accent hover:underline">Manage →</Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{leetcodeStats.totalSolved}</p>
                <p className="text-xs text-muted">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{leetcodeStats.easySolved}</p>
                <p className="text-xs text-muted">Easy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{leetcodeStats.mediumSolved}</p>
                <p className="text-xs text-muted">Medium</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{leetcodeStats.hardSolved}</p>
                <p className="text-xs text-muted">Hard</p>
              </div>
            </div>
            <div className="flex gap-0.5 mt-3 h-3 rounded overflow-hidden">
              {leetcodeStats.totalSolved > 0 && (
                <>
                  <div style={{ width: `${(leetcodeStats.easySolved / leetcodeStats.totalSolved) * 100}%` }} className="bg-success" />
                  <div style={{ width: `${(leetcodeStats.mediumSolved / leetcodeStats.totalSolved) * 100}%` }} className="bg-yellow-400" />
                  <div style={{ width: `${(leetcodeStats.hardSolved / leetcodeStats.totalSolved) * 100}%` }} className="bg-secondary" />
                </>
              )}
            </div>
            <p className="text-xs text-muted mt-2">Acceptance: {leetcodeStats.acceptanceRate?.toFixed(1)}% · Rank: #{leetcodeStats.ranking?.toLocaleString()}</p>
          </GlassCard>
        </motion.div>
      )}

      {/* Progress Rings */}
      <div className="mt-6">
        <h3 className="font-heading font-semibold text-lg text-foreground mb-6">Overall Progress</h3>
        <div className="grid grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <ProgressRing value={solvedCount} max={TOTAL_PROBLEMS} label="DSA Problems" icon={<Zap className="w-6 h-6 text-accent" />} />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            <ProgressRing value={systemsDoneCount} max={SYSTEMS_COUNT} label="System Designs" icon={<BarChart3 className="w-6 h-6 text-accent" />} />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
            <ProgressRing value={storiesCount} max={8} label="Stories Written" icon={<Users className="w-6 h-6 text-accent" />} />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}>
            <ProgressRing value={data.deRoadmap.completedTopics.length} max={16} label="DE Topics" icon={<CheckCircle className="w-6 h-6 text-accent" />} />
          </motion.div>
        </div>
      </div>

      {/* WAR ROOM — Feature 7 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-secondary" />
          <h2 className="font-heading font-bold text-2xl text-foreground">War Room</h2>
          <span className="text-xs bg-secondary bg-opacity-20 text-secondary px-2 py-1 rounded font-medium">90-Day Tracker</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <GlassCard>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Week {currentWeek} Target
            </h4>
            <p className="text-xs text-accent mb-3 font-medium">Phase: {currentTarget.label}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Problems/week</span>
                <span className="text-foreground font-bold">{currentTarget.problemsPerWeek}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">System designs</span>
                <span className="text-foreground font-bold">{currentTarget.systemsPerWeek}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-700 space-y-1">
              <p className="text-xs text-muted">Weeks 1-4: Pattern Mastery → 14/week</p>
              <p className="text-xs text-muted">Weeks 5-8: Depth & Design → 16/week</p>
              <p className="text-xs text-muted">Weeks 9-12: Simulation → 10 Hard/week</p>
            </div>
          </GlassCard>

          <GlassCard>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-secondary" />
              Backlog Status
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted">DSA Problems</span>
                  <span className={`text-base font-bold ${backlogColor(problemBacklog, 5)}`}>
                    {problemBacklog === 0 ? '✓ On track' : `${problemBacklog} behind`}
                  </span>
                </div>
                <p className="text-xs text-muted">Expected {expectedProblems} today · Actual {solvedCount}</p>
                {problemBacklog > 0 && (
                  <p className="text-xs text-yellow-400 mt-0.5">→ Need <span className="font-bold">{problemsPerDayNeeded}/day</span> to finish sprint</p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted">System Designs</span>
                  <span className={`text-base font-bold ${backlogColor(systemBacklog, 2)}`}>
                    {systemBacklog === 0 ? '✓ On track' : `${systemBacklog} behind`}
                  </span>
                </div>
                <p className="text-xs text-muted">Expected {expectedSystems} today · Actual {systemsDoneCount}</p>
                {systemBacklog > 0 && (
                  <p className="text-xs text-yellow-400 mt-0.5">→ Need <span className="font-bold">{systemsPerDayNeeded}/day</span> to finish sprint</p>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-700">
              {problemBacklog === 0 && systemBacklog === 0
                ? <p className="text-xs text-success">🎉 You&apos;re on track! Keep going.</p>
                : problemBacklog <= 5 && systemBacklog <= 2
                  ? <p className="text-xs text-yellow-400">⚠️ Slightly behind — push today</p>
                  : <p className="text-xs text-secondary">🔴 Significantly behind — need to catch up</p>
              }
            </div>
          </GlassCard>

          <GlassCard>
            <h4 className="font-semibold text-foreground mb-3">This Week Target</h4>
            <p className="text-xs text-muted mb-3">To stay on track:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">{currentTarget.problemsPerWeek}</span>
                <span className="text-sm text-muted">DSA problems</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">{currentTarget.systemsPerWeek}</span>
                <span className="text-sm text-muted">system design{currentTarget.systemsPerWeek > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button
              onClick={handleCatchUpPlan}
              disabled={loadingCatchUp}
              className="mt-4 w-full py-2 bg-secondary bg-opacity-20 hover:bg-opacity-30 text-secondary rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingCatchUp ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : '⚡ Catch Up Plan (AI)'}
            </button>
            {catchUpError && <p className="text-xs text-secondary mt-2">{catchUpError}</p>}
          </GlassCard>
        </div>

        <AnimatePresence>
          {catchUpPlan && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
              <GlassCard className="border-secondary border-opacity-40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">AI Catch-Up Plan</h4>
                  <button onClick={() => setCatchUpPlan('')} className="text-muted hover:text-foreground text-xs">✕ Close</button>
                </div>
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{catchUpPlan}</pre>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Today's Focus & Daily Log */}
      <div className="grid grid-cols-2 gap-6 mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GlassCard>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Today&apos;s Focus</h3>
            <p className="text-sm text-muted mb-4">Based on your 90-day roadmap:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-accent">→</span><span>Complete 1-2 DSA patterns (Easy/Medium)</span></li>
              <li className="flex gap-2"><span className="text-accent">→</span><span>Work on System Design RESHADED framework</span></li>
              <li className="flex gap-2"><span className="text-accent">→</span><span>Refine 1 STAR story with data impact</span></li>
            </ul>
            <p className="text-xs text-muted mt-4 italic">💪 Compound small wins into big results</p>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <GlassCard>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Daily Log</h3>
            <textarea
              value={todayLog}
              onChange={handleLogChange}
              placeholder="What did you accomplish today? (e.g., Solved 3 problems, Designed Twitter feed, Wrote Ownership story)"
              className="w-full h-32 bg-neutral-800 bg-opacity-50 border border-neutral-700 rounded-lg p-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            />
            <p className="text-xs text-muted mt-2">Track daily progress → Build momentum</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="grid grid-cols-4 gap-6 mt-8">
        <GlassCard>
          <p className="text-muted text-sm mb-2">Total Problems</p>
          <motion.p key={solvedCount} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-heading font-bold text-accent">
            {solvedCount}
          </motion.p>
          <p className="text-xs text-muted mt-1">{((solvedCount / TOTAL_PROBLEMS) * 100).toFixed(0)}% complete</p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted text-sm mb-2">Days Active</p>
          <motion.p key={Object.keys(data.dailyLogs).length} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-heading font-bold text-accent">
            {Object.keys(data.dailyLogs).length}
          </motion.p>
          <p className="text-xs text-muted mt-1">
            Avg {((solvedCount + Object.keys(data.behavioral.stories).length) / Math.max(Object.keys(data.dailyLogs).length, 1)).toFixed(1)}/day
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted text-sm mb-2">Mock Interviews</p>
          <p className="text-3xl font-heading font-bold text-secondary">0</p>
          <p className="text-xs text-muted mt-1">Coming soon</p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted text-sm mb-2">Stories</p>
          <motion.p key={storiesCount} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-heading font-bold text-accent">
            {storiesCount}/8
          </motion.p>
          <p className="text-xs text-muted mt-1">{((storiesCount / 8) * 100).toFixed(0)}% complete</p>
        </GlassCard>
      </motion.div>

      {/* Sprint Activity — 90 Study Days */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-8">
        <GlassCard>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg text-foreground">Sprint Activity — 90 Study Days</h3>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded inline-block bg-[#00d4ffb3]" />Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded inline-block border border-dashed border-[#00d4ff88]" />Revision
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded inline-block bg-[#ff6b6b33] border border-[#ff6b6b55]" />Missed
              </span>
            </div>
          </div>

          {/* Week column headers */}
          <div className="flex items-center gap-1 mb-1 ml-[3.25rem]">
            {['M','T','W','T','F','S','','R'].map((label, i) => (
              <span key={i} className={`text-[10px] text-muted text-center ${i === 6 ? 'w-2' : 'w-6'}`}>{label}</span>
            ))}
          </div>

          {/* 15 week rows */}
          <div className="space-y-1">
            {(() => {
              const fmt = (dt: Date) =>
                `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
              const todayStr = fmt(today);
              const sprintBase = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

              let studyDaysActive = 0;

              const rows = Array.from({ length: 15 }, (_, wk) => {
                const ws = new Date(sprintBase);
                ws.setDate(sprintBase.getDate() + wk * 7);
                const we = new Date(ws);
                we.setDate(ws.getDate() + 6);
                const isCurrentWeek = today >= ws && today <= we;
                const isWeekFuture = ws > today;

                const studyCells = Array.from({ length: 6 }, (_, d) => {
                  const day = new Date(ws);
                  day.setDate(ws.getDate() + d);
                  const ds = fmt(day);
                  const isFuture = ds > todayStr;
                  const hasActivity = ds in data.dailyLogs;
                  const isMissed = ds < todayStr && !hasActivity;
                  if (hasActivity && !isFuture) studyDaysActive++;
                  return { ds, isFuture, hasActivity, isMissed };
                });

                const revDay = new Date(ws);
                revDay.setDate(ws.getDate() + 6);
                const revDs = fmt(revDay);
                const revFuture = revDs > todayStr;
                const revActive = revDs in data.dailyLogs;

                return (
                  <div key={wk} className={`flex items-center gap-1 ${isWeekFuture ? 'opacity-35' : ''}`}>
                    {/* Week label */}
                    <span className={`text-[11px] w-12 flex-shrink-0 text-right mr-1 tabular-nums ${
                      isCurrentWeek ? 'text-accent font-bold' : 'text-muted'
                    }`}>
                      Wk {wk + 1}
                    </span>

                    {/* 6 study day squares */}
                    {studyCells.map(({ ds, isFuture, hasActivity, isMissed }) => (
                      <div
                        key={ds}
                        title={`${ds}${hasActivity ? ' ✓ active' : isMissed ? ' — missed' : ''}`}
                        className={`w-6 h-6 rounded flex items-center justify-center cursor-help transition-all ${
                          isFuture
                            ? 'bg-neutral-900 opacity-40'
                            : hasActivity
                              ? 'bg-[#00d4ffb3]'
                              : isMissed
                                ? 'bg-[#ff6b6b22] border border-[#ff6b6b44]'
                                : 'bg-neutral-800'
                        }`}
                      >
                        {hasActivity && !isFuture && (
                          <span className="text-[9px] font-bold text-[#0a0a0f] select-none leading-none">✓</span>
                        )}
                      </div>
                    ))}

                    {/* Spacer between study and revision */}
                    <div className="w-2" />

                    {/* Revision day — dashed border, distinct style */}
                    <div
                      title={`Revision day: ${revDs}${revActive ? ' ↺ done' : ''}`}
                      className={`w-6 h-6 rounded flex items-center justify-center cursor-help border border-dashed transition-all ${
                        revFuture
                          ? 'border-neutral-700 bg-neutral-900 opacity-40'
                          : revActive
                            ? 'bg-[#00d4ff22] border-[#00d4ff99]'
                            : 'border-neutral-600 bg-neutral-800'
                      }`}
                    >
                      {revActive && !revFuture && (
                        <span className="text-[9px] font-bold text-accent select-none leading-none">↺</span>
                      )}
                    </div>
                  </div>
                );
              });

              return rows;
            })()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800">
            <p className="text-xs text-muted">🔥 6 study + 1 revision per week · 15 weeks · 90 goals</p>
            <p className="text-xs text-accent font-medium">
              {(() => {
                const fmt = (dt: Date) =>
                  `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
                const todayStr = fmt(today);
                const sprintBase = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                let done = 0;
                for (let wk = 0; wk < 15; wk++) {
                  for (let d = 0; d < 6; d++) {
                    const day = new Date(sprintBase);
                    day.setDate(sprintBase.getDate() + wk * 7 + d);
                    const ds = fmt(day);
                    if (ds <= todayStr && ds in data.dailyLogs) done++;
                  }
                }
                return `${done} / 90 study days active`;
              })()}
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </PageContainer>
  );
}
