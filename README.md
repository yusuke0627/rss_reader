# ✨ Lumina Reader

<div align="center">
  <img src="https://github.com/yusuke0627/rss_reader/blob/main/.github/assets/demo.webp?raw=true" alt="Lumina Reader Demo" width="800"/>
  <p><strong>A beautifully crafted, AI-powered RSS Reader for the modern web.</strong></p>
</div>

---

## 🌟 For People (Overview & Features)

**Lumina Reader** is not just another RSS reader; it's a carefully designed news consumption experience. We believed that reading your daily feeds should be as beautiful as browsing a high-end magazine, but with the power of modern AI.

Whether you are a casual reader or a power user following hundreds of tech blogs, Lumina Reader provides a clean, distraction-free environment that puts the content first.

### ✨ Key Features:
- 🎨 **Minimalist & Premium UI**: Designed with a focus on typography, spacing, and subtle micro-animations using Framer Motion and modern CSS. Dark mode is deeply integrated for comfortable reading.
- 🤖 **AI Summarization**: Too long; didn't read? Lumina integrates with Google's Gemini AI to provide instant, high-quality summaries of any article with a single click.
- 🏷️ **Smart Tagging System**: Organize your knowledge. Create custom tags, assign them to articles, and quickly filter your inbox.
- 🔍 **Discover New Content**: Don't know what to read? Our curated 'Discover' section helps you find and subscribe to top-tier feeds across tech, design, and news.
- 📱 **Fully Responsive**: A seamless experience reading from your desktop monitor down to your mobile phone.

*(To Recruiters: This project demonstrates a strong command of modern React, Next.js App Router, state management, and edge-ready database integration, all wrapped in a highly polished UX.)*

---

## 🛠 For Developers

Welcome to the codebase! If you are interested in how Lumina Reader is built, or want to contribute, here is everything you need to know.

### 🏗 Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Framer Motion
- **State Management**: Zustand (Client UI State) & React Query (@tanstack/react-query) for Server State
- **Database**: [Turso](https://turso.tech/) (libSQL / SQLite)
- **AI Integration**: Google Generative AI (Gemini)
- **Auth**: NextAuth.js (v5 beta)

### 🧩 Architecture Overview
This project follows a pragmatic variation of **Clean Architecture**, adapted for Next.js App Router:

```
src/
├── app/               # Next.js App Router endpoints & page entry points
├── application/       # Use Cases (Business Rule orchestration)
├── domain/            # Core Domain Models & Repository Interfaces
├── infrastructure/    # Concrete Implementations (Turso Repositories, RSS Fetchers, AI Services)
├── interface/         # Controllers (API Route Handlers) & UI Components
│   ├── http/          # API Controllers mapping requests to Use Cases
│   └── ui/            # React Components, Hooks, and Client Stores
└── types/             # Global TypeScript definitions
```
*Why this structure?* It separates our core reasoning (domain/application) from the framework mechanisms (app/interface), making testing easier and allowing us to swap out infrastructure (like switching from SQLite to Postgres) with minimal friction.

### 🚀 Getting Started

#### 1. Setup Environment
Clone the repository and install dependencies:
```bash
git clone https://github.com/yusuke0627/rss_reader.git
cd rss_reader
npm install
```

Copy the environment template:
```bash
cp .env.example .env.local
```
*Note: You will need to provide your own Google Gemini API key and setup NextAuth if you wish to run those features locally.*

#### 2. Database Setup (Local)
By default, the `.env.local` is configured to use a local SQLite file (`TURSO_DATABASE_URL=file:local.db`).
Initialize the database schema:
```bash
npm run db:setup
```

#### 3. Execution Environments

**Development:**
```bash
npm run dev
# Starts the local development server on http://localhost:3000
```

**Production Build:**
```bash
npm run build
npm start
```

**Testing:**
```bash
npm run test
# Runs Vitest suite manually
npm run test:watch
# Runs Vitest in watch mode for active development
```

### 🤝 Contributing
**Feel free to open Issues or Pull Requests!**
Whether it's a bug fix, a new feature idea, or a UI polish, contributions are warmly welcomed. Please check the existing branch naming conventions (e.g., `feature/issue-XX-name`) if you are picking up an issue.

---
*Built with ❤️ for a better reading experience.*
