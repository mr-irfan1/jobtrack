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
- [🧠 Build Prompts](#-build-prompts)
- [🤖 How AI Assisted](#-how-ai-assisted)
- [🛠️ Manual Improvements & Corrections](#%EF%B8%8F-manual-improvements--corrections)
- [🔍 Verification](#-verification)
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

## 🧠 Build Prompts

> **Note:** The prompts below are reconstructed from the implemented work, project structure, and development history where the original prompt text was not preserved.

AI coding assistants were used throughout development for planning, architecture, component creation, refactoring, UI/UX polish, unit testing, SEO optimization, and documentation.

### Prompt 01 — Project Foundation
**Goal:** Establish initial application architecture using React 19, Vite 8, TypeScript, and Tailwind CSS v4.  
**Prompt:**
> "Build a modern job application tracking web application called JobTrack. Use React, Vite, TypeScript and Tailwind CSS. Establish a clean and scalable project structure. Create the foundation for authentication, dashboard, applications, reusable components and responsive layouts."

**AI assistance:**
- Scaffolded modular directory tree (`components/`, `pages/`, `services/`, `types/`, `utils/`).
- Configured Vite and Tailwind CSS build setup.

**Manual improvements:**
- Verified TypeScript configuration in `tsconfig.json` and strict type checks.
- Verified local dev server initialization (`npm run dev`).

---

### Prompt 02 — Initial Dashboard & Application Structure
**Goal:** Build main dashboard layout with key statistics cards and recent application overview.  
**Prompt:**
> "Build the JobTrack dashboard using the existing design system. Provide a clear overview of application statistics, pipeline information, recent applications, and upcoming interviews. Ensure responsiveness across desktop, tablet and mobile."

**AI assistance:**
- Designed overview stat cards (`Total Applications`, `Active`, `Interviews`, `Offers`).
- Created dashboard panels and grid layouts.

**Manual improvements:**
- Connected dashboard directly to persistent storage API (`applicationService.ts`).
- Adjusted responsive column grid breakpoints for mobile screens.

---

### Prompt 03 — Authentication & Route Protection
**Goal:** Implement Supabase Auth integration, session management, protected routes, and auth redirects.  
**Prompt:**
> "Implement authentication for JobTrack using Supabase Auth. Support Sign Up, Login, Logout, Forgot Password, Reset Password, and Email Verification. Protect authenticated application routes using a central AuthContext and RequireAuth gatekeeper."

**AI assistance:**
- Created Auth Context (`useAuth`), Supabase service wrappers (`authService.ts`), and route gatekeepers.
- Implemented authentication page views (`LoginView`, `SignupView`, `ForgotPasswordView`, etc.).

**Manual improvements:**
- Added robust password validation rules and friendly error message mappers.
- Prevented unauthenticated loading state flashes during startup.

---

### Prompt 04 — Job Application Management (CRUD)
**Goal:** Implement job application creation, editing, deletion, multi-field search, and status filtering.  
**Prompt:**
> "Implement the Applications section for JobTrack. Users should be able to view, add, edit, delete, search, and filter job applications by status. Reuse existing database schema and status definitions."

**AI assistance:**
- Created `ApplicationsView`, `ApplicationsToolbar`, and modal form dialogs.
- Implemented real-time string search filtering company name, job title, and location.

**Manual improvements:**
- Wrote explicit camelCase ↔ snake_case conversion helpers (`rowToApplication`, `applicationToInsertRow`).
- Implemented delete confirmation modals to prevent accidental deletion.

---

### Prompt 05 — Dashboard Navigation Improvements
**Goal:** Add responsive navigation tabs for Dashboard, Applications, Pipeline, Interviews, and Notifications.  
**Prompt:**
> "Add navigation tabs to the existing JobTrack dashboard (Dashboard, Applications, Application Pipeline, Interviews, Notifications). Make the navigation fully responsive and consistent with the existing JobTrack design system."

**AI assistance:**
- Updated `Sidebar.tsx` and mobile navigation drawers.
- Added active route highlighting.

**Manual improvements:**
- Ensured active route matching works for nested routes like `/applications/:id`.
- Tested mobile sidebar backdrop blur and touch dismiss.

---

### Prompt 06 — Applications Tab & Details Page
**Goal:** Implement individual Application Details view (`/applications/:id`) with company overview, notes, and activity timeline.  
**Prompt:**
> "Add a detailed view for individual job applications at /applications/:id. Show application overview, job title, company, salary, location, job description, recruiter contacts, and an interactive activity timeline."

**AI assistance:**
- Created `ApplicationDetailsView.tsx` with activity log entries.
- Connected route parameter `:id` to application lookup service.

**Manual improvements:**
- Handled missing optional fields gracefully with fallbacks.
- Connected application links from Kanban board and Dashboard cards.

---

### Prompt 07 — Application Pipeline (Kanban Board)
**Goal:** Transform Application Pipeline into a 6-stage Kanban board with stage counters.  
**Prompt:**
> "Transform the Application Pipeline section into a responsive Kanban board. Use the existing statuses (Saved, Applied, Screening, Interview, Offer, Rejected). Display applications in their corresponding columns with stage counters."

**AI assistance:**
- Created `ApplicationPipelineView.tsx` with 6 horizontal columns.
- Calculated stage counts and total active pipeline volume.

**Manual improvements:**
- Added custom `.no-scrollbar` styling rules in `index.css` to hide WebKit scrollbars while preserving trackpad scrolling.
- Ensured column mapping handles empty statuses cleanly.

---

### Prompt 08 — Interviews & Calendar
**Goal:** Build a responsive calendar interface under `/interviews` for tracking scheduled interviews.  
**Prompt:**
> "Add a fully responsive calendar interface to the Interviews tab. Allow users to view scheduled interviews by date, format (Technical, HR, Behavioral), time, and interviewer notes."

**AI assistance:**
- Built `InterviewsView.tsx` with monthly date cell grid and event breakdown lists.
- Added format tag badges and interview time display.

**Manual improvements:**
- Added date parsing helpers to handle browser timezone offsets cleanly.
- Added empty states for days with no scheduled interviews.

---

### Prompt 09 — Notifications System
**Goal:** Build notification workspace with category filters and unread state management.  
**Prompt:**
> "Implement the Notifications tab using the existing notification system. Support category filters (All, Unread, Applications, Interviews), real-time unread badges, and Mark All As Read controls."

**AI assistance:**
- Built `NotificationsView.tsx`, unread counter badges, and store utilities.
- Added filter category tabs (`All`, `Unread`, `Applications`, `Interviews`).

**Manual improvements:**
- Persisted read notification IDs in localStorage so read states survive page refreshes.
- Synchronized unread badges across header and sidebar.

---

### Prompt 10 — User Account & Profile Settings Foundation
**Goal:** Create Account Settings area (`/settings`) with navigation rail and profile editor.  
**Prompt:**
> "Create a professional Account Settings area at /settings. Organize navigation tabs for Profile, Skills, Achievements, Social Links, Preferences, and Security. Implement the Profile section with avatar initials and bio editor."

**AI assistance:**
- Created `SettingsView.tsx` layout shell and `ProfileSettingsSection.tsx`.
- Built summary card showing name, headline, email, and avatar initials.

**Manual improvements:**
- Persisted profile updates server-side in Supabase Auth `user_metadata`.
- Added read-only email display and validation.

---

### Prompt 11 — Skills and Achievements Management
**Goal:** Implement real-time skills manager and achievements/certifications tracker in Settings.  
**Prompt:**
> "Add Skills and Achievements management to Settings. Users should be able to manage professional skills (max 20, duplicate prevention, suggestions) and achievements/certifications with date sorting and type badges."

**AI assistance:**
- Built `SkillsSettingsSection.tsx` and `AchievementsSettingsSection.tsx`.
- Added controlled achievement types (`Certification`, `Award`, `Hackathon`, `Course`, `Competition`, etc.).

**Manual improvements:**
- Enforced case-insensitive duplicate checking for skills.
- Added URL scheme check (`http://` or `https://`) for achievement credential links.

---

### Prompt 12 — LinkedIn / GitHub / Professional Profile Links
**Goal:** Implement social links manager for LinkedIn, GitHub, Portfolio, and X/Twitter in Settings.  
**Prompt:**
> "Implement Social Links inside /settings. Allow users to add professional links (LinkedIn, GitHub, Portfolio, X/Twitter). Enforce platform domain validation and safe external link opening (target="_blank" rel="noopener noreferrer")."

**AI assistance:**
- Created `SocialLinksSettingsSection.tsx` with platform status badges (`✓ Connected` / `Optional`).
- Displayed saved links in Profile summary card (`LinkedIn ↗`, `GitHub ↗`, `Portfolio ↗`).

**Manual improvements:**
- Added domain-specific validation (e.g. requiring `linkedin.com` for LinkedIn, `github.com` for GitHub).
- Ensured external links use `rel="noopener noreferrer"`.

---

### Prompt 13 — Responsive UI & Accessibility Improvements
**Goal:** Refine responsive layouts, touch target sizing, keyboard focus states, and ARIA labels.  
**Prompt:**
> "Review the entire JobTrack application for responsive layout quality, touch target sizing, keyboard navigation, focus indicators, and ARIA labels. Ensure zero horizontal overflow on mobile viewports."

**AI assistance:**
- Applied responsive Tailwind utility classes (`sm:`, `md:`, `lg:`).
- Added `aria-label` tags and focus ring utilities.

**Manual improvements:**
- Adjusted mobile sidebar drawer z-indexes.
- Ensured form modal backdrops blur background content smoothly.

---

### Prompt 14 — Public Landing Page Implementation
**Goal:** Convert root route `/` into a public marketing landing page while preserving authenticated dashboard behavior.  
**Prompt:**
> "Turn the root route / into a public JobTrack landing page for signed-out visitors. Authenticated users must continue seeing the existing dashboard at /. Create a hero section with video background, feature highlights, and CTA buttons."

**AI assistance:**
- Built `HomeRoute.tsx` smart router and `LandingView.tsx`.
- Integrated video background and feature showcase sections.

**Manual improvements:**
- Verified route boundary to ensure authenticated users are served `DashboardView` directly inside `AppLayout`.

---

### Prompt 15 — SEO Implementation & Metadata
**Goal:** Implement site-wide SEO metadata, Open Graph tags, canonical links, and title/description hooks.  
**Prompt:**
> "Implement a complete SEO foundation for JobTrack using production domain https://www.jobtrack.co.in/. Add page titles, meta descriptions, Open Graph, Twitter Cards, and canonical tags for public routes without adding heavy external dependencies."

**AI assistance:**
- Configured static `<head>` metadata in `index.html`.
- Created route-specific document title and description hooks.

**Manual improvements:**
- Verified canonical URLs point strictly to production `https://www.jobtrack.co.in/`.

---

### Prompt 16 — Sitemap and robots.txt
**Goal:** Create `robots.txt` crawler directives and `sitemap.xml` listing indexable public routes.  
**Prompt:**
> "Create public/robots.txt and public/sitemap.xml for JobTrack. Only include public indexable pages (landing page, signup) and disallow private authenticated application routes."

**AI assistance:**
- Generated `public/robots.txt` and `public/sitemap.xml`.

**Manual improvements:**
- Verified private paths (`/applications`, `/settings`, `/forgot-password`) are disallowed in `robots.txt`.

---

### Prompt 17 — JSON-LD / Structured Data
**Goal:** Embed Schema.org structured data in `index.html`.  
**Prompt:**
> "Add valid JSON-LD structured data to index.html using Schema.org Organization and WebSite schema. Only include verifiable site details."

**AI assistance:**
- Created JSON-LD script block in `<head>`.

**Manual improvements:**
- Placed JSON-LD statically in HTML so search crawlers parse it without executing JS.

---

### Prompt 18 — Unit Testing Setup
**Goal:** Write native unit tests covering validation, auth helpers, SEO, and storage mappings.  
**Prompt:**
> "Write unit tests for JobTrack using Node.js native test runner (node --test). Cover form validation rules, auth error mapping, theme resolution, application status conversion, and SEO metadata."

**AI assistance:**
- Scaffolded unit test files (`*.test.ts`).

**Manual improvements:**
- Expanded test assertions to achieve 222 passing tests.

---

### Prompt 19 — Build and Lint Verification
**Goal:** Verify codebase quality using Oxlint, TypeScript compiler, and Vite build.  
**Prompt:**
> "Inspect the codebase with oxlint and verify TypeScript compilation and Vite build with tsc -b && vite build. Resolve any lint warnings or type errors."

**AI assistance:**
- Resolved unused import warnings and type checks.

**Manual improvements:**
- Verified 0 lint errors/warnings across all 168 workspace files.

---

### Prompt 20 — Documentation & README
**Goal:** Create a comprehensive, recruiter-ready project README.md documenting architecture, features, setup, and prompts.  
**Prompt:**
> "Create a professional README.md for JobTrack. Document project overview, real features, tech stack, directory structure, user journey, setup instructions, testing setup, build prompts, and manual refactoring improvements."

**AI assistance:**
- Drafted structured markdown sections.

**Manual improvements:**
- Verified all technical details against `package.json` and live source files.

---

## 🤖 How AI Assisted

AI coding tools were used throughout the development lifecycle to streamline construction, refactoring, and quality assurance:

- **Architecture & Planning**: AI assisted in establishing modular directory trees, separating UI components from auth/storage services, and setting up protected routing boundaries.
- **Component Drafting & Styling**: AI helped generate initial JSX structures, Tailwind CSS utility classes, and accessible form controls.
- **Debugging & Error Diagnosis**: AI assisted in analyzing TypeScript errors, resolving Supabase session state edge cases, and debugging route redirects.
- **Unit Testing Suite**: AI assisted in scaffolding unit test suites covering form validation, status conversions, and SEO metadata.
- **Build & Lint Optimization**: AI helped identify unused imports and type mismatches checked by Oxlint and the TypeScript compiler.
- **SEO & Web Standards**: AI assisted in creating JSON-LD schemas, sitemaps, Open Graph tags, and crawler directives.
- **Human Supervision & Review**: Every AI proposal was manually reviewed, tested, corrected, and verified against the live application codebase.

---

## 🛠️ Manual Improvements & Corrections

Key manual engineering improvements and corrections made during code review and refinement include:

1. **Type-Safe Storage Transformation**:
   - Wrote explicit camelCase ↔ snake_case conversion functions (`rowToApplication`, `applicationToInsertRow`) to keep React components type-safe without leaking database column conventions into UI props.
2. **Unified Theme State Management**:
   - Refactored Settings Preferences to consume the top-level `useTheme()` context directly, preventing state desynchronization between top-bar toggles and settings switches.
3. **URL & Security Protocol Hardening**:
   - Added explicit `http://` / `https://` scheme validation for achievement credential URLs and social links to prevent unsafe protocol execution (`javascript:`). Enforced `rel="noopener noreferrer"` on all external links.
4. **WebGL Canvas Event Passthrough**:
   - Applied `pointer-events-none` to the `SplashCursor` canvas overlay so visual background animations never block button clicks or navigation links.
5. **SEO & Indexing Boundary Protection**:
   - Verified that private authenticated routes (`/applications`, `/settings`) are disallowed in `robots.txt` and excluded from `sitemap.xml`.
6. **Account Deletion Safety Dialog**:
   - Built a confirmation modal requiring typing exact string `DELETE` to prevent accidental account deletion without exposing backend service-role credentials.

---

## 🔍 Verification

The JobTrack codebase is continuously verified using native testing, Oxlint, and TypeScript compilation:

```bash
# Run unit test suite (222 tests)
npm test

# Run Oxlint high-performance linter
npm run lint

# Type-check and compile production build
npm run build
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/mr-irfan1">M R Irfan</a> &bull; Live at <a href="https://www.jobtrack.co.in/">jobtrack.co.in</a>
</p>
