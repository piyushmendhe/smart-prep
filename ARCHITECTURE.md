# SMART PREP Architecture & Development Guide

## System Architecture

```
┌─────────────────────────────────────────────┐
│         Next.js 14 (App Router)             │
│  ├── Layout (Sidebar + Header)              │
│  ├── Dashboard (/)                          │
│  ├── DSA Track (/dsa)                       │
│  ├── System Design (/system-design)         │
│  ├── DE Roadmap (/de-roadmap)               │
│  ├── Behavioral (/behavioral)               │
│  └── Profile (/profile)                     │
├─────────────────────────────────────────────┤
│     useProgress Hook (State Management)     │
│     └── localStorage Persistence            │
├─────────────────────────────────────────────┤
│    Styling & Animations                     │
│    ├── Tailwind CSS 4 (custom theme)        │
│    ├── Framer Motion (animations)           │
│    └── Google Fonts                         │
└─────────────────────────────────────────────┘
```

## Component Hierarchy

```
Layout
├── Sidebar
│   └── Navigation with icons
├── Header
│   ├── Date display
│   └── Streak counter
└── Main Content
    ├── PageContainer (wrapper)
    ├── GlassCard (reusable)
    ├── ProgressRing (progress display)
    ├── DifficultyBadge (tags)
    └── Modals
```

## State Flow

```
useProgress Hook
├── Read: getHeatmapData(), get all data
├── Write:
│   ├── toggleProblemSolved(patternId, problemId)
│   ├── updateDailyLog(content)
│   ├── updateSystemStatus(systemId, status)
│   ├── updateSystemReshaded(systemId, key, value)
│   ├── updateBehavioralStory(storyId, storyData)
│   ├── toggleTopicCompletion(topicId)
│   ├── updateSettings(settings)
│   └── exportData()
└── Persist: localStorage[STORAGE_KEY]
```

## File Organization

### By Feature
```
DSA Feature
├── app/dsa/page.tsx (component)
├── Patterns data (inline in page)
└── Problem checking via useProgress

System Design Feature
├── app/system-design/page.tsx (component)
├── Systems data (inline in page)
├── Modal for RESHADED editing
└── Status tracking via useProgress

DE Roadmap Feature
├── app/de-roadmap/page.tsx (component)
├── Phases & Topics data (inline in page)
├── Expandable timeline UI
└── Topic completion via useProgress

Behavioral Feature
├── app/behavioral/page.tsx (component)
├── Story types data (inline in page)
├── Modal for STAR editing
└── Export functionality
```

### Shared Components
```
components/
├── layout/
│   ├── Sidebar.tsx (navigation)
│   └── Header.tsx (top bar)
└── ui/
    └── components.tsx (PageContainer, GlassCard, ProgressRing, etc.)

hooks/
└── useProgress.ts (complete state management)

lib/
└── heatmap.ts (heatmap generation utilities)
```

## Data Modeling

### localStorage Structure
```typescript
{
  // DSA Progress
  dsa: {
    solvedProblems: ["pattern-id-problem-id", ...],
    patternNotes: { patternId: "notes..." }
  },
  
  // System Design Progress
  systemDesign: {
    systems: {
      "url-shortener": {
        id, name, concept, week, status,
        reshaded: { requirements, estimation, storage, ... },
        notes: ""
      }
    }
  },
  
  // DE Roadmap
  deRoadmap: {
    completedTopics: ["sql-mastery", "python-data", ...]
  },
  
  // Behavioral Stories
  behavioral: {
    stories: {
      "technical-challenge": {
        situation: "", task: "", action: "", result: "",
        completed: false
      }
    }
  },
  
  // Activity
  dailyLogs: { "2024-03-18": "Solved 3 problems...", ... },
  
  // Streak
  streak: {
    current: 5,
    longest: 12,
    lastActive: "2024-03-18"
  },
  
  // Settings
  settings: {
    name: "User Name",
    targetCompany: "FAANG",
    startDate: "2024-03-18",
    dailyGoal: 5
  }
}
```

## Animation Patterns

### Used Throughout App
1. **Page Enter**: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
2. **Stagger Children**: `transition={{ delay: index * 0.05 }}`
3. **Progress Rings**: `strokeDashoffset` animation
4. **Numbers**: Scale animation on change `initial={{ scale: 0.8 }}` → `animate={{ scale: 1 }}`
5. **Modals**: Scale + fade `initial={{ scale: 0.9, opacity: 0 }}`
6. **Streak animates**: `animate={{ scale: [1, 1.1, 1] }}`

## Styling System

### Tailwind Customization
```css
/* In globals.css */
:root {
  --background: #0a0a0f,
  --card: #12121a,
  --accent: #00d4ff,
  --secondary: #ff6b6b,
  --success: #00ff88,
  --foreground: #e0e0e0,
  --muted: #808080
}

/* Applied via @theme inline */
```

### Common Classes
- `bg-background` - Page background
- `bg-card` - Card background
- `text-accent` - Primary text color
- `border-neutral-700` - Card borders
- `hover:border-accent` - Interactive borders

## Performance Optimizations

1. **Lazy Expandable Cards**: Content only rendered when expanded (DSA, DE)
2. **Memoization**: `useMemo` for filtered patterns in DSA
3. **Animation Performance**: Framer Motion `transition.type: "tween"`
4. **localStorage Caching**: Data loaded once on mount
5. **Modal Rendering**: AnimatePresence for cleanup

## Common Patterns

### Adding a New Page
1. Create `app/[route]/page.tsx`
2. Use `PageContainer` wrapper
3. Integrate `useProgress` hook
4. Use `GlassCard` for sections
5. Add animations with Framer Motion

### Adding a New Feature to Existing Page
1. Add data structure to `useProgress` hook
2. Add update function to hook
3. Create component in page file
4. Use `GlassCard` wrapper
5. Add animations

### Modal Pattern
```tsx
const [modal, setModal] = useState<Modal>({ id: null });

// In JSX
<AnimatePresence>
  {modal.id && (
    <motion.div onClick={() => setModal({ id: null })}>
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

## Testing Checklist

- [ ] All pages load without errors
- [ ] Sidebar navigation works
- [ ] Streak updates daily
- [ ] DSA problems mark as solved/unsolved
- [ ] System design modals open/close
- [ ] DE topics expandable
- [ ] Behavioral stories editable
- [ ] Data exports as JSON
- [ ] Data imports from JSON
- [ ] Animations smooth and performant
- [ ] localStorage persists between reloads
- [ ] Dark theme applies consistently
- [ ] All forms submit without errors
- [ ] Progress calculations accurate

## Future Enhancement Points

### Phase 1: Backend
```typescript
// Replace localStorage with Supabase
// - User authentication
// - Cloud persistence
// - Real-time sync
```

### Phase 2: AI Integration
```typescript
// Claude API
// - Drill Me button (generate interview questions)
// - Review with AI (story feedback)
// - Problem recommendations
```

### Phase 3: Advanced Features
```typescript
// - Mock interview sessions
// - Real-time code execution
// - Community leaderboards
// - Peer code review
// - Group study sessions
```

## Debugging Tips

1. **Check localStorage**: `console.log(localStorage.getItem('smart-prep-progress'))`
2. **Framer Motion debug**: Use `transition={{ when: "beforeChildren" }}`
3. **Component boundaries**: Use React DevTools Profiler
4. **Animation smoothness**: Check FPS in DevTools > Performance

## Build & Deployment

### Local Development
```bash
npm run dev      # Starts on port 3000
```

### Production Build
```bash
npm run build    # Creates optimized build
npm start        # Runs production server
```

### Deployment Platforms
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Self-hosted** (Docker/PM2)

## Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code standards
- **No Prettier config**: Standard formatting
- **Error handling**: Try-catch on localStorage operations

---

**Last Updated**: March 18, 2026
**Status**: Production Ready ✅
