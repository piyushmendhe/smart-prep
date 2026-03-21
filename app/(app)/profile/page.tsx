'use client';

import { useState, useEffect } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { PageContainer, GlassCard } from '@/components/ui/components';
import { Save, Download, Upload, Link2, RefreshCw, Cpu, BookOpen, BarChart3, Database, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTokenUsage } from '@/lib/claude';

interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
}

interface LinkedAccounts {
  leetcodeUsername: string;
  gfgUsername: string;
  leetcodeStats: LeetCodeStats | null;
  lastSynced: string | null;
}

export default function Profile() {
  const { data, isLoaded, updateSettings, exportData } = useProgress();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data.settings);
  const [linked, setLinked] = useState<LinkedAccounts>({
    leetcodeUsername: '',
    gfgUsername: '',
    leetcodeStats: null,
    lastSynced: null,
  });
  const [lcInput, setLcInput] = useState('');
  const [gfgInput, setGfgInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const tokenUsage = getTokenUsage();

  useEffect(() => {
    const stored = localStorage.getItem('linked-accounts');
    if (stored) {
      const parsed: LinkedAccounts = JSON.parse(stored);
      setLinked(parsed);
      setLcInput(parsed.leetcodeUsername);
      setGfgInput(parsed.gfgUsername);
    }
    const lcStats = localStorage.getItem('leetcode-stats');
    if (lcStats) {
      const stats = JSON.parse(lcStats);
      setLinked(prev => ({ ...prev, leetcodeStats: stats }));
    }
  }, []);

  const syncLeetCode = async () => {
    if (!lcInput.trim()) return;
    setSyncing(true);
    setSyncError('');
    try {
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${lcInput.trim()}`);
      if (!res.ok) throw new Error('User not found');
      const json = await res.json();
      if (json.status === 'error') throw new Error(json.message || 'Failed to fetch');
      const stats: LeetCodeStats = {
        username: lcInput.trim(),
        totalSolved: json.totalSolved,
        easySolved: json.easySolved,
        mediumSolved: json.mediumSolved,
        hardSolved: json.hardSolved,
        ranking: json.ranking,
      };
      const updated: LinkedAccounts = {
        leetcodeUsername: lcInput.trim(),
        gfgUsername: gfgInput.trim(),
        leetcodeStats: stats,
        lastSynced: new Date().toISOString(),
      };
      setLinked(updated);
      localStorage.setItem('linked-accounts', JSON.stringify(updated));
      localStorage.setItem('leetcode-stats', JSON.stringify(stats));
    } catch (e: unknown) {
      setSyncError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const saveGFG = () => {
    const updated = { ...linked, gfgUsername: gfgInput.trim() };
    setLinked(updated);
    localStorage.setItem('linked-accounts', JSON.stringify(updated));
  };

  if (!isLoaded) return null;

  const handleSave = () => {
    updateSettings(formData);
    setIsEditing(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        // Basic validation
        if (importedData.settings) {
          updateSettings(importedData.settings);
        }
        alert('Data imported successfully!');
      } catch {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Calculate stats
  const daysInProgram = Object.keys(data.dailyLogs).length;
  const problemsSolved = data.dsa.solvedProblems.length;
  const systemsDesigned = Object.values(data.systemDesign.systems).filter(
    s => s.status === 'Done'
  ).length;

  // Calculate 90-day countdown
  const startDate = new Date(data.settings.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);
  const today = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <PageContainer title="Profile & Settings" description="Your interview prep dashboard">
      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <GlassCard>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-lg mb-4" />
              <h2 className="font-heading font-bold text-2xl text-foreground mb-1">
                {data.settings.name}
              </h2>
              <p className="text-muted">
                Targeting: <span className="text-accent font-medium">{data.settings.targetCompany}</span>
              </p>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                  setFormData(data.settings);
                }
              }}
              className="px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Company
                </label>
                <input
                  type="text"
                  value={formData.targetCompany}
                  onChange={e =>
                    setFormData({ ...formData, targetCompany: e.target.value })
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Daily Goal (problems/day)
                </label>
                <input
                  type="number"
                  value={formData.dailyGoal}
                  onChange={e =>
                    setFormData({ ...formData, dailyGoal: parseInt(e.target.value) })
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Focus Tracks
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'dsa', label: 'DSA', icon: BookOpen },
                    { id: 'system-design', label: 'System Design', icon: BarChart3 },
                    { id: 'de-roadmap', label: 'Data Engineering', icon: Database },
                    { id: 'behavioral', label: 'Behavioral', icon: MessageSquare },
                  ].map(({ id, label, icon: Icon }) => {
                    const selected = (formData.selectedTracks ?? ['dsa','system-design','de-roadmap','behavioral']).includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          const current = formData.selectedTracks ?? ['dsa','system-design','de-roadmap','behavioral'];
                          setFormData({
                            ...formData,
                            selectedTracks: selected
                              ? current.filter(t => t !== id)
                              : [...current, id],
                          });
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          selected
                            ? 'bg-accent/20 text-accent border-accent/50 font-medium'
                            : 'bg-neutral-800 text-muted border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted mb-1">Start Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(data.settings.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Daily Goal</p>
                  <p className="font-medium text-accent">
                    {data.settings.dailyGoal} problems/day
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-2">Focus Tracks</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'dsa', label: 'DSA', icon: BookOpen },
                    { id: 'system-design', label: 'System Design', icon: BarChart3 },
                    { id: 'de-roadmap', label: 'Data Engineering', icon: Database },
                    { id: 'behavioral', label: 'Behavioral', icon: MessageSquare },
                  ].map(({ id, label, icon: Icon }) => {
                    const active = (data.settings.selectedTracks ?? ['dsa','system-design','de-roadmap','behavioral']).includes(id);
                    return active ? (
                      <span key={id} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm bg-accent/15 text-accent border border-accent/30">
                        <Icon className="w-3.5 h-3.5" />{label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-6 mb-8"
      >
        <GlassCard>
          <p className="text-muted text-sm mb-2">Days in Program</p>
          <motion.p
            key={daysInProgram}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-heading font-bold text-accent"
          >
            {daysInProgram}
          </motion.p>
          <p className="text-xs text-muted mt-1">
            {((daysInProgram / 90) * 100).toFixed(0)}% through
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted text-sm mb-2">Problems Solved</p>
          <motion.p
            key={problemsSolved}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-heading font-bold text-success"
          >
            {problemsSolved}
          </motion.p>
          <p className="text-xs text-muted mt-1">
            {((problemsSolved / 250) * 100).toFixed(0)}% of 250
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted text-sm mb-2">Streak Record</p>
          <motion.p
            key={data.streak.longest}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-heading font-bold text-secondary"
          >
            {data.streak.longest}
          </motion.p>
          <p className="text-xs text-secondary mt-1">
            Current: {data.streak.current}
          </p>
        </GlassCard>

        <GlassCard>
          <p className="text-muted text-sm mb-2">Systems Designed</p>
          <motion.p
            key={systemsDesigned}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-heading font-bold text-accent"
          >
            {systemsDesigned}
          </motion.p>
          <p className="text-xs text-muted mt-1">
            {((systemsDesigned / 10) * 100).toFixed(0)}% of 10
          </p>
        </GlassCard>
      </motion.div>

      {/* 90-Day Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-lg text-foreground">
                90-Day Sprint Countdown
              </h3>
              <p className="text-sm text-muted mt-1">
                Started: {new Date(data.settings.startDate).toLocaleDateString()}
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                key={daysLeft}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-5xl font-heading font-bold text-accent mb-2"
              >
                {daysLeft}
              </motion.div>
              <p className="text-muted text-sm">
                {daysLeft === 0 ? 'Time\'s up! 🎉' : daysLeft === 1 ? 'Last day!' : `days left`}
              </p>
            </motion.div>
          </div>

          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((90 - daysLeft) / 90) * 100}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-accent to-success rounded-full"
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Data Management
          </h3>

          <div className="space-y-3">
            <button
              onClick={exportData}
              className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all font-medium text-foreground"
            >
              <Download className="w-5 h-5 text-accent" />
              Export All Progress
            </button>

            <label className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all font-medium text-foreground cursor-pointer">
              <Upload className="w-5 h-5 text-accent" />
              <span>Import Progress</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs text-muted mt-4">
            💾 All progress is saved locally in your browser. Export anytime to backup or
            transfer to another device.
          </p>
        </GlassCard>
      </motion.div>

      {/* Linked Accounts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-8">
        <GlassCard>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-accent" />
            Linked Accounts
          </h3>

          {/* LeetCode */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-2">LeetCode</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={lcInput}
                onChange={e => setLcInput(e.target.value)}
                placeholder="your-leetcode-username"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={syncLeetCode}
                disabled={syncing}
                className="px-4 py-2 bg-accent text-[#0a0a0f] rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
            </div>
            {syncError && <p className="text-xs text-secondary mt-1">{syncError}</p>}
            {linked.leetcodeStats && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="bg-neutral-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted">Total</p>
                  <p className="text-lg font-bold text-foreground">{linked.leetcodeStats.totalSolved}</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted">Easy</p>
                  <p className="text-lg font-bold text-success">{linked.leetcodeStats.easySolved}</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted">Medium</p>
                  <p className="text-lg font-bold text-yellow-400">{linked.leetcodeStats.mediumSolved}</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted">Hard</p>
                  <p className="text-lg font-bold text-secondary">{linked.leetcodeStats.hardSolved}</p>
                </div>
              </div>
            )}
            {linked.lastSynced && (
              <p className="text-xs text-muted mt-2">Last synced: {new Date(linked.lastSynced).toLocaleString()}</p>
            )}
          </div>

          {/* GFG */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">GeeksforGeeks (manual)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={gfgInput}
                onChange={e => setGfgInput(e.target.value)}
                placeholder="your-gfg-username"
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={saveGFG}
                className="px-4 py-2 bg-neutral-700 text-foreground rounded-lg text-sm font-medium hover:bg-neutral-600 transition-all"
              >
                Save
              </button>
            </div>
            {linked.gfgUsername && (
              <p className="text-xs text-success mt-1">Saved: {linked.gfgUsername}</p>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Claude Token Usage */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
        <GlassCard>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Claude AI Usage
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-neutral-800 rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">API Calls</p>
              <p className="text-2xl font-bold text-accent">{tokenUsage.calls}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">Input Tokens</p>
              <p className="text-2xl font-bold text-foreground">{tokenUsage.total_input.toLocaleString()}</p>
            </div>
            <div className="bg-neutral-800 rounded-lg p-3 text-center">
              <p className="text-xs text-muted mb-1">Output Tokens</p>
              <p className="text-2xl font-bold text-foreground">{tokenUsage.total_output.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            Est. cost: ~${((tokenUsage.total_input * 3 + tokenUsage.total_output * 15) / 1_000_000).toFixed(4)} (Sonnet pricing)
          </p>
        </GlassCard>
      </motion.div>

      {/* Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-8"
      >
        <GlassCard>
          <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
            About SMART PREP
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            SMART PREP is a production-ready interview prep tracker designed for FAANG candidates.
            Track your DSA problems, system design interviews, data engineering roadmap, and
            behavioral stories - all in one place. Build consistent momentum over 90 days and land
            your dream role.
          </p>
          <p className="text-xs text-muted mt-4">
            Built with Next.js 14, TypeScript, Tailwind CSS & Framer Motion
          </p>
        </GlassCard>
      </motion.div>
    </PageContainer>
  );
}
