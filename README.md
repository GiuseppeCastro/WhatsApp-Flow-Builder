# WhatsApp Flow Builder

Visual flow builder for creating WhatsApp marketing automation workflows.

## Getting Started

### Requirements
- Node.js 18+
- pnpm (or npm)

### Running

```bash
# Backend
cd backend
npm install
npm run dev    # localhost:4000

# Frontend
cd frontend
npm install
npm run dev    # localhost:3000
```

## Usage

Visit http://localhost:3000 and either:
- Browse templates (order confirmation, customer engagement)
- Create your own flow from scratch

Build flows by dragging nodes and connecting them. Configure each node by clicking on it. Test execution in the Console tab.


## Tech Stack

- Frontend: Next.js + React Flow + Tailwind
- Backend: Express + TypeScript
- Storage: In-memory (resets on restart)

## Project Structure

```
backend/src/
├── controllers/    # API handlers
├── services/       # Business logic + execution engine
├── validators/     # Flow validation
└── repositories/   # In-memory storage

frontend/src/
├── app/            # Pages
├── components/     # UI components
└── lib/            # API client
```

## API

**Flows**
- GET/POST/PUT/DELETE `/api/flows`
- POST `/api/flows/:id/validate`

**Execution**
- POST `/api/triggers/:flowId` - Execute flow
- GET `/api/executions/:runId/logs`

## Node Types

**TRIGGER** - Starts the flow (NEW_ORDER, ABANDONED_CHECKOUT, etc)  
**ACTION** - Sends WhatsApp message or adds notes  
**CONDITION** - Branches based on AND/OR logic  
**DELAY** - Waits before continuing

## Limitations

This is an MVP with some shortcuts:
- In-memory storage (data lost on restart)
- Mock external services (no real WhatsApp API)
- setTimeout for delays (not production-ready)
- No authentication

For production you'd want: database, job queue (Bull/Redis), real integrations, auth, monitoring.
