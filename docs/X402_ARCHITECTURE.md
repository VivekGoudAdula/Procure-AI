# ProcureAI x402 v2 Payment-Gated Architecture

This document provides a comprehensive architectural breakdown of the **x402 version 2 payment layer** integrated into **ProcureAI**. It details the concepts of Agentic Commerce, pay-per-use APIs, AVM (Algorand Virtual Machine) mechanics, fee abstraction via Atomic Transaction Groups (ATG), and the GoPlausible facilitator integration.

---

## 🌐 1. Agentic Commerce & Pay-Per-Use Resource APIs

As commerce shifts from human-driven systems to **autonomous AI agents**, traditional billing models (SaaS subscriptions, API keys, long-term invoices) create severe bottlenecks:
- AI agents need to consume microservices instantly without manual sign-ups or billing setup.
- API keys require centralized management, secret storage, and introduce payment defaults risk.

**The Solution: x402 Protocol.**
The x402 protocol implements **HTTP 402 (Payment Required)** as an active, programmatic gate. It replaces centralized API billing with instant, trustless, pay-per-request verification:

- The agent requests a high-value resource (e.g. AI-Generated Sourcing Intelligence Report).
- The server refuses access, returning the payment requirements (amount, network, destination wallet, asset ID) and the recent suggested network parameters (`suggestedParams`).
- The agent/client constructs a two-transaction Atomic Transaction Group (ATG) in the browser, where:
  - **Tx0**: USDC AssetTransfer from the buyer to the treasury address.
  - **Tx1**: A dummy payment from the facilitator fee-payer address to itself with a fee covering the group.
- The agent signs only the buyer-owned transaction (**Tx0**) using Pera Wallet.
- The agent re-submits the request, attaching the `paymentGroup` containing the signed Tx0 and the unsigned Tx1.
- The server posts the group to the GoPlausible facilitator `/verify` and `/settle` endpoints. The facilitator co-signs Tx1, broadcasts the group, and returns the transaction ID.
- The server unlocks the resource on-chain confirmation.

---

## 🏛️ 2. Comprehensive System Architecture

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

## 🔒 3. Production-Grade Security: Buyer/Facilitator Signature Separation

To support gasless transactions for the end user, x402 v2 uses fee-pooling and signature separation:
1. **The Buyer signs only buyer-owned transactions**: Pera Wallet only requests signature authorization for Tx0 (the asset transfer of 0.05 USDC).
2. **The Facilitator signs only facilitator-owned transactions**: The facilitator co-signs Tx1 (self-payment with double transaction fee to cover Tx0).
3. **No Private Keys on the Frontend/Backend**: No private keys for the facilitator are exposed or required in the frontend or backend code. All co-signing logic is handled inside GoPlausible's secure infrastructure.
4. **Official ATG Structure**: The AVM group is assigned a unique Group ID using `algosdk.assignGroupID([tx0, tx1])` to guarantee that both transactions must succeed together or fail together.

---

## ⚡ 4. AVM Mechanics & why Algorand is Ideal

Executing pay-per-request micro-payments on traditional blockchains is often unfeasible due to high transaction fees, slow confirmation times, and forks. Algorand's unique layer-1 parameters make it uniquely qualified:

### A. Sub-Second Finality
Algorand achieves finality in **~2.8 seconds** with zero risk of forks. For an AI agent or client waiting to unlock an API, this provides a seamless, instant user experience.

### B. Ultra-Low Transaction Fees & Fee Pooling
Standard transactions on Algorand cost a flat **0.001 ALGO** (fractions of a cent). In addition, Algorand supports **Fee Pooling** where one transaction in an atomic group can pay the fee for other transactions. Here, Tx1 pays `0.002 ALGO` (covering its own fee and Tx0's fee of `0`), allowing the buyer to pay only the USDC without having any ALGO in their wallet.

### C. Direct On-Chain Fallback
If the facilitator service is temporarily unreachable, the resource server falls back to direct on-chain verification using indexer and algod queries, ensuring high system availability and resilience.
