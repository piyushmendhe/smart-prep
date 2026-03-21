# SMART PREP - FAANG Interview Prep Tracker

A production-ready interview prep tracker built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion. Master DSA, System Design, Data Engineering, and Behavioral interviews in 90 days.

## ✨ Features

### 🎯 Dashboard
- **GitHub-style contribution heatmap** - Last 90 days activity visualization
- **Animated streak counter** - Track your consistency with dynamic fire icons
- **Progress rings** - Visual indicators for DSA, System Design, DE Roadmap, and Behavioral stories
- **Today's focus** - AI-guided preparation tasks
- **Daily log** - Record what you accomplished each day
- **Statistics** - Total problems solved, days active, mock interviews, stories written

### 💻 DSA Track (15 Patterns)
- **Expandable pattern cards** - Two Pointers, Sliding Window, Fast & Slow Pointers, Merge Intervals, Cyclic Sort, In-place Reversal, BFS, DFS, Two Heaps, Backtracking, Binary Search, Top K Elements, K-way Merge, Dynamic Programming, Union Find
- **250 total problems** - Carefully curated across all difficulty levels
- **Interactive checkboxes** - Mark problems as solved
- **Filter system** - Easy, Medium, Hard, or All
- **Progress tracking** - Visual progress bars and percentage completion
- **Difficulty badges** - Easy (Green), Medium (Yellow), Hard (Red)

### 🏗️ System Design (10 Systems)
- **RESHADED framework checklist** - Requirements, Estimation, Storage, High-Level Design, APIs, Deep Dive, Edge Cases, Discussion
- **10 critical systems** - URL Shortener, Twitter Feed, YouTube, WhatsApp, Uber, Rate Limiter, Key-Value Store, Search Autocomplete, Notification System, Google Drive
- **Modal interface** - Clean, focused editing experience
- **Status tracking** - Not Started, In Progress, Done
- **Progress indicators** - Visual dots showing RESHADED completion

### 📊 Data Engineering Roadmap (4 Phases)
- **Phase 1: Foundation** - SQL Mastery, Python for Data, Data Modeling, Cloud Basics
- **Phase 2: Core DE** - Apache Spark, Apache Airflow, dbt, Data Warehousing
- **Phase 3: Advanced** - Kafka & Streaming, Delta Lake/Iceberg, Distributed Systems, Performance Tuning
- **Phase 4: FAANG-Ready** - System Design for DE, DE Interview Patterns, SQL Hard Problems, Case Studies
- **16 total topics** - Comprehensive DE curriculum
- **Timeline visualization** - Progress through each phase
- **Detailed subtopics** - Estimated hours for each topic

### 🎤 Behavioral Stories (8 STAR Types)
- **Technical Challenge** - Overcame complex problems
- **Conflict Resolution** - Resolved team disagreements
- **Ownership** - Took initiative beyond responsibilities
- **Failure & Learning** - Failed, learned, improved
- **Prioritization** - Made impactful decisions
- **Leadership/Mentoring** - Guided team members
- **Data-Driven Decision** - Decisions backed by metrics
- **Customer Impact** - Improved customer experience
- **Character counting** - Push for quantified impact in Result field
- **Modal editing** - Full STAR story crafting

### 👤 Profile & Settings
- **Personalization** - Name, target company, daily goals
- **Statistics dashboard** - Days in program, problems solved, streak record, systems designed
- **90-day countdown** - Visual timer to interview day
- **Data export** - Download all progress as JSON
- **Data import** - Restore progress from backup
- **Settings panel** - Customize your prep journey

## 🎨 Design System

### Colors
- **Background**: `#0a0a0f` - Deep navy
- **Cards**: `#12121a` - Slightly lighter navy
- **Accent**: `#00d4ff` - Cyan (primary action)
- **Secondary**: `#ff6b6b` - Red (highlights)
- **Success**: `#00ff88` - Green (completion)
- **Muted**: `#808080` - Gray (secondary text)

### Typography
- **Headings**: Space Grotesk (600-700 weight)
- **Body**: Inter (400-600 weight)

### Components
- **Glassmorphism cards** - Semi-transparent with backdrop blur
- **Smooth animations** - Framer Motion throughout
- **Dark theme** - Easy on the eyes for long study sessions
- **Responsive design** - Works on all screen sizes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd smart-prep

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 📁 Project Structure

```
smart-prep/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Dashboard
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── dsa/page.tsx            # DSA Track
│   ├── system-design/page.tsx   # System Design
│   ├── de-roadmap/page.tsx      # DE Roadmap
│   ├── behavioral/page.tsx      # Behavioral Stories
│   └── profile/page.tsx         # Profile & Settings
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── Header.tsx           # Top header with streak
│   └── ui/
│       └── components.tsx       # Reusable UI components
├── hooks/
│   └── useProgress.ts           # State management hook
├── lib/
│   └── heatmap.ts               # Heatmap generation utility
├── package.json
├── tsconfig.json
└── tailwind.config.mjs
```

## 💾 State Management

All state is managed locally with the `useProgress` hook, which persists to `localStorage`.

## 🎬 Animations

- **Page transitions** - Fade + slide up on enter
- **Card stagger** - Children animate with 50ms delay
- **Progress rings** - Circumference animation
- **Streak counter** - Number roll animation
- **Heatmap** - Staggered fade-in of cells
- **Modals** - Scale + fade
- **Interactive elements** - Hover animations and scale effects

## 📱 Responsive Design

- **Sidebar** - Fixed left navigation (256px)
- **Content area** - Scrollable main content
- **Mobile-friendly** - Adapts to smaller screens
- **Grid layouts** - Responsive column counts

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom theme
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Space Grotesk, Inter (Google Fonts)
- **Storage**: localStorage (Supabase-ready)

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

**Built with 🔥 for FAANG interviews. 90 days to your dream role.**
