# JobTrack 💼

> **Track applications. Stay organized. Get hired.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-jobtrack.co.in-2563eb?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.jobtrack.co.in/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-mr--irfan1%2Fjobtrack-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mr-irfan1/jobtrack)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**JobTrack** is an end-to-end job application tracking platform built for modern job seekers. It centralizes job search management into a single, intuitive workspace — featuring a Kanban pipeline board, interview calendar, application activity timeline, notification alerts, and a comprehensive career profile manager.

🌐 **Live Application**: [https://www.jobtrack.co.in/](https://www.jobtrack.co.in/)  
🐙 **GitHub Repository**: [https://github.com/mr-irfan1/jobtrack](https://github.com/mr-irfan1/jobtrack)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
  - [🌐 Public Landing Page](#-public-landing-page-)
  - [📊 Dashboard](#-dashboard--dashboard)
  - [💼 Applications & Details Page](#-applications--details-page--applications--applicationsid)
  - [🔄 Application Pipeline (Kanban Board)](#-application-pipeline-kanban-board--pipeline)
  - [📅 Interviews Calendar](#-interviews-calendar--interviews)
  - [🔔 Notifications System](#-notifications-system--notifications)
  - [👤 Account & Profile Settings](#-account--profile-settings--settings)
  - [🔍 Search Engine Optimization (SEO)](#-search-engine-optimization-seo)
- [Screenshots & Visual Assets](#-screenshots--visual-assets)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [User Journey & Routing Flow](#-user-journey--routing-flow)
- [Environment Setup & Configuration](#-environment-setup--configuration)
- [Local Development & Available Scripts](#-local-development--available-scripts)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [License](#-license)

---

## 🌟 Overview

### The Problem
Searching for a job often involves juggling dozens of applications across multiple job boards, recruiters, and companies. Managing interview dates, follow-ups, resume versions, and application statuses in scattered spreadsheets or email threads leads to missed opportunities and unnecessary stress.

### The Solution
**JobTrack** provides job seekers with a streamlined, visually structured dashboard to track every opportunity from discovery to offer. By combining a 6-stage Kanban board, interview calendar, notification center, and customizable candidate profile into a fast, responsive single-page web app, JobTrack empowers candidates to stay focused and land their target roles.

### Key Benefits
- **Unified Job Hub**: Keep job links, company details, salaries, contacts, and interview notes organized in one database.
- **Visual Progress Tracking**: Drag and view applications across Kanban stages (`Saved`, `Applied`, `Screening`, `Interview`, `Offer`, `Rejected`).
- **Schedule Management**: Never miss a screening call, technical round, or panel interview with an integrated schedule view.
- **Candidate Profile & Portfolio**: Manage personal skills, verified achievements/certifications, and social links (LinkedIn, GitHub, Portfolio).
- **Session-Based Privacy**: Secure user authentication powered by Supabase Auth with server-side session persistence.

---

## ✨ Features

### 🌐 Public Landing Page (`/`)
- **Marketing Presentation**: Visually compelling landing page for signed-out visitors featuring hero copy, feature highlights, stat callouts, and call-to-action triggers.
- **Hero Video Background**: Integrated full-width HTML5 video background with dark gradient overlay, automated loop, and responsive scaling.
- **WebGL Canvas Interaction**: Interactive `SplashCursor` animation effect that responds to pointer movement without blocking navigation clicks (`pointer-events-none`).
- **Intelligent Route Boundary**: Automatically renders `LandingView` to unauthenticated visitors/crawlers and the authenticated `DashboardView` shell to signed-in users at `/`.

### 📊 Dashboard (`/dashboard`)
- **Metric Analytics**: High-level overview cards displaying Total Applications, Active Opportunities, Scheduled Interviews, and Offers Received.
- **Recent Applications Table**: Quick-view widget highlighting recent candidate applications and status indicators.
- **Upcoming Interviews**: Priority sidebar widget detailing upcoming scheduled recruiter calls and technical assessments.

### 💼 Applications & Details Page (`/applications` & `/applications/:id`)
- **Complete Application CRUD**: Create, read, edit, and delete job applications with custom modal forms.
- **Multi-Field Filtering & Search**: Instant real-time filtering by company name, job title, location, or status.
- **Application Details View (`/applications/:id`)**: Dedicated page showcasing full job descriptions, compensation ranges, recruiter contacts, notes, and an interactive **Activity Timeline**.

### 🔄 Application Pipeline (Kanban Board) (`/pipeline`)
- **6-Stage Kanban Board**: Visual columns for `Saved`, `Applied`, `Screening`, `Interview`, `Offer`, and `Rejected`.
- **Responsive Layout**: Horizontal column navigation with custom hidden scrollbars (`.no-scrollbar`) for clean trackpad and touch navigation.
- **Stage Counters**: Real-time headers calculating application counts per column and total active pipeline volume.

### 📅 Interviews Calendar (`/interviews`)
- **Schedule Grid**: Monthly grid layout detailing interview events by date.
- **Event Breakdown**: Comprehensive event cards showing interview type (Technical, HR, Behavioral, System Design), time strings, interviewer names, and prep notes.

### 🔔 Notifications System (`/notifications`)
- **Categorized Alerts**: Filter notifications by `All`, `Unread`, `Applications`, and `Interviews`.
- **Real-Time Badges**: Global header and sidebar counter badges reflecting unread item counts.
- **Persistent Read States**: Instant "Mark all as read" controls with local persistence.

### 👤 Account & Profile Settings (`/settings`)
- **👤 Profile**: Avatar initials generator, Full Name, Headline, Location, Bio editor, and top Profile Summary Card.
- **🛠 Skills**: Skill manager featuring real-time counter (`X / 20`), case-insensitive duplicate prevention, quick suggestions, and tag removal.
- **🏆 Achievements**: Record certifications, awards, hackathons, and competitions with credential URL checks, date sorting, and type badges.
- **🔗 Social Links**: Platform domain validation for LinkedIn (`linkedin.com`), GitHub (`github.com`), Portfolio, X/Twitter, and safe `target="_blank" rel="noopener noreferrer"` external links.
- **⚙️ Preferences**: Instant Theme switcher (`Light` / `Dark` mode), notification switches, target job search preferences, default application status selector, and a confirmation modal for restoring defaults.
- **🔐 Security & Account**: Password updater (8-char min + match check), active session details, secure logout, security tips, and an account deletion modal requiring exact `DELETE` string entry.

### 🔍 Search Engine Optimization (SEO)
- **Production Canonical Origin**: Configured for `https://www.jobtrack.co.in/`.
- **Search Crawling Controls**: Custom `robots.txt` disallowing private routes and `sitemap.xml` listing public endpoints.
- **Structured Data (JSON-LD)**: Static Schema.org `Organization` and `WebSite` JSON-LD metadata embedded in `<head>`.
- **Social Sharing**: Complete Open Graph (`og:image`, `og:title`, `og:description`) and Twitter Card tags.

---

## 🖼 Screenshots & Visual Assets

| Asset | Path | Description |
| :--- | :--- | :--- |
| **Brand Logo** | `/public/assets/logo.png` | Official high-resolution JobTrack application logo |
| **Favicon Icon** | `/public/assets/favicon.ico` | Browser tab icon |
| **Hero Background Video** | `/public/assets/hero.mp4` | High-definition background video for the marketing hero section |

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Core UI component library |
| **TypeScript** | `~6.0.2` | Type-safe application logic |
| **Vite** | `^8.2.2` | Lightning-fast frontend build tool and dev server |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS framework with custom design tokens |
| **@tailwindcss/vite** | `^4.3.3` | Native Vite integration plugin for Tailwind v4 |
| **React Router DOM** | `^7.18.2` | Client-side routing and protected route boundaries |
| **@supabase/supabase-js** | `^2.112.4` | Backend-as-a-Service for Authentication & User Metadata |
| **Oxlint** | `^1.79.0` | Ultra-fast JavaScript/TypeScript code linter |
| **Node.js Test Runner** | `node --test` | Built-in native testing suite |

---

## 📁 Project Architecture

```text
JobTrack/
├── public/
│   ├── assets/                # Static brand images, favicon, and hero video
│   │   ├── favicon.ico
│   │   ├── hero.mp4
│   │   └── logo.png
│   ├── robots.txt             # Search crawler directives
│   └── sitemap.xml            # XML Sitemap for indexing
├── src/
│   ├── auth/                  # Supabase Auth context & session hooks
│   │   ├── AuthContext.ts
│   │   ├── AuthProvider.tsx
│   │   └── useAuth.ts
│   ├── components/            # Shared UI components & layout containers
│   │   ├── AppLayout/         # Main workspace shell layout (Header + Sidebar + Main)
│   │   ├── ApplicationForm/   # Modal form for creating/editing job entries
│   │   ├── ApplicationsToolbar/ # Search & filter toolbar component
│   │   ├── Footer/            # Footer component
│   │   ├── Header/            # Navigation header bar & profile avatar menu
│   │   ├── HomeRoute/         # Intelligent router (Landing vs Authenticated Dashboard)
│   │   ├── JobApplicationCard/# Card representation of a job application
│   │   ├── Notifications/     # Notification dropdown & store helpers
│   │   ├── Panel/             # Reusable card panel container
│   │   ├── RequireAuth/       # Protected route authorization gatekeeper
│   │   ├── Sidebar/           # Responsive navigation sidebar & drawer
│   │   ├── SplashCursor/      # Interactive WebGL canvas visual effect
│   │   ├── StatCard/          # Metric stat card component
│   │   ├── StatusBadge/       # Colored status tag badge
│   │   ├── ThemeToggle/       # Light/Dark mode toggle switch
│   │   ├── icons/             # Custom SVG icon components
│   │   └── landing/           # Landing page marketing components (Hero, Features, CTA)
│   ├── pages/                 # Route-level view modules
│   │   ├── ApplicationDetails/   # Individual job application view (/applications/:id)
│   │   ├── ApplicationPipeline/  # 6-stage Kanban board (/pipeline)
│   │   ├── Applications/         # Applications table list (/applications)
│   │   ├── Dashboard/            # Analytics dashboard overview (/dashboard)
│   │   ├── ForgotPassword/       # Password recovery request (/forgot-password)
│   │   ├── Interviews/           # Scheduled interview calendar (/interviews)
│   │   ├── Login/                # User login page (/login)
│   │   ├── Notifications/        # Notification management workspace (/notifications)
│   │   ├── ResetPassword/        # Password reset execution (/reset-password)
│   │   ├── Settings/             # Account Settings workspace (/settings)
│   │   │   └── components/       # Profile, Skills, Achievements, Social, Prefs, Security
│   │   ├── Signup/               # User registration page (/signup)
│   │   └── VerifyEmail/          # Email verification handler (/verify-email)
│   ├── seo/                   # Route-specific metadata & SEO helpers
│   ├── services/              # Data services (Supabase client, Auth, Applications API)
│   ├── theme/                 # ThemeProvider context (Light / Dark mode persistence)
│   ├── types/                 # TypeScript interfaces & domain models
│   ├── utils/                 # Formatting, date parsing, and helper utilities
│   ├── App.tsx                # React Router v7 routes definition
│   ├── index.css              # Global styles, Tailwind v4 imports & CSS tokens
│   └── main.tsx               # React application entry point
├── index.html                 # HTML shell with static SEO, Google Fonts & JSON-LD
├── package.json               # Project dependencies and script runner definitions
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite configuration with Tailwind CSS plugin
```

---

## 🔄 User Journey & Routing Flow

```text
                           Unauthenticated Visitor
                                      │
                                      ▼
                           🌐 Landing Page (/)
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
           🔑 Login (/login)                     📝 Signup (/signup)
                   │                                     │
                   └──────────────────┬──────────────────┘
                                      │
                        Session Verified via Supabase Auth
                                      │
                                      ▼
                        📊 Authenticated Workspace (/)
                                      │
    ┌───────────────┬─────────────────┼─────────────────┬───────────────┐
    ▼               ▼                 ▼                 ▼               ▼
💼 Applications   🔄 Pipeline     📅 Interviews    🔔 Notifications   👤 Settings
(/applications)  (/pipeline)      (/interviews)    (/notifications)   (/settings)
    │                                                                   │
    ▼                                                                   ▼
🔍 Details Page                                              Profile, Skills, Social,
(/applications/:id)                                          Preferences & Security
```

---

## 🔑 Environment Setup & Configuration

JobTrack uses Supabase for authentication and database management. To run the project locally, you need to set up your environment variables.

1. Create a `.env` file in the project root directory:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. Retrieve your **Supabase URL** and **Anon Key** from your [Supabase Project Settings](https://supabase.com/dashboard).

---

## 🚀 Local Development & Available Scripts

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mr-irfan1/jobtrack.git
   cd JobTrack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173/` in your browser.

### Command Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR |
| `npm test` | Runs the Node.js native unit test suite |
| `npm run lint` | Audits TypeScript and JSX code using `oxlint` |
| `npm run build` | Compiles TypeScript (`tsc -b`) and builds production bundle |
| `npm run preview` | Previews the production build locally from `dist/` |

---

## 🧪 Testing & Quality Assurance

JobTrack includes a lightweight, native unit testing setup built on top of Node.js test runner (`node --test`).

### Run Unit Tests
```bash
npm test
```
- **Tests Passed**: 222 / 222 tests
- **Coverage Areas**: Validation logic, URL safety, authentication redirects, status mappings, theme initialization, and SEO metadata.

### Code Quality & Linting
```bash
npm run lint
```
- Powered by **Oxlint** for instant linting across JavaScript and TypeScript files.
- **Status**: 0 errors, 0 warnings across all workspace files.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p center>
  Developed with ❤️ by <a href="https://github.com/mr-irfan1">M R Irfan</a> &bull; Live at <a href="https://www.jobtrack.co.in/">jobtrack.co.in</a>
</p>
