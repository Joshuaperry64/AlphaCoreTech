# ReelDeep

The Uncensored Fishing Experience - A humorous, AI-powered fishing-themed joke generator.

## Features

- Generate fish-themed jokes, flirty bios, haikus, song lyrics, pickup lines, and song titles
- Generate humorous images and captions for user-uploaded images
- Text-to-speech for generated content, including a multi-voice duet feature
- Save your "catches" to a personal collection
- Play a social guessing game with random catches from the public collection
- "Go Fishin'" random event generator

## Development Roadmap

### Phase 1: Code Refinement & Security (Current)

- [x] Code Separation: Refactored monolithic JavaScript into modular files
- [x] API Key Security: Moved API key to server-side environment variables
- [x] Enhanced Error Handling: Implemented more descriptive error messages
- [x] Dependency Management: Added package.json for managing dependencies

### Phase 2: Feature Expansion & Gamification (Upcoming)

- [ ] User Profiles: Persistent profiles with statistics and customizable avatars
- [ ] Social Interaction: "Like" system and commenting feature
- [ ] Gamification Engine: Points system, leaderboards, achievements, and badges
- [ ] New Content Types: Short stories, poems, and animated GIFs

### Phase 3: Backend Development & Deployment (Future)

- [ ] Dedicated Backend Server: Node.js/Express backend for centralized logic
- [ ] Custom API Endpoints: Endpoints for users, leaderboards, and game state
- [ ] Caching: Server-side caching to reduce redundant API calls
- [ ] Deployment Strategy: Streamlined deployment process

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   npm install

3. Create a `.env` file with your API key:

   API_KEY=your_api_key_here
   PORT=3000

4. Start the development server:

   npm run dev

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

ReelDeep/
├── js/                  # JavaScript modules
│   ├── app.js           # Main application code
│   ├── api-service.js   # API service functions
│   ├── audio-service.js # Audio processing functions
│   ├── canvas-renderer.js # Canvas rendering functions
│   ├── firebase-init.js # Firebase initialization
│   └── ui-handlers.js   # UI event handlers
├── .env                 # Environment variables (not in repo)
├── .gitignore           # Git ignore file
├── package.json         # Node.js dependencies
├── ReelDeep.html        # Main HTML file
├── README.md            # Project documentation
├── roadmap.txt          # Development roadmap
└── server.js            # Express server for API proxy
