# PrepWise - AI Mock Interview Platform - Codebase Analysis

## Overview

**PrepWise** is a comprehensive AI-powered mock interview platform built with modern web technologies. The application helps users practice job interviews with AI voice agents and receive detailed feedback on their performance.

## Tech Stack

- **Frontend**: Next.js 15.2.2, React 19, TypeScript
- **Styling**: Tailwind CSS 4.0, tailwindcss-animate
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Backend**: Next.js API routes, Server Actions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with custom session management
- **AI Integration**: 
  - Google Gemini 2.0 Flash for content generation and feedback analysis
  - Vapi AI for voice-based interview conversations
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: Day.js
- **Notifications**: Sonner

## Project Structure

```
├── app/                          # Next.js 13+ App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/             
│   │   └── sign-up/             
│   ├── (root)/                   # Main application routes
│   │   ├── interview/           # Interview generation and management
│   │   │   ├── [id]/           # Dynamic interview routes
│   │   │   │   └── feedback/   # Interview feedback display
│   │   └── page.tsx            # Dashboard/Home page
│   └── api/                     # API routes
│       └── vapi/               # Vapi AI integration endpoints
├── components/                  # Reusable UI components
│   ├── ui/                     # shadcn/ui base components
│   ├── Agent.tsx               # Main interview agent component
│   ├── AuthForm.tsx            # Authentication forms
│   ├── InterviewCard.tsx       # Interview display cards
│   └── DisplayTechIcons.tsx    # Technology stack icons
├── lib/                        # Utility libraries and actions
│   ├── actions/                # Server actions
│   │   ├── auth.action.ts      # Authentication logic
│   │   └── general.action.ts   # General application logic
│   ├── utils.ts               # Utility functions
│   └── vapi.sdk.ts            # Vapi AI SDK configuration
├── firebase/                   # Firebase configuration
│   ├── admin.ts               # Firebase Admin SDK
│   └── client.ts              # Firebase Client SDK
├── types/                      # TypeScript type definitions
├── constants/                  # Application constants and configurations
└── public/                     # Static assets
```

## Key Features

### 1. Authentication System
- **Firebase Authentication** with email/password
- **Custom session management** using HTTP-only cookies
- **Protected routes** with middleware-level authentication checks
- **User management** with Firestore integration

### 2. Interview Generation
- **AI-powered question generation** using Google Gemini
- **Customizable parameters**: role, experience level, tech stack, interview type
- **Dynamic question count** based on user preferences
- **Tech stack integration** with icon display

### 3. Voice Interview System
- **Vapi AI integration** for realistic voice conversations
- **Real-time transcript** generation and display
- **Interview state management** (connecting, active, finished)
- **Error handling** for voice API failures

### 4. Feedback Analysis
- **AI-powered feedback generation** using Google Gemini
- **Structured scoring system** across multiple categories:
  - Communication Skills
  - Technical Knowledge
  - Problem Solving
  - Cultural & Role Fit
  - Confidence & Clarity
- **Detailed assessment** with strengths and improvement areas
- **Persistent feedback storage** in Firestore

### 5. Dashboard & Interview Management
- **Personal interview history** with completion tracking
- **Community interviews** discovery
- **Interview cards** with visual tech stack indicators
- **Feedback preview** and detailed view

## Database Schema

### Users Collection
```typescript
interface User {
  name: string;
  email: string;
  id: string;
  profileURL?: string;
}
```

### Interviews Collection
```typescript
interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}
```

### Feedback Collection
```typescript
interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}
```

## Errors Fixed

### 1. TypeScript Type Errors
- ✅ Fixed `AgentProps` interface to include `profileImage` property
- ✅ Added `profileURL` property to `User` interface
- ✅ Updated Agent component to accept and use `profileImage` prop

### 2. Null Safety Issues
- ✅ Replaced unsafe non-null assertions (`!`) with proper null checks
- ✅ Added user authentication guards in protected routes
- ✅ Implemented proper error handling for missing data

### 3. ESLint Warnings
- ✅ Fixed `@typescript-eslint/no-non-null-asserted-optional-chain` errors
- ✅ Replaced `any` types with proper type annotations
- ✅ Removed unused variables and parameters
- ✅ Added proper error handling with unknown type

### 4. Data Fetching Improvements
- ✅ Enhanced `getInterviewById` to properly handle non-existent documents
- ✅ Added null checks and redirects for missing feedback data
- ✅ Improved error boundaries and fallback states

## Environment Variables Required

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Vapi AI
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_WORKFLOW_ID=

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Security Considerations

1. **Authentication**: Secure session-based authentication with HTTP-only cookies
2. **API Protection**: Server actions with user verification
3. **Data Validation**: Zod schemas for form validation
4. **Environment Variables**: Sensitive keys properly configured
5. **Firebase Rules**: Should be configured for proper data access control

## Performance Optimizations

1. **Image Optimization**: Next.js Image component with proper sizing
2. **Code Splitting**: Automatic with Next.js App Router
3. **Server Components**: Efficient data fetching with React Server Components
4. **Caching**: Firebase data caching and Next.js built-in optimizations

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Known Deprecation Warnings

- **punycode module**: Deprecation warnings from dependencies (non-critical)
- These are from third-party libraries and don't affect functionality

## Deployment Readiness

✅ **TypeScript**: No compilation errors  
✅ **ESLint**: No linting errors  
✅ **Build**: Successful production build  
✅ **Type Safety**: All type issues resolved  
✅ **Error Handling**: Proper error boundaries implemented  

The codebase is now production-ready with all errors resolved and best practices implemented.
