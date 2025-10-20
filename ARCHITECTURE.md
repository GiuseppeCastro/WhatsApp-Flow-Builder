# Architecture

## Overview
Visual workflow builder for WhatsApp marketing automation. Drag-and-drop interface for creating automated campaigns.

## Tech Stack

**Frontend:** Next.js 14, TypeScript, React Flow, Tailwind CSS

**Backend:** Node.js, Express, TypeScript, in-memory storage

## Design Decisions

### Why In-Memory Storage?
Using simple in-memory data structures instead of a database. Good for MVP and demos, but data gets wiped on restart. Easy to swap for MongoDB/Postgres later.

### Execution Engine
Built an event-driven system with three main parts:
- **Scheduler** - handles delays between actions
- **Engine** - runs through the flow and executes nodes
- **State Store** - keeps track of what's running

This lets flows branch out in parallel and makes debugging easier.

### Validation
Flows get validated twice - once in the browser for instant feedback, and again on the server before saving. Checks for broken connections, missing configs, and invalid logic.

### Mocked Services
All external APIs (WhatsApp, orders, customers) are mocked with fake endpoints. Makes development easier and demos more reliable. Everything just logs what it would've done.

### Conditional Logic
Supports AND/OR conditions with basic operators (equals, greater than, contains, etc). Flexible enough for real use cases without being overly complex.

## How It Works

**Creating a Flow:**
User edits in UI → validates → saves to memory → gets an ID back

**Running a Flow:**
Trigger fires → loads flow → starts execution → processes each node → evaluates conditions → executes actions → moves to next nodes → repeats until done

**Execution State:**
Tracks which nodes are running, which are done, what's scheduled for later, and all the context/data from the trigger.

## Project Structure

```
textyess_assignment/
├── backend/
│   └── src/
│       ├── controllers/     # Request handlers
│       ├── services/        # Business logic
│       │   └── execution/   # Execution engine components
│       ├── repositories/    # Data access (memoryStore)
│       ├── validators/      # Flow validation logic
│       ├── routes/          # API routes
│       └── types/           # TypeScript schemas
│
└── frontend/
    └── src/
        ├── app/             # Next.js pages
        ├── components/      # React components
        ├── lib/             # API client & utilities
        └── types/           # TypeScript schemas

```

## API Endpoints

**Flows:** CRUD operations + activate/deactivate
- `POST /api/flows` - create
- `GET /api/flows` - list all
- `GET /api/flows/:id` - get one
- `PUT /api/flows/:id` - update
- `DELETE /api/flows/:id` - delete
- `POST /api/flows/:id/activate` 
- `POST /api/flows/:id/deactivate`

**Triggers:** `POST /api/triggers/:type` - fire a trigger

**Executions:** List and view execution history
- `GET /api/executions`
- `GET /api/executions/:id`

## TODO / Improvements

**Next steps:**
- Add a real database
- Use a proper job queue (Bull/BullMQ)
- Better error handling
- Write tests

**Eventually:**
- Real WhatsApp Business API
- Template library
- Analytics dashboard
- Multi-tenant support
- Webhooks
- Flow versioning
