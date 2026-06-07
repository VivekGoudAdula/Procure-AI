# ProcureAI x402 v2 Payment-Gated Architecture

This document explains the **x402 version 2 payment layer** in **ProcureAI**. It covers Agentic Commerce, pay-per-use APIs, Algorand mechanics, fee abstraction via Atomic Transaction Groups (ATG), and the GoPlausible facilitator.

---

## 1. Agentic Commerce & Pay-Per-Use APIs

As commerce shifts to AI agents, traditional billing (subscriptions, API keys, invoices) creates bottlenecks:
- AI agents need instant microservice access without manual setup.
- API keys require centralized management and introduce payment risks.

**The Solution: x402 Protocol.**
The x402 protocol implements **HTTP 402 (Payment Required)** as a programmatic gate. It replaces centralized billing with instant, pay-per-request verification:

- The agent requests a resource (e.g. AI Sourcing Report).
- The server returns payment requirements and network parameters.
- The client builds a two-transaction Atomic Transaction Group (ATG):
  - **Tx0**: USDC transfer from buyer to treasury.
  - **Tx1**: Payment from facilitator to itself covering the group fee.
- The agent signs only Tx0 using Pera Wallet.
- The request is resubmitted with the signed Tx0 and unsigned Tx1.
- The server sends the group to GoPlausible to co-sign and broadcast.
- The server unlocks the resource after on-chain confirmation.

---

## 2. System Architecture

```
+---------------------------------------------------------------------------------+
|                                 REACT CLIENT                                    |
|                                                                                 |
|  +---------------------------+             +---------------------------------+  |
|  |       Pera Wallet         |             |       Axios / Fetch Client      |  |
|  |                           |             |                                 |  |
|  | - Establish session keys  |             | - Handles 402 challenge loop    |  |
|  | - Signs Tx0 (USDC Axfer)  |             | - Builds ATG locally with       |  |
|  |   with fee = 0            |             |   suggestedParams from server   |  |
|  +-------------+-------------+             +---------------+-----------------+  |
+----------------|-------------------------------------------|--------------------+
                 |                                           |
                 | Sign Tx0 Only                             | GET /x402/report (with signature)
                 v                                           v
+----------------|-------------------------------------------|--------------------+
|                |                                           |                    |
|                |   +---------------------------------------+                    |
|                |   |                                                            |
|                v   v                                                            |
|  +-----------------+---------+             +---------------------------------+  |
|  |    Algorand Node          |             |     FastAPI Resource Server     |  |
|  |    (Nodely / TestNet)     |             |     (main.py / payment_routes)  |  |
|  |                           |             |                                 |  |
|  | - Confirms TxID on-chain  |             | - Provides suggestedParams      |  |
|  | - Fallback direct audit   |<------------| - Forwards ATG to Facilitator   |  |
|  +-------------+-------------+             +---------------+-----------------+  |
|                ^                                           |                    |
+----------------|-------------------------------------------|--------------------+
                 |                                           |
                 | Verify TxID                               | POST /verify then /settle
                 |                                           v
+----------------|-------------------------------------------|--------------------+
|                |                           +---------------+-----------------+  |
|                +---------------------------+     GoPlausible Facilitator     |  |
|                                            |     Endpoint (/verify, /settle) |  |
|                                            +---------------------------------+  |
|                                                                                 |
|                                             Hosted co-signing & broadcasting   |
+---------------------------------------------------------------------------------+
```

---

## 3. Security: Buyer/Facilitator Signature Separation

x402 v2 uses fee-pooling and signature separation:
1. **Buyer signs only their transactions**: Pera Wallet signs only Tx0 (USDC transfer).
2. **Facilitator signs only their transactions**: The facilitator co-signs Tx1 (fee payment).
3. **No private keys exposed**: Facilitator keys stay in GoPlausible's infrastructure.
4. **ATG structure**: Transactions are grouped with `algosdk.assignGroupID` so they succeed or fail together.

---

## 4. Why Algorand

Pay-per-request payments are difficult on traditional blockchains due to high fees, slow confirmations, and forks. Algorand is ideal because:

### A. Sub-Second Finality
Algorand achieves finality in **~2.8 seconds** with no fork risk. This provides instant API access.

### B. Low Fees & Fee Pooling
Algorand transactions cost **0.001 ALGO**. Fee Pooling lets one transaction pay for others. Tx1 pays `0.002 ALGO` covering both fees, so buyers only need USDC.

### C. On-Chain Fallback
If the facilitator is unavailable, the server verifies directly on-chain using indexer queries.
