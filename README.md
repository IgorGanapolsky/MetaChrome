# MetaChrome

A voice-controlled mobile browser app with Meta Ray-Ban smart glasses integration.

## Policy

- README is the single source of truth for this repo.
- All documentation lives under `docs/` and is linked below.

## Features

- **Voice Commands**: Control your browser with custom voice commands
- **Meta Ray-Ban Integration**: Connect your Meta Ray-Ban smart glasses for hands-free browsing
- **Custom Commands**: Create, edit, and manage your own voice commands
- **Tab Management**: Manage multiple browser tabs with voice or touch
- **WebView Browser**: Full-featured in-app browser

## Tech Stack

- **Expo** (SDK 54)
- **React Native** (0.81.5)
- **React** (19.1)
- **TypeScript**
- **Expo Router**
- **Zustand** (State Management)
- **AsyncStorage** (Local Persistence)

## Prerequisites

- Node.js 20.x (see `frontend/.nvmrc`)
- Yarn 1.22.x
- Android Studio + Android SDK (for device/emulator)
- Xcode (for iOS builds)

## Platform Targets

- Android compile/target SDK 35
- iOS deployment target 15.1

## Environment Variables

Set in `frontend/.env` (gitignored):

- `EAS_PROJECT_ID`
- `GCP_PROJECT_ID`
- `DIALOGFLOW_PROJECT_ID`
- `DIALOGFLOW_AGENT_ID`
- `DIALOGFLOW_AGENT_NAME`
- `DIALOGFLOW_LOCATION`
- `VERTEX_API_KEY`
- `VERTEX_RAG_LOCATION`
- `VERTEX_RAG_CORPUS`
- `VERTEX_RAG_BUCKET`
- `VERTEX_MODEL_ID`
- `GOOGLE_API_KEY`
- `HELICONE_API_KEY`
- `HELICONE_ENDPOINT`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`
- `LANGSMITH_TRACING`

## Getting Started

```bash
cd frontend
yarn install
yarn start
```

## Documentation

- `docs/frontend/FRONTEND_OVERVIEW.md`
- `docs/frontend/BUILD_INSTRUCTIONS.md`
- `docs/frontend/RELEASE_CHECKLIST.md`
- `docs/frontend/UAT_CHECKLIST.md`
- `docs/frontend/TESTING_REPORT.md`
- `docs/frontend/TESTING_STATUS.md`
- `docs/frontend/TEST_FIX_NOTES.md`
- `docs/frontend/PRODUCTION_READINESS.md`
- `docs/frontend/PRODUCTION_STATUS.md`
- `docs/frontend/APP_STORE_METADATA.md`
- `docs/frontend/PRIVACY_POLICY.md`
- `docs/frontend/LESSONS.md`
- `docs/CI_TEST.md`
- `docs/SDK_RESEARCH.md`

## Project Structure

```
docs/
frontend/
├── app/                    # Expo Router pages
├── src/
│   ├── entities/          # Data models & stores
│   ├── features/          # Feature logic
│   ├── pages/             # Page components
│   ├── services/          # API + integration clients
│   ├── shared/            # Shared utilities
│   ├── theme/             # Theme configuration
│   ├── types/             # Shared types
│   └── widgets/           # UI components
└── assets/                # Images & fonts
```

## Automation & Agents (Dec 2025)

- **Autopilot (nightly-ready):** `yarn agent:autopilot` → kernel gen/bench/select → RAG rebuild → Vertex publish → monitorability eval. Uses the `claude-code-lessons` data store (global) with summaries enabled.
- **Query lessons (CLI):** `yarn agent:dev "your question"` → reliability-aware retrieval from `claude-code-lessons` (Discovery Engine). Shows reasoning + uncertainty when evidence is weak.
- **Kernel experimentation:** `yarn kernel:gen` → `yarn kernel:bench` → `yarn kernel:select` (logs a reflection on wins). Full loop: `yarn kernel:loop`.
- **RAG operations:** `yarn rag:build` (rebuild chunks) and `yarn rag:publish` (upload + import to Vertex).
- **Evals:** `yarn eval:monitorability` (CoT/trace clarity heuristic).
- **LangSmith sync (pending 403 fix):** `yarn langsmith:sync` (needs valid LANGSMITH_API_KEY/project scope).

## Data Stores & Agents

- Lessons data store: `projects/claude-code-learning/locations/global/collections/default_collection/dataStores/claude-code-lessons`
- Vertex agent (global): `ca28d7d3-554c-44c2-a63f-b5a5f6fc1905` – wired to the lessons data store with Gemini summaries.

## License

MIT
