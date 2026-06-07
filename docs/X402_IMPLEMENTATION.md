# x402 v2 Developer Implementation Guide

This document outlines the step-by-step implementation of the production-grade **x402 version 2 payment-gated resource protocol** within ProcureAI for unlocking premium AI supplier intelligence reports using USDC and fee pooling.

---

## Protocol Mechanics

The production-grade x402 version 2 protocol uses fee pooling and transaction co-signing via the GoPlausible facilitator. The client signs only the USDC transfer transaction (Tx0), while the facilitator signs the fee payment transaction (Tx1).

```
 Buyer Client               FastAPI Resource Server           GoPlausible Facilitator
      |                               |                             |
      |-- GET /premium-report ------->|                             |
      |                               |                             |
      |<-- HTTP 402 Payment Required -|                             |
      |    (PAYMENT-REQUIRED header,  |                             |
      |     suggestedParams in body)  |                             |
      |                               |                             |
      |-- Build ATG & Sign Tx0 -------|                             |
      |   (Pera Wallet, fee=0)        |                             |
      |                               |                             |
      |-- GET /premium-report ------->|                             |
      |   (PAYMENT-SIGNATURE:         |-- POST /verify ------------>|
      |    base64(paymentGroup))      |                             |
      |                               |<-- isValid: true -----------|
      |                               |                             |
      |                               |-- POST /settle ------------>|
      |                               |                             | (Co-signs Tx1,
      |                               |                             |  broadcasts ATG)
      |                               |<-- txId --------------------|
      |<-- HTTP 200 OK ---------------|                             |
      |    (Premium Report +          |                             |
      |     PAYMENT-RESPONSE header)  |                             |
```

---

## Backend API Endpoints

### 1. Payment Gated Resource Route
* **Endpoint**: `/api/x402/premium-supplier-report`
* **Method**: `GET`
* **Query Parameters**:
  * `supplier_id` (string): The ID of the supplier (e.g. `ALB-1001`)
* **Headers**:
  * `PAYMENT-SIGNATURE` / `X-PAYMENT` (string, optional): Base64-encoded JSON payment proof payload matching the x402 v2 spec.

### 2. HTTP Responses & Handshake Headers

#### Step A: Initial Challenge (402 Payment Required)
If no proof is provided, the server returns status code **402 Payment Required** along with:
* **Header**: `PAYMENT-REQUIRED` (Base64-encoded JSON requirements)
* **Response Body**:
```json
{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
      "amount": "50000",
      "maxAmountRequired": "50000",
      "payTo": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
      "asset": "10458941",
      "resource": "/api/x402/premium-supplier-report?supplier_id=ALB-1001",
      "extra": {
        "feePayer": "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA",
        "decimals": 6
      }
    }
  ],
  "suggestedParams": {
    "fee": 0,
    "genesisHash": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
    "genesisId": "testnet-v1.0",
    "firstValid": 31234500,
    "lastValid": 31235500,
    "minFee": 1000
  }
}
```

#### Step B: Verification Success
If the payment is verified and settled successfully by the facilitator or direct fallback, the server returns **HTTP 200 OK** along with:
* **Header**: `PAYMENT-RESPONSE` (Base64-encoded response details)
* **Response Body**: Premium Supplier Intelligence Report.

---

## Client Integration (React + Pera Wallet)

The client performs the following steps:

1. **Initial Call**: Calls `/api/x402/premium-supplier-report` without headers.
2. **Handle 402**: Extract `suggestedParams` from response body.
3. **Build ATG locally**:
   ```typescript
   // Tx0: AssetTransfer from buyer to treasury with fee = 0
   const tx0 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
     sender: buyerAddress,
     receiver: treasuryAddress,
     assetIndex: 10458941, // USDC
     amount: 50000,
     suggestedParams: { ...algodSp, fee: 0, flatFee: true }
   });

   // Tx1: Payment from feePayer to feePayer with fee = 2000
   const tx1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
     sender: feePayerAddress,
     receiver: feePayerAddress,
     amount: 0,
     suggestedParams: { ...algodSp, fee: 2000, flatFee: true }
   });

   // Assign Group ID
   algosdk.assignGroupID([tx0, tx1]);
   ```
4. **Sign Tx0**: Pass both transactions to Pera Wallet, but set `signers` array empty for Tx1 so Pera Wallet only requests signature for Tx0.
5. **Pack and Send**: Encode signed Tx0 and unsigned Tx1 as base64 MsgPack strings, wrap them in the `paymentPayload` envelope, base64 encode it, and send it as the `PAYMENT-SIGNATURE` header.
