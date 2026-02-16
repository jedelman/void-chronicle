# Void Chronicle

Bluesky RPG Chronicle - Collaborative Storytelling on Bluesky using AT Protocol Records

## Overview

Void Chronicle is a collaborative storytelling RPG built on Bluesky using AT Protocol records. Users can create **characteristics** (gift, thank, applaud, witness) referencing Bluesky posts, aggregate them into **chapters** with narrative summaries, and track **quests** with quest-giver completion mechanics.

## Features (P0 MVP)

- ✅ Characteristic Creation (gift, thank, applaud, witness verbs)
- ✅ Characteristic Record Lexicon (com.jason-edelman.void-chronicle.characteristic)
- 🚧 Chapter Creation (with narrative summaries)
- 🚧 Chapter Record Lexicon (com.jason-edelman.void-chronicle.chapter)
- 🚧 Chronicle View (chronological events from network)
- 🚧 Character Sheet View (quests, actions, chapters per DID)
- 🚧 Quest Special Handling (completion, release requests)

## Tech Stack

- **Frontend**: Vanilla JavaScript + @atproto/api SDK
- **Backend**: Express.js (for OAuth callback handling)
- **Authentication**: Bluesky OAuth 2.0
- **Data Storage**: User's PDS (Personal Data Server)
- **Deployment**: GitHub Pages (static hosting)

## Project Structure

```
void-chronicle/
├── index.html          # Main application UI
├── app.js             # Frontend application logic
├── server.js          # Express server for OAuth
├── lexicons.json      # AT Protocol lexicon definitions
├── package.json       # Dependencies and scripts
├── LICENSE            # MIT License
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Bluesky account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jedelman/void-chronicle.git
cd void-chronicle
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
export OAUTH_REDIRECT_URI="http://localhost:3000/callback"
```

### Development

1. Start the development server:
```bash
npm start
```

2. Open your browser to `http://localhost:3000`

3. Click "Login with Bluesky" to authenticate

### Production Deployment

1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Update OAuth redirect URI in Bluesky app settings
4. Deploy static files to gh-pages branch

## Lexicons

### com.jason-edelman.void-chronicle.characteristic

A characteristic record representing a positive interaction with another Bluesky post.

```typescript
{
  verb: "gift" | "thank" | "applaud" | "witness"
  targetPost: {
    uri: string      // at://did:plc:xxx/app.bsky.feed.post/rkey
    cid: string
  }
  targetDid: string  // DID of the person being characterized
  note?: string      // Optional contextual note (max 500 chars)
  createdAt: string  // ISO 8601 timestamp
}
```

### com.jason-edelman.void-chronicle.chapter

A chapter record aggregating characteristics with narrative summaries.

```typescript
{
  title: string           // Chapter title (max 100 chars)
  summary: string         // Narrative summary (max 2000 chars)
  characteristics: string[]  // URIs of characteristics referenced
  isQuest?: boolean       // If true, this is a quest record
  questor?: {             // Required if isQuest=true
    did: string
    handle: string
  }
  questGiver?: {          // Required if isQuest=true
    did: string
    handle: string
  }
  questReleaseRequested?: boolean
  completedAt?: string    // Set by questGiver when marking complete
  createdAt: string
}
```

## Development Workflow

This project follows the Specify → Plan → Execute workflow with TDD collaboration between Scout and Mercury agents.

1. **Specify**: Create comprehensive specification (PRD v3.0)
2. **Plan**: Break down into implementable features with GitHub issues
3. **Execute**: Implement features with test-driven development

## Success Metrics

- 500 characteristics in 30 days
- 50 chapters in 30 days
- 100 unique creators
- 40% quest acceptance rate

## License

MIT License - see LICENSE file for details

## Credits

Inspired by void.comind.network patterns

## Links

- [PRD v3.0](https://github.com/jedelman/void-chronicle/blob/main/docs/PRD-v3.md)
- [Implementation Plan](https://github.com/jedelman/void-chronicle/blob/main/docs/IMPLEMENTATION_PLAN.md)
- [AT Protocol Documentation](https://atproto.com/)
- [Bluesky Documentation](https://docs.bsky.app/)

