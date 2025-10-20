# Architecture Overview

## Stack

- Frontend: Next.js 14 + React Flow + Tailwind
- Backend: Express + TypeScript
- Storage: In-memory (simple Map objects)

## Key Components

### Execution Engine
The flow executor handles node traversal and state management:
- **Engine**: Processes nodes sequentially, handles branching
- **Scheduler**: Manages delays with setTimeout
- **Evaluators**: Evaluates AND/OR conditional logic
- **State Store**: Tracks what's completed and what's pending

### Flow Validation
Validates flows before save/execution:
- Must have at least one TRIGGER node
- No invalid edge references
- No self-loops or duplicate IDs
- All node configs properly formatted

### Mock Services
Since this is a demo, external APIs are mocked:
- WhatsApp messages just get logged
- Order/customer updates stored in memory
- Easy to swap with real integrations later

## Data Flow

```
User creates flow → Validation → Save to memory
Trigger event → Load flow → Execute nodes → Update state
```

## Why These Choices?

**In-memory storage**: Keeps it simple for an MVP, no DB setup needed  
**setTimeout for delays**: Good enough for demo, would use a job queue in production  
**Mocked services**: No API keys needed, reproducible demos

## Production Considerations

For a real deployment you'd want:
- Postgres or MongoDB for persistence
- Redis + Bull for reliable job scheduling  
- Real WhatsApp Business API integration
- Proper auth and monitoring
