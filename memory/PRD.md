# LearnAfrikaans - Product Requirements Document

## Overview
LearnAfrikaans is an AI-powered language learning platform designed to teach Afrikaans to South Africans. The app features a beautiful dark mode UI, gamification elements, and supports both English and Sepedi interface languages.

## Original Problem Statement
Build a LearnAfrikaans language learning application for South Africans with:
- Dark mode, user-friendly design (no emojis - use icons)
- Registration & onboarding with skill level selection
- Interface language selection (English/Sepedi)
- Voice pronunciation and speech recognition
- AI-powered quiz system with Claude
- AI chatbot for conversation practice
- Real-time leaderboard
- Streak system & gamified badges
- Progress dashboard with confidence scoring
- Word of the day feature

## Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude via Emergent LLM key
- **Speech**: Browser Web Speech API (TTS & Recognition)

## User Personas
1. **Beginner Learner**: New to Afrikaans, needs simple words and slow audio
2. **Intermediate Learner**: Knows basics, needs phrases and sentence building
3. **Pro Learner**: Advanced, needs complex conversations and grammar

## Core Features Implemented (Jan 13, 2026)

### 1. Authentication System
- User registration with 3-step onboarding (credentials, language, skill level)
- JWT-based login with 7-day token expiration
- Profile management with settings

### 2. Dashboard
- Streak tracking with fire icon animation
- Points and rank display
- Word of the Day with pronunciation
- Progress overview across topics
- Recommended lesson based on lowest confidence
- Badges preview

### 3. Lessons System
- 8 topic categories (Greetings, Numbers, Family, Colors, Food, Phrases, Weather, Time)
- Each lesson has 8-10 vocabulary words
- Audio playback (browser TTS)
- Speech recognition for pronunciation practice
- Sepedi translations for all words
- Example sentences for context

### 4. Quiz System
- AI-powered question generation via Claude
- Fallback to basic questions if AI unavailable
- Multiple choice format
- Score tracking with points
- Personalized AI feedback
- Confidence scoring per topic

### 5. AI Chatbot
- Skill-level adaptive conversations
- Beginner: English with Afrikaans words
- Intermediate: Mixed language
- Pro: Primarily Afrikaans
- Fallback responses when AI unavailable

### 6. Leaderboard
- All-time rankings
- Weekly rankings
- Personal rank display

### 7. Gamification
- Daily streak system
- 6 badges (First Steps, Quiz Crusher, Week Warrior, Month Master, Conversation Pro, Word Wizard)
- Points for completing lessons and quizzes

### 8. Multilingual Interface
- Full English interface
- Full Sepedi (Northern Sotho) interface
- User can switch languages in profile

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/users/profile
- POST /api/users/update-streak
- GET /api/lessons/topics
- GET /api/lessons/{topic_id}
- POST /api/lessons/{topic_id}/complete
- POST /api/quiz/generate
- POST /api/quiz/submit
- POST /api/chatbot/message
- GET /api/leaderboard
- GET /api/dashboard
- GET /api/badges
- GET /api/word-of-day

## Database Collections
- users: User profiles, streaks, badges
- progress: Per-topic confidence scores
- quiz_results: Quiz history
- leaderboard: Rankings

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] User authentication
- [x] Dashboard
- [x] Lessons with audio
- [x] Quiz system
- [x] Leaderboard

### P1 (High Priority) - COMPLETED
- [x] AI chatbot
- [x] Badge system
- [x] Multilingual interface
- [x] Speech recognition

### P2 (Medium Priority) - Future
- [ ] Push notifications for Word of the Day
- [ ] Friends leaderboard
- [ ] Social sharing
- [ ] Offline mode

### P3 (Nice to Have) - Future
- [ ] Advanced grammar lessons
- [ ] User-generated content
- [ ] Community forums
- [ ] Mobile app (React Native)

## Next Tasks
1. Add more vocabulary topics (Animals, Body Parts, Directions)
2. Implement spaced repetition for vocabulary review
3. Add pronunciation scoring with visual feedback
4. Create achievement sharing to social media
5. Add premium tier with advanced features

## Notes
- AI features use Emergent LLM key for Claude integration
- Fallback responses implemented for when AI is unavailable
- Browser Web Speech API used for TTS (no external API needed)
