# OSCAR

Oscar looks after your preparation.

A personal study assistant for tracking structured learning, staying consistent, and improving quietly over time.

## Features

- **Learning Sheet**: Track progress through Striver's SDE Sheet (191 questions)
- **Progress Tracking**: Overall completion, topic-wise progress, and proficiency tracking
- **Sunday Tests**: Generate tests from completed questions (Sundays only)
- **Offline-First**: Works offline with IndexedDB, syncs when online
- **Oscar's Presence**: Subtle, calm system messages to guide your learning

## Tech Stack

- Next.js 16 (App Router) + React 19
- Firebase (Auth + Firestore)
- IndexedDB (offline storage)
- Tailwind CSS (minimal, elegant UI)
- TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for production)

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd oscar
```

2. Install dependencies

```bash
npm install
```

3. Set up Firebase

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Alternatively, you can update `/src/lib/firebase/config.ts` directly with your Firebase configuration.

4. Seed Questions Data

The app needs the Striver's SDE Sheet questions data. You have two options:

**Option A: Use the provided JSON structure**

- Extract all 191 questions from [Striver's SDE Sheet](https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems)
- Format them as JSON following the structure in `data/strivers-sde-sheet.json`
- Update `data/strivers-sde-sheet.json` with all questions

**Option B: Seed directly to Firestore**

- Once you have the questions data, run the seed script:

```bash
npx ts-node scripts/seed-questions.ts
```

Note: The seed script requires Firebase credentials to be set up first.

5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(main)              # Main app routes
    /sheet            # Learning sheet page
    /progress         # Progress dashboard
    /test             # Sunday test generator
    /settings         # Settings and data export
  layout.tsx          # Root layout
  page.tsx            # Home (redirects to /sheet)

/src
  /components
    /ui               # Centralized, swappable UI components
    /sheet           # Question-related components
    /progress        # Progress components
    /test            # Test components
    /oscar           # Oscar's presence system
    /layout          # Layout components

  /features
    /questions       # Question feature logic
    /progress        # Progress feature logic
    /test            # Test feature logic
    /sync            # Sync mechanism

  /lib
    /firebase        # Firebase configuration and services
    /storage         # IndexedDB wrapper
    /utils           # Utility functions

  /types             # TypeScript type definitions
  /constants         # Constants and configuration
```

## Architecture

### Offline-First Design

- All data is stored locally in IndexedDB first
- When online and logged in, data syncs to Firestore
- Non-logged users can export/import their data as JSON
- Sync queue handles failed syncs and retries automatically

### Component Architecture

- **Centralized UI Components**: All UI components are in `/src/components/ui/` and can be easily swapped out
- **Feature-Based Structure**: Each feature has its own folder with hooks, services, and components
- **Separation of Concerns**: UI, business logic, and data access are cleanly separated

## Usage

### Learning Sheet

- Browse all questions from Striver's SDE Sheet
- Filter by topic, status, or difficulty
- Mark questions as done, mark for revision, or increment attempts
- Track proficiency (beginner, intermediate, proficient)

### Progress

- View overall completion percentage
- See progress by difficulty (Easy/Medium/Hard)
- Track topic-wise progress
- View your current streak

### Sunday Test

- Generate tests only on Sundays
- Configure test source: all questions, completed only, by topics, or custom
- Mark questions as "weak" after taking the test
- Save test results for review

### Settings

- Export your data as JSON (for backup or transfer)
- Import previously exported data
- Works offline - no login required

## Development

### Building for Production

```bash
npm run build
npm start
```

### Code Style

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting (if configured)
- Component-based architecture
- Custom hooks for business logic

## Future Enhancements

- Authentication (email/password, Google OAuth)
- More tracks (JS Fundamentals, System Design)
- Analytics dashboard
- AI-powered recommendations
- LeetCode auto-tracking
- Multi-user features

## License

ISC

## Notes

- The app works without login - all data is stored locally
- When you log in, local data syncs with Firestore
- Oscar's messages are subtle and context-aware
- The UI is minimal and elegant - no emojis, no slang
- Designed for consistency and quiet improvement
