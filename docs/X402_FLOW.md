# ProcureAI x402 v2 Handshake Flow

This document details the production-grade **x402 version 2 cryptographic payment handshake** used to gate Premium AI Sourcing Intelligence Reports. In this design, business logic, transaction co-signing, and blockchain broadcasting are handled via an Atomic Transaction Group (ATG) in partnership with the GoPlausible facilitator.

---

## Architectural Flow

Here is the structured sequence of data, signals, and assets between the buyer, resource server, facilitator, and the blockchain ledger:

1. **Buyer (Enterprise Manager)**: Requests access to a locked Premium AI Supplier Intelligence Report.
2. **React Frontend**: Queries the backend for the premium report.
3. **FastAPI Backend / x402 Resource Layer**:
   - Receives the request.
   - Fetches recent suggested network parameters (`suggestedParams`) from the Algorand node.
   - Returns a **402 Payment Required** response body containing the payment requirements and the `suggestedParams`.
4. **React Frontend**:
   - Receives the `suggestedParams` from the challenge.
   - Constructs Tx0 (AssetTransfer of 50,000 atomic units of USDC from the buyer to the treasury with a fee of 0).
   - Constructs Tx1 (Payment from facilitator fee-payer address to itself with amount 0 and fee of 2000).
   - Groups the transactions using `algosdk.assignGroupID([tx0, tx1])`.
   - Triggers Pera Wallet to sign ONLY Tx0.
   - Packs the signed Tx0 and unsigned Tx1 into a `paymentGroup` inside the `paymentPayload` JSON envelope, base64 encodes it, and sends it back in the `PAYMENT-SIGNATURE` header.
5. **FastAPI Backend (Broadcasting & Verification)**:
   - Receives the signed payload.
   - Sends a POST to GoPlausible's `/verify` endpoint to check transaction authenticity.
   - If valid, sends a POST to GoPlausible's `/settle` endpoint. The facilitator co-signs Tx1, submits the group to Algorand TestNet, and returns the transaction ID.
   - On confirmation, returns HTTP 200 containing the **Premium AI Sourcing Report** and a success response header.

---

## Component Directory

| Component | Responsibility | Technical Stack |
| :--- | :--- | :--- |
| **Buyer** | Initiator of procurement queries | Enterprise User |
| **React Frontend** | Wallet session & local ATG construction | React, Vite, Pera Wallet SDK |
| **FastAPI Backend** | Challenge construction & logic verification | FastAPI, Python algosdk |
| **x402 Resource Layer** | Gating, headers & client validations | Python base64, JSON |
| **GoPlausible Facilitator** | Co-signing Tx1 (fee transaction) & broadcasting | GoPlausible Hosted API |
| **Algorand TestNet** | Blockchain settlement ledger | Pure Proof-of-Stake (PPoS) |
| **Premium AI Report** | Custom procurement intelligence | Groq AI (llama-3.1-8b-instant) / fallbacks |
