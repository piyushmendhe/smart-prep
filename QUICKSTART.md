# SMART PREP - Quick Start Guide

## 🚀 Getting Started

### Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### Navigation
- **Sidebar (Left)**: Navigate between different modules
- **Header (Top)**: Shows current date and your streak counter
- **Main Content**: Scrollable content area for each page

## 📱 What Each Page Does

### 1. Dashboard (/)
Your interview prep overview with:
- 90-day activity heatmap
- Current streak counter with animation
- 4 progress rings showing advancement
- Daily focus recommendations
- Daily log textarea to track activities
- Statistics: problems solved, days active, streak record

**Actions:**
- Fill daily log to update streak
- View your overall progress

### 2. DSA Track (/dsa)
Master 15 coding patterns with 250 total problems:
- Click pattern cards to expand/collapse
- Check off problems as you solve them
- Filter by Easy/Medium/Hard difficulty
- See progress bar for each pattern
- View statistics by difficulty

**Popular Patterns:**
- Two Pointers, Sliding Window, BFS, DFS
- Dynamic Programming, Binary Search
- Union Find, Backtracking, and more

### 3. System Design (/system-design)
Design 10 critical systems using RESHADED framework:
- Click any system card to open the modal
- Mark status: Not Started → In Progress → Done
- Check off each RESHADED component
- Track progress with visual indicators

**10 Systems:**
- URL Shortener, Twitter Feed, YouTube, WhatsApp
- Uber, Rate Limiter, Key-Value Store
- Search Autocomplete, Notification System, Google Drive

### 4. Data Engineering Roadmap (/de-roadmap)
Complete 4 phases with 16 topics total:
- Phase 1: Foundation (SQL, Python, Data Modeling)
- Phase 2: Core DE (Spark, Airflow, dbt)
- Phase 3: Advanced (Kafka, Delta Lake)
- Phase 4: FAANG-Ready (System Design, Case Studies)

**Features:**
- Expand/collapse each phase
- Click topics to mark complete
- See estimated hours per topic
- Track overall readiness score

### 5. Behavioral Stories (/behavioral)
Build 8 STAR method stories:
- Click any story type to edit
- Fill in Situation, Task, Action, Result (STAR format)
- Result field counts characters (aim for 200+ with metrics)
- Check off completed stories
- Export all stories as JSON backup

**Story Types:**
- Technical Challenge, Conflict Resolution, Ownership
- Failure & Learning, Prioritization, Leadership
- Data-Driven Decision, Customer Impact

### 6. Profile (/profile)
Manage your progress and settings:
- **Edit Profile**: Change name, target company, daily goals
- **View Stats**: Days in program, problems solved, streak record
- **90-Day Timer**: Visual countdown to interview prep completion
- **Data Management**: Export progress as JSON or import from backup

## 💡 Pro Tips

1. **Daily Consistency**: Log something every day to build your streak
2. **One Pattern at a Time**: Master each DSA pattern before moving on
3. **Use RESHADED**: Spend quality time on each system design component
4. **Quantify Impact**: Always include metrics in behavioral stories
5. **Regular Export**: Export your progress weekly as backup
6. **Track Improvement**: Use the daily log to note what you learned

## 📊 Key Metrics to Track

- **DSA**: 250 total problems target
- **System Design**: 8 systems to complete RESHADED for each
- **DE Topics**: 16 topics across 4 phases
- **Behavioral Stories**: 8 complete STAR stories
- **Streak**: Aim for 90-day consecutive days

## 🎯 90-Day Goal Setting

The counter assumes you started today. You have:
- 90 days total
- ~13 weeks
- ~625 hours (assuming 7 hours/day)

**Daily recommendations:**
- 1-2 DSA patterns (medium level)
- 1 system design session (deep dive on RESHADED)
- 1 behavioral story refinement
- 1 DE topic

## 🔄 Data Management

### Export Your Progress
1. Go to Profile page
2. Click "Export All" button
3. JSON file downloads with all your progress
4. Save this file as backup

### Import Your Progress
1. Go to Profile page
2. Click "Import Progress"
3. Select your previously exported JSON file
4. Data restores (check console for status)

**Note:** All data is stored locally in your browser's localStorage. Export regularly!

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + Focus**: Focus on sidebar navigation
- **Tab**: Navigate between elements
- **Enter**: Confirm selections in modals

## 🐛 Troubleshooting

**Progress not saving?**
- Check browser console for errors
- Verify localStorage is enabled
- Try exporting/importing your data

**Streak not updating?**
- Make sure you have an entry in Daily Log
- Refresh the page to sync
- Check that date is correct in your system

**Slow performance?**
- Clear browser cache
- Close other tabs
- Restart the dev server with `npm run dev`

## 🚀 Next Features Coming

- Claude API integration for AI drill and story review
- Supabase backend for cloud sync
- User accounts and authentication
- Mock interview practice interface
- Community leaderboards
- Real-time code execution

## 📞 Getting Help

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify all data is saved to localStorage
3. Try exporting your progress before troubleshooting
4. Restart the dev server: `npm run dev`

---

**Remember: Small daily progress → Big results in 90 days → FAANG interview success! 🔥**
