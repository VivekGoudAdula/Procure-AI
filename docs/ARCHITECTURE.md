# ProcureAI Architecture Documentation

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>Vite + Tailwind + Pera Wallet]
    end
    
    subgraph "API Gateway Layer"
        API[FastAPI Backend<br/>REST API + Rate Limiting]
        X402[x402 Payment Gateway<br/>HTTP 402 Protocol]
    end
    
    subgraph "Service Layer"
        S1[Alibaba Procurement Service]
        S2[Multilingual Negotiation Service]
        S3[Translation Service]
        S4[Negotiation Intelligence Engine]
        S5[Supplier Intelligence Service]
        S6[Email Service]
        S7[Dashboard Analytics]
        S8[Procurement Analytics Engine]
        S9[Settlement Analytics]
        S10[Audit Service]
    end
    
    subgraph "AI Layer"
        AI[Groq Llama-3 Agent Engine<br/>8B/70B Models]
    end
    
    subgraph "Blockchain Layer"
        SC[Algorand Smart Contracts<br/>ARC-4 Python]
        ESC[Escrow Service]
        BC[Algorand TestNet Blockchain]
        IDX[Algorand Indexer]
    end
    
    subgraph "Payment Layer"
        FAC[GoPlausible Facilitator<br/>Co-signing & Broadcasting]
        WAL[Pera Wallet Integration]
    end
    
    subgraph "Data Layer"
        DB[(MongoDB Atlas<br/>NoSQL Database)]
    end
    
    subgraph "External Ecosystems"
        ALI[Alibaba Supplier APIs]
        SMTP[Email Gateway]
    end
    
    UI --> API
    UI --> X402
    UI --> WAL
    
    API --> S1
    API --> S2
    API --> S3
    API --> S4
    API --> S5
    API --> S6
    API --> S7
    API --> S8
    API --> S9
    API --> S10
    API --> DB
    
    X402 --> FAC
    X402 --> WAL
    FAC --> BC
    
    S1 --> ALI
    S2 --> AI
    S3 --> AI
    S4 --> AI
    S5 --> AI
    S6 --> SMTP
    
    API --> ESC
    ESC --> SC
    ESC --> BC
    BC --> IDX
    IDX --> API
    
    style UI fill:#e3f2fd
    style API fill:#e8f5e9
    style X402 fill:#fce4ec
    style AI fill:#f3e5f5
    style BC fill:#fff9c4
    style DB fill:#ffe0b2
```

## Component Architecture

### 1. Frontend Layer (React + Vite)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- Pera Wallet SDK for blockchain interactions
- React Router for navigation
- Recharts for data visualization
- Framer Motion for animations

**Key Components:**
- `Dashboard.tsx` - Main procurement dashboard
- `Procurement.tsx` - AI-powered procurement workflows
- `Analytics.tsx` - Advanced analytics and reporting
- `Transactions.tsx` - Blockchain transaction tracking
- `Admin.tsx` - Administrative controls
- `Settings.tsx` - User configuration
- `LiveDealArena.tsx` - Real-time negotiation visualization
- `X402PaymentStatus.tsx` - Payment gateway integration

**UI Component Library:**
- Dashboard components (metrics, charts, tables)
- Procurement components (forms, supplier cards, negotiation panels)
- UI components (buttons, inputs, modals, toasts)

### 2. Backend API Layer (FastAPI)

**Technology Stack:**
- FastAPI 0.135.1 with async support
- Uvicorn ASGI server
- Pydantic for data validation
- JWT authentication with bcrypt
- Rate limiting with slowapi
- CORS middleware for frontend integration

**Core Services:**

#### AI & Intelligence Services
- `ai_agent.py` - AI agent orchestration and supplier selection
- `alibaba_procurement_service.py` - Alibaba API integration (11,970 bytes)
- `multilingual_negotiation_service.py` - Cross-border negotiation (31,872 bytes)
- `translation_service.py` - Multi-language support (7,097 bytes)
- `negotiation_intelligence.py` - MOQ & pricing analysis (10,048 bytes)
- `supplier_intelligence_service.py` - Supplier ranking (8,538 bytes)

#### Analytics & Reporting
- `dashboard_analytics.py` - Real-time dashboard metrics (7,774 bytes)
- `procurement_analytics_engine.py` - Advanced analytics (16,059 bytes)
- `procurement_insights.py` - Business intelligence (6,987 bytes)
- `settlement_analytics.py` - Settlement tracking (12,681 bytes)

#### Communication & Operations
- `email_service.py` - Email notifications (5,478 bytes)
- `procurement_message_engine.py` - Message orchestration (2,860 bytes)
- `audit_service.py` - Audit logging (8,069 bytes)
- `global_procurement_engine.py` - Global sourcing (11,419 bytes)

### 3. Blockchain Layer (Algorand)

**Technology Stack:**
- Algorand Python (Puya) - ARC-4 smart contracts
- PyTeal 0.27.0 - TEAL compilation
- py-algorand-sdk 2.11.1 - Blockchain interactions
- Algokit 2.10.2 - Development toolkit

**Smart Contract Architecture:**
```
smartcontract/
├── smart_contracts/
│   ├── escrow/
│   │   ├── contract.py          # Main escrow logic
│   │   ├── approval.py          # State machine
│   │   └── clear_state.py       # Storage schema
│   └── artifacts/               # Compiled TEAL
└── .algokit.toml                # Configuration
```

**Blockchain Services:**
- `blockchain.py` - Transaction creation (1,640 bytes)
- `escrow.py` - Escrow logic (1,784 bytes)
- `escrow_client.py` - Escrow client (69,590 bytes)
- `escrow_service.py` - Escrow deployment (5,100 bytes)
- `smart_contract.py` - Contract management (2,630 bytes)

**Key Features:**
- Asset segregation in unique Application Address
- Atomic payouts via Inner Transactions
- On-chain reputation ledger
- Delivery verification & release settlement

### 4. x402 Payment Gateway

**Architecture:**
```mermaid
sequenceDiagram
    participant Buyer as Buyer
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Facilitator as GoPlausible Facilitator
    participant BC as Algorand TestNet
    
    Buyer->>UI: Request Premium Report
    UI->>API: GET /x402/report
    API-->>UI: 402 Payment Required<br/>+ suggestedParams
    UI->>UI: Construct ATG (Tx0 + Tx1)
    UI->>UI: Sign Tx0 with Pera Wallet
    UI->>API: POST /x402/report<br/>with paymentGroup
    API->>Facilitator: POST /verify
    Facilitator-->>API: Valid
    API->>Facilitator: POST /settle
    Facilitator->>Facilitator: Co-sign Tx1
    Facilitator->>BC: Broadcast ATG
    BC-->>Facilitator: TxID
    Facilitator-->>API: TxID
    API->>BC: Verify on-chain
    API-->>UI: 200 + Premium Report
    UI-->>Buyer: Display Report
```

**Payment Flow:**
1. **Challenge**: Server returns 402 with payment requirements
2. **ATG Construction**: Client builds Atomic Transaction Group
   - Tx0: USDC transfer (buyer → treasury, fee=0)
   - Tx1: Fee payment (facilitator → self, fee=2000)
3. **Signature Separation**: Buyer signs only Tx0 via Pera Wallet
4. **Facilitator Co-signing**: GoPlausible signs Tx1 and broadcasts
5. **Verification**: Server confirms on-chain settlement
6. **Resource Unlock**: Premium content delivered

### 5. Database Layer (MongoDB Atlas)

**Current Collections:**
- `users` - Authentication & user profiles
- `escrows` - Blockchain escrow tracking

**Planned Collections:**
- `suppliers` - Supplier registry
- `procurement_transactions` - Transaction records
- `settlements` - Settlement history
- `supplier_ratings` - Reputation system
- `audit_logs` - Audit trail

**Schema Relationships:**
```mermaid
erDiagram
    USER ||--o{ PROCUREMENT_TRANSACTION : creates
    SUPPLIER ||--o{ PROCUREMENT_TRANSACTION : receives
    PROCUREMENT_TRANSACTION ||--|| ESCROW : secured_by
    ESCROW ||--|| SETTLEMENT : settles
    USER ||--o{ SUPPLIER_RATING : submits
    SUPPLIER ||--o{ SUPPLIER_RATING : receives
    USER ||--o{ AUDIT_LOG : generates
```

### 6. AI Intelligence Layer

**Technology Stack:**
- Groq SDK 1.1.1
- Llama-3 8B/70B models
- Agent orchestration framework

**AI Capabilities:**
- Supplier discovery & ranking
- Multilingual negotiation
- MOQ & pricing flexibility analysis
- Procurement inquiry generation
- Trust scoring algorithms
- Delivery confidence prediction

## Data Flow

### Procurement Workflow
```mermaid
flowchart TD
    A[User submits procurement request] --> B[Procurement Inquiry Agent]
    B --> C[Supplier Discovery Agent]
    C --> D[Alibaba API Integration]
    D --> E[Supplier Intelligence Service]
    E --> F[AI Ranking & Scoring]
    F --> G[Translation Agent]
    G --> H[Multilingual Negotiation Agent]
    H --> I[Negotiation Intelligence Engine]
    I --> J[Supplier Ranking Agent]
    J --> K[Escrow Commitment Agent]
    K --> L[Algorand Smart Contract]
    L --> M[Delivery Verification]
    M --> N[Settlement Execution]
    N --> O[Reputation Update]
```

### x402 Payment Flow
```mermaid
flowchart TD
    A[User requests premium report] --> B[FastAPI x402 Gateway]
    B --> C[Return 402 + suggestedParams]
    C --> D[React Frontend]
    D --> E[Construct ATG: Tx0 + Tx1]
    E --> F[Pera Wallet Sign Tx0]
    F --> G[Send paymentGroup to API]
    G --> H[GoPlausible /verify]
    H --> I[GoPlausible /settle]
    I --> J[Co-sign & Broadcast]
    J --> K[Algorand TestNet]
    K --> L[On-chain Confirmation]
    L --> M[Unlock Premium Report]
    M --> N[Display to User]
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | User interface & interactions |
| **Wallet** | Pera Wallet SDK | Blockchain transaction signing |
| **Backend** | FastAPI, Uvicorn, Pydantic | REST API & orchestration |
| **AI** | Groq Llama-3 8B/70B | Intelligence & negotiation |
| **Blockchain** | Algorand Python (Puya), PyTeal | Smart contracts & escrow |
| **Database** | MongoDB Atlas | Data persistence |
| **Payment** | x402 Protocol, GoPlausible | Pay-per-use API access |
| **External** | Alibaba APIs, Email Gateway | Supplier data & communication |

## Project Structure

```
APP/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/             # Page components
│   │   ├── lib/               # Utilities
│   │   └── context/           # React context
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # FastAPI backend
│   ├── main.py                # API entry point
│   ├── ai/                    # AI services
│   ├── blockchain/            # Blockchain services
│   ├── database/              # Database models
│   ├── services/              # Business logic
│   ├── x402/                  # Payment gateway
│   └── requirements.txt
├── smartcontract/              # Algorand smart contracts
│   ├── smart_contracts/
│   │   └── escrow/           # Escrow contract
│   └── pyproject.toml
├── tests/                      # Test suite
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── X402_ARCHITECTURE.md
│   └── X402_FLOW.md
└── README.md
```

## Security Features

- JWT authentication with bcrypt password hashing
- Rate limiting with slowapi
- CORS configuration
- Signature separation (buyer/facilitator)
- On-chain transaction verification
- Audit logging service
- Environment variable configuration

## Deployment Architecture

**Development:**
- Frontend: `npm run dev` (Vite dev server)
- Backend: `uvicorn main:app --reload` 
- Smart Contracts: `algokit compile python` 

**Production:**
- Frontend: Vercel deployment
- Backend: Containerized FastAPI
- Database: MongoDB Atlas
- Blockchain: Algorand TestNet
- Payment: GoPlausible hosted facilitator

This architecture provides a modular foundation for AI-powered procurement with blockchain escrow.
