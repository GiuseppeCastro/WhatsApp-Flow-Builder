# WhatsApp Marketing Automation Flow Builder

Visual workflow builder for WhatsApp marketing campaigns. Drag-and-drop interface with conditions, delays, and integrations.

## Quick Start

**Requirements:** Node.js 18+

```bash
# Backend
cd backend
npm install
npm run dev    # http://localhost:4000

# Frontend
cd frontend
npm install
npm run dev    # http://localhost:3000
```

## How to Use

**Using Templates:**
1. Go to http://localhost:3000 and click "Browse Templates"
2. Pick one (Order Confirmation or Customer Engagement)
3. Edit it in the visual builder

**Building from Scratch:**
1. Click "+ Create Flow"
2. Add nodes from toolbar (Trigger → Condition → Action → Delay)
3. Drag to connect them
4. Click nodes to configure in the side panel
5. Validate, save, and test in the Console tab

## Templates

**Order Confirmation:** Auto-confirm orders via WhatsApp (trigger → message → note)

**Customer Engagement:** Welcome new users and follow up based on whether they purchased (signup → welcome → wait 2 days → check purchase → thank you or reminder)

## Tech Stack

**Frontend:** Next.js 14, React Flow, Tailwind  
**Backend:** Express, TypeScript, in-memory storage  
**Validation:** Zod schemas

## API Endpoints

**Flows:** Standard CRUD + validate/activate/deactivate  
`GET/POST/PUT/DELETE /api/flows`

**Execution:**  
`POST /api/triggers/:flowId` - run a flow  
`GET /api/executions/:runId` - check execution status/logs  
`GET /api/flows/:flowId/analytics` - stats

## Features

- Drag & drop flow builder
- AND/OR conditional logic
- Configurable delays
- Multiple trigger types
- Validation (must have trigger, no self-loops, valid configs, etc)
- Execution logs
- Mock integrations (WhatsApp, orders, customers)

## Node Types

**TRIGGER:** Starts the flow (e.g., abandoned checkout, new order)  
**ACTION:** Sends WhatsApp message or adds notes  
**CONDITION:** Branches based on AND/OR logic  
**DELAY:** Waits X seconds/minutes/hours/days

## Example: Abandoned Cart Flow

```
TRIGGER (Abandoned Checkout)
  ↓
DELAY (1 hour)
  ↓
CONDITION (order.total > 50?)
  ├─ true → Send "Complete your $100 order!"
  └─ false → Send basic reminder
```

Check `templates/` folder for full examples.

## Limitations (MVP)

This is a demo/MVP, so:
- Data stored in memory (resets on restart)
- External services are mocked
- Delays use setTimeout (not reliable for long waits)
- No auth
- Logs are polled, not real-time

## What's Missing for Production

- Real database (Postgres)
- Job queue (Bull/Redis)
- WebSockets for real-time logs
- Authentication
- Real WhatsApp API integration
- Better error handling and retries
- Monitoring

---

Built for a take-home assignment
