# WhatsApp Marketing Automation Flow Builder - MVP

A visual flow builder for creating and executing WhatsApp marketing automation workflows with conditional logic, delays, and external integrations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation & Running

```bash
# Backend
cd backend
npm install
npm run dev    # Runs on http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev    # Runs on http://localhost:3000
```

## 📖 How to Use

### Quick Start with Templates

1. **Browse Templates**: Visit http://localhost:3000, click "📋 Browse Templates"
2. **Choose a Template**: 
   - **Order Confirmation Flow**: Sends confirmation messages for new orders
   - **Customer Engagement Flow**: Welcome message + delayed follow-up based on purchase behavior
3. **Customize**: Click a template to create a copy, then edit it in the visual builder

### Build From Scratch

1. **Create a Flow**: Click "+ Create Flow" button
2. **Build Visual Flow**:
   - Click colored buttons in toolbar to add nodes (🟣 TRIGGER → 🟡 CONDITION → 🔵 ACTION → 🟢 DELAY)
   - Connect nodes by dragging from one to another
   - Click nodes to edit configuration in side panel
3. **Configure Nodes**: Use the **Simple Mode** forms or switch to **Advanced Mode** for JSON editing
   - **TRIGGER** 🟣: Choose trigger type (New Order, Abandoned Cart, Customer Signup, Order Delivered)
   - **ACTION** 🔵: Configure WhatsApp message, add order/customer notes
   - **CONDITION** 🟡: Build logic with AND/OR conditions
   - **DELAY** 🟢: Set wait time (seconds, minutes, hours, days)
4. **Validate**: Click "✓ Validate" button to check for errors
5. **Save**: Click "💾 Save Flow" 
6. **Execute**: Click "▶ Console" tab, enter trigger payload JSON, click "Trigger Flow"
7. **View Logs**: Watch execution logs in real-time

## 📋 Available Templates

### 1. Order Confirmation Flow
**Purpose**: Automatic order confirmation via WhatsApp  
**Flow**: NEW_ORDER trigger → Send confirmation message → Add order note  
**Use Case**: E-commerce stores wanting to send instant order confirmations

### 2. Customer Engagement Flow
**Purpose**: Welcome new customers and nurture them based on behavior  
**Flow**: CUSTOMER_SIGNUP → Welcome message → Add note → Wait 2 days → Check if purchased → Send thank you OR reminder  
**Use Case**: Increase first-purchase conversion and customer engagement

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 + React Flow + Tailwind CSS
- **Backend**: Express + TypeScript + In-Memory Storage
- **Validation**: Zod schemas
- **Execution**: Sequential traversal + setTimeout for delays

### Project Structure
```
textyess_assignment/
├── backend/
│   ├── src/
│   │   ├── controllers/      # REST route handlers
│   │   ├── services/          # Business logic (execution engine, mocks)
│   │   ├── validators/        # Flow & node validation
│   │   ├── types/             # Zod schemas & TypeScript types
│   │   └── repositories/      # In-memory data store
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   ├── components/        # React components (SidePanel, Toolbar, etc.)
│   │   ├── lib/               # API client & utilities
│   │   └── types/             # TypeScript types
│   └── package.json
│
└── templates/                 # Example flow JSONs
```

## 🔌 API Endpoints

### Flows
- `GET /api/flows` - List all flows
- `POST /api/flows` - Create new flow
- `GET /api/flows/:id` - Get flow by ID
- `PUT /api/flows/:id` - Update flow
- `DELETE /api/flows/:id` - Delete flow
- `POST /api/flows/:id/validate` - Validate flow structure
- `PATCH /api/flows/:id/activate` - Activate flow
- `PATCH /api/flows/:id/deactivate` - Deactivate flow

### Execution
- `POST /api/triggers/:flowId` - Trigger flow execution
  ```json
  {
    "type": "ABANDONED_CHECKOUT",
    "context": { "orderId": "123", "customer": { "phone": "+1234567890" } }
  }
  ```
- `GET /api/executions/:runId` - Get execution by run ID
- `GET /api/executions/:runId/logs` - Get execution logs
- `GET /api/flows/:flowId/analytics` - Get flow analytics (run counts, success/fail)

## ✅ Core Features

### Data Modeling & Validation
- ✅ Persistent models: Flow, Node, Edge, ExecutionHistory
- ✅ Conditional logic (AND/OR) with multiple branches
- ✅ Server-side validation (5 essential rules):
  - Has at least one TRIGGER node
  - All edges reference valid nodes  
  - No self-loops
  - No duplicate IDs
  - Valid node configs

### Visual Flow Builder
- ✅ Drag & drop nodes (React Flow)
- ✅ Create/modify connections with validation
- ✅ Conditional branching visualization
- ✅ Configuration UI (side panel)
- ✅ Inline validation feedback

### Flow Execution Engine
- ✅ Multiple trigger types (NEW_ORDER, ABANDONED_CHECKOUT, CUSTOMER_REGISTRATION, ORDER_STATUS_CHANGE)
- ✅ Sequential processing + parallel branches
- ✅ Complex AND/OR condition evaluation
- ✅ Configurable delays (seconds/minutes/hours/days)
- ✅ State persistence between steps
- ✅ Mock external services (WhatsApp, Orders, Customers)

## 🎯 Node Types

### TRIGGER
Starts the flow execution
```json
{
  "triggerType": "ABANDONED_CHECKOUT"
}
```

### ACTION
Performs an action
```json
{
  "actionType": "SEND_MESSAGE",
  "toField": "customer.phone",
  "body": "Complete your order! {{checkout.url}}",
  "template": "abandoned_cart_v1"
}
```

### CONDITION
Evaluates conditions and branches
```json
{
  "logic": {
    "type": "AND",
    "clauses": [
      { "left": "order.total", "op": "greater_than", "right": 100 },
      { "left": "customer.vip", "op": "equals", "right": true }
    ]
  }
}
```

### DELAY
Waits before proceeding
```json
{
  "amount": 24,
  "unit": "hours"
}
```

## 📋 Flow Validation Rules

**Errors (blocking):**
1. ❌ No TRIGGER node
2. ❌ Invalid edge references  
3. ❌ Self-loops
4. ❌ Duplicate node/edge IDs
5. ❌ Invalid node configs

## 🎨 Example Flow: Abandoned Cart Reminder

```
TRIGGER (Abandoned Checkout)
    ↓
DELAY (1 hour)
    ↓
CONDITION (order.total > 50?)
    ├─ true → ACTION (Send WhatsApp: "Complete your $100 order!")
    └─ false → ACTION (Send WhatsApp: "Checkout reminder")
```

See `templates/abandoned-cart-flow.json` for complete example.

## 🚧 MVP Simplifications

This is an MVP focused on core functionality:
- **Storage**: In-memory (no database) - restarts clear data
- **Mocks**: External services (WhatsApp/Orders/Customers) are logged, not called
- **Delays**: Uses `setTimeout` (not production-ready for long delays)
- **Validation**: Essential rules only (no cycle detection, unreachable nodes)
- **Auth**: No authentication
- **Logs**: Polling-based (no WebSocket)

## 🔮 Production Roadmap

To make this production-ready:
1. **Database**: PostgreSQL for flow & execution persistence
2. **Queue**: Redis + Bull for reliable job scheduling
3. **WebSocket**: Real-time log streaming
4. **Auth**: JWT authentication
5. **Real Integrations**: WhatsApp Business API, Shopify webhooks
6. **Advanced Validation**: Cycle detection, dead-end warnings
7. **Retry Logic**: Exponential backoff for failed actions
8. **Monitoring**: Sentry error tracking, DataDog metrics

## 🎥 Demo Video

[Link to Loom demo video]

## 📚 Key Design Decisions

### Why In-Memory Storage?
- **MVP Speed**: Zero database setup, instant dev experience
- **Trade-off**: Data lost on restart (acceptable for demo)

### Why Simplified Validation?
- **Focus**: Validate critical errors that break execution
- **Trade-off**: Warnings (cycles, unreachable nodes) removed (not blocking)

### Why setTimeout for Delays?
- **Simplicity**: Native Node.js, zero dependencies
- **Trade-off**: Not reliable for delays > 10 minutes or server restarts

### Why Mock Services?
- **Demo-Ready**: Works without external API keys
- **Trade-off**: Replace with real services in production

## 🤝 Contributing

This is a take-home assignment project. Not accepting contributions.

## 📄 License

MIT

---

**Built with ❤️ for the WhatsApp Flow Builder take-home assignment**
