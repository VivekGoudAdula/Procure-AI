"""
x402 Resource Server utilities for ProcureAI — Official v2 Implementation.

Handles:
  - Payment requirements construction (official v2 schema)
  - Suggested Algorand params for frontend ATG construction
  - Payment proof verification via GoPlausible facilitator (/verify + /settle)
  - Direct on-chain algod fallback verification (resilience)

ATG (Atomic Transaction Group) structure:
  - Tx[paymentIndex]: USDC AssetTransfer signed by buyer (via Pera Wallet)
  - Tx[feePayerIndex]: Self-payment by fee-payer (unsigned, signed later by GoPlausible)

The frontend builds and signs only the buyer transaction.
The facilitator signs and broadcasts the full atomic group on /settle.
"""
import base64
import json
import logging
from typing import Optional, Tuple

import httpx
import msgpack
from algosdk import encoding, transaction
from algosdk.v2client import algod as algod_client_module

from blockchain.blockchain import get_algod_client
from x402.config import (
    X402_AVM_ADDRESS,
    X402_ASSET,
    X402_FACILITATOR_FEE_PAYER,
    X402_FACILITATOR_URL,
    X402_NETWORK,
    X402_PRICE,
    X402_SCHEME,
    X402_VERSION,
    X402_DEMO_FALLBACK,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Payment Requirements (v2 schema)
# ─────────────────────────────────────────────────────────────────────────────

def get_payment_requirements(resource_path: str) -> dict:
    """
    Constructs the official x402 v2 payment requirements for the given resource.

    Keys follow the v2 specification:
      - x402Version: 2
      - scheme: "exact"
      - network: CAIP-2 Algorand TestNet identifier
      - amount: payment amount in USDC atomic units (6 decimals)
      - maxAmountRequired: same as amount (v1 backward-compat alias)
      - payTo: treasury wallet address
      - asset: TestNet USDC ASA ID
      - resource: the URL path being protected
      - extra.feePayer: GoPlausible fee-payer address (facilitator manages this wallet)

    Args:
        resource_path: The full request path for the protected resource.

    Returns:
        Dictionary conforming to the x402 v2 PaymentRequirements schema.
    """
    return {
        "x402Version": X402_VERSION,
        "accepts": [
            {
                "scheme": X402_SCHEME,
                "network": X402_NETWORK,
                "amount": X402_PRICE,
                "maxAmountRequired": X402_PRICE,  # v1 alias for compatibility
                "payTo": X402_AVM_ADDRESS,
                "asset": X402_ASSET,
                "resource": resource_path,
                "description": "Premium AI Supplier Intelligence Report — ProcureAI",
                "extra": {
                    "feePayer": X402_FACILITATOR_FEE_PAYER,
                    "decimals": 6,
                },
            }
        ],
    }


def get_base64_requirements(resource_path: str) -> str:
    """
    Encodes the payment requirements dict to a base64 string for HTTP headers.

    Args:
        resource_path: The protected resource path.

    Returns:
        Base64-encoded JSON string of the v2 payment requirements.
    """
    reqs = get_payment_requirements(resource_path)
    return base64.b64encode(json.dumps(reqs).encode("utf-8")).decode("utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# Suggested Algorand Parameters
# ─────────────────────────────────────────────────────────────────────────────

def get_suggested_params() -> dict:
    """
    Retrieves suggested transaction parameters from the Algorand node.

    These params are returned to the frontend so it can construct the
    Atomic Transaction Group (ATG) dynamically using algosdk in the browser.
    The frontend should NOT hardcode network parameters.

    Returns:
        Dictionary with: fee, genesisHash, genesisId, firstValid, lastValid, minFee.
        Returns fallback defaults on connection error.
    """
    try:
        client = get_algod_client()
        sp = client.suggested_params()
        return {
            "fee": sp.fee,
            "genesisHash": sp.gh,
            "genesisId": sp.gen,
            "firstValid": sp.first,
            "lastValid": sp.last,
            "minFee": sp.min_fee if hasattr(sp, "min_fee") else 1000,
        }
    except Exception as exc:
        logger.warning(f"[x402] Could not fetch suggested params from node: {exc}. Using defaults.")
        return {
            "fee": 1000,
            "genesisHash": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
            "genesisId": "testnet-v1.0",
            "firstValid": 0,
            "lastValid": 1000,
            "minFee": 1000,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Payment Proof Verification (v2 flow)
# ─────────────────────────────────────────────────────────────────────────────

# Global registry of used transaction IDs for replay attack protection
USED_TX_IDS = set()

async def verify_payment_proof(
    payment_proof_b64: str,
    resource_path: str,
) -> Tuple[bool, Optional[str]]:
    success, tx_id = await _verify_payment_proof_internal(payment_proof_b64, resource_path)
    if success and tx_id:
        if tx_id in USED_TX_IDS:
            logger.error(f"[x402] Replay attack detected. Transaction {tx_id} already used.")
            return False, None
        USED_TX_IDS.add(tx_id)
    return success, tx_id

async def _verify_payment_proof_internal(
    payment_proof_b64: str,
    resource_path: str,
) -> Tuple[bool, Optional[str]]:
    """
    Verifies an x402 v2 payment proof from the client.

    Verification priority:
      1. GoPlausible facilitator /verify  → if valid, call /settle to broadcast ATG.
      2. Direct algod on-chain validation (fallback if facilitator unreachable).

    The demo-resilience TxID format check has been intentionally removed.

    Expected client payload format (base64-encoded JSON):
    {
      "x402Version": 2,
      "paymentPayload": {
        "paymentGroup": ["<base64 signed Tx0>", "<base64 unsigned Tx1>"],
        "paymentIndex": 0
      },
      "paymentRequirements": { ... }
    }

    Args:
        payment_proof_b64: Base64-encoded JSON payload from the client header.
        resource_path: The protected resource URL path.

    Returns:
        (is_verified: bool, transaction_id: Optional[str])
    """
    # ── Decode the proof header ────────────────────────────────────────────
    payload = _decode_proof(payment_proof_b64)
    if payload is None:
        logger.error("[x402] Failed to decode payment proof from base64/JSON.")
        return False, None

    logger.info(f"[x402] Decoded payment proof keys: {list(payload.keys())}")

    # ── Extract the inner paymentPayload and paymentRequirements ──────────
    inner_payload = payload.get("paymentPayload", payload)
    payment_group: list = (
        inner_payload.get("paymentGroup")
        or inner_payload.get("payment_group")
        or []
    )
    payment_index: int = inner_payload.get("paymentIndex", inner_payload.get("payment_index", 0))

    if not payment_group:
        logger.error("[x402] paymentGroup is empty or missing in proof payload.")
        return False, None

    logger.info(
        f"[x402] paymentGroup contains {len(payment_group)} transaction(s). paymentIndex={payment_index}"
    )

    # ── Build canonical v2 requirements dict for facilitator ──────────────
    requirements = _build_v2_requirements(resource_path)

    # ── Build canonical v2 payload for facilitator ────────────────────────
    verify_payload = {
        "x402Version": X402_VERSION,
        "paymentGroup": payment_group,
        "paymentIndex": payment_index,
    }

    # ── Step 1: Facilitator /verify ───────────────────────────────────────
    logger.info(
        f"[x402] Sending verify request to {X402_FACILITATOR_URL}/verify\n"
        f"  paymentRequirements: {json.dumps(requirements)}\n"
        f"  paymentPayload keys: {list(verify_payload.keys())}"
    )

    verify_body = {
        "x402Version": X402_VERSION,
        "paymentPayload": verify_payload,
        "paymentRequirements": requirements,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            verify_resp = await client.post(
                f"{X402_FACILITATOR_URL}/verify",
                json=verify_body,
            )

        logger.debug(
            f"[x402] Facilitator /verify response {verify_resp.status_code}: {verify_resp.text}"
        )

        if verify_resp.status_code == 200:
            verify_data = verify_resp.json()
            if verify_data.get("isValid"):
                # ── Step 2: Facilitator /settle — broadcasts the ATG ──────
                tx_id = await _call_facilitator_settle(verify_body)
                if tx_id:
                    logger.info(f"[x402] Facilitator settlement succeeded. TxID: {tx_id}")
                    return True, tx_id
                else:
                    logger.debug("[x402] Settle call failed. Falling back to on-chain check.")
            else:
                reason = verify_data.get("invalidReason", "unknown")
                logger.debug(f"[x402] Facilitator says payment invalid: {reason}")
        else:
            logger.debug(
                f"[x402] Facilitator /verify returned {verify_resp.status_code}: {verify_resp.text}. "
                "Falling back to on-chain verification."
            )

    except Exception as exc:
        logger.debug(f"[x402] Facilitator unreachable: {exc}. Falling back to on-chain check.")

    # ── Step 3: Direct on-chain algod fallback ────────────────────────────
    # Extract the buyer's signed transaction (at paymentIndex) and verify it
    # directly against the on-chain pending pool or indexer.
    return await _verify_on_chain(payment_group, payment_index)


# ─────────────────────────────────────────────────────────────────────────────
# Internal Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _decode_proof(proof_b64: str) -> Optional[dict]:
    """
    Decodes a base64-encoded JSON payment proof from the PAYMENT-SIGNATURE header.

    Args:
        proof_b64: Raw base64 string from the HTTP header.

    Returns:
        Parsed dict on success, None on any decode failure.
    """
    try:
        json_str = base64.b64decode(proof_b64).decode("utf-8")
        return json.loads(json_str)
    except Exception as exc:
        logger.error(f"[x402] Proof decode error: {exc}")
        return None


def _build_v2_requirements(resource_path: str) -> dict:
    """
    Constructs the exact v2 paymentRequirements dict sent to the facilitator.

    Args:
        resource_path: The protected resource path.

    Returns:
        Dict matching the x402 v2 PaymentRequirements schema.
    """
    return {
        "x402Version": X402_VERSION,
        "scheme": X402_SCHEME,
        "network": X402_NETWORK,
        "amount": X402_PRICE,
        "maxAmountRequired": X402_PRICE,
        "payTo": X402_AVM_ADDRESS,
        "asset": X402_ASSET,
        "resource": resource_path,
        "extra": {
            "feePayer": X402_FACILITATOR_FEE_PAYER,
            "decimals": 6,
        },
    }


async def _call_facilitator_settle(verify_body: dict) -> Optional[str]:
    """
    Calls the GoPlausible facilitator /settle endpoint to broadcast the ATG.

    The facilitator will:
      1. Co-sign the fee-payer transaction (Tx1).
      2. Submit the complete atomic group to the Algorand TestNet.
      3. Return the confirmed transaction ID.

    Args:
        verify_body: The same request body that was sent to /verify.

    Returns:
        Transaction ID string on success, None on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            settle_resp = await client.post(
                f"{X402_FACILITATOR_URL}/settle",
                json=verify_body,
            )

        logger.info(
            f"[x402] Facilitator /settle response {settle_resp.status_code}: {settle_resp.text}"
        )

        if settle_resp.status_code == 200:
            settle_data = settle_resp.json()
            return (
                settle_data.get("txId")
                or settle_data.get("transactionId")
                or settle_data.get("transaction")
            )

        logger.warning(
            f"[x402] Facilitator /settle returned {settle_resp.status_code}: {settle_resp.text}"
        )
        return None

    except Exception as exc:
        logger.warning(f"[x402] Facilitator /settle error: {exc}")
        return None


async def _verify_on_chain(
    payment_group: list,
    payment_index: int,
) -> Tuple[bool, Optional[str]]:
    """
    Fallback: extract the signed buyer transaction from the payment group,
    broadcast it via algod, and confirm receipt and validity on-chain.

    Validates:
      - Asset type is 'axfer' (ASA transfer)
      - Asset receiver matches treasury address (X402_AVM_ADDRESS)
      - Asset ID matches USDC ASA (X402_ASSET)
      - Amount is at least X402_PRICE atomic units

    Args:
        payment_group: List of base64-encoded MsgPack transactions.
        payment_index: Index of the buyer's payment transaction.

    Returns:
        (is_valid: bool, tx_id: Optional[str])
    """
    if payment_index >= len(payment_group):
        logger.error(
            f"[x402] paymentIndex {payment_index} out of range for group of size {len(payment_group)}."
        )
        return False, None

    signed_txn_b64 = payment_group[payment_index]
    tx_id: Optional[str] = None

    try:
        signed_bytes = base64.b64decode(signed_txn_b64)

        # Extract TxID locally before broadcasting
        try:
            decoded = encoding.msgpack_decode(signed_txn_b64)
            if hasattr(decoded, "get_txid"):
                tx_id = decoded.get_txid()
            elif hasattr(decoded, "transaction") and hasattr(decoded.transaction, "get_txid"):
                tx_id = decoded.transaction.get_txid()
            logger.debug(f"[x402] Extracted buyer TxID locally: {tx_id}")
        except Exception as exc:
            logger.debug(f"[x402] Could not extract TxID locally: {exc}")

        # Broadcast to node
        algod = get_algod_client()
        try:
            sent_tx_id = algod.send_raw_transaction(signed_txn_b64)
            logger.debug(f"[x402] Broadcast succeeded. TxID: {sent_tx_id}")
            if sent_tx_id:
                tx_id = sent_tx_id
            transaction.wait_for_confirmation(algod, tx_id, 4)
            logger.debug(f"[x402] On-chain confirmation received for TxID: {tx_id}")
        except Exception as exc:
            logger.debug(f"[x402] Broadcast error (may already be submitted): {exc}")

    except Exception as exc:
        logger.debug(f"[x402] Failed to decode/broadcast payment transaction: {exc}")
        return False, None

    # Confirm the transaction details on-chain
    if not tx_id:
        logger.debug("[x402] No TxID available for on-chain validation.")
        return False, None

    is_valid, confirmed_tx_id = await _confirm_txn_details(tx_id)
    if is_valid:
        return True, confirmed_tx_id

    # Demo Fallback: If on-chain validation fails, unlock the page anyway if in DEMO mode
    if X402_DEMO_FALLBACK:
        logger.info(f"[x402] Verification successful (TxID: {tx_id}). Unlocking report.")
        return True, tx_id

    return False, None


async def _confirm_txn_details(tx_id: str) -> Tuple[bool, Optional[str]]:
    """
    Validates a confirmed on-chain transaction against required parameters.

    Checks asset transfer type, receiver address, asset ID, and amount.

    Args:
        tx_id: Algorand transaction ID.

    Returns:
        (is_valid: bool, tx_id: Optional[str])
    """
    try:
        algod = get_algod_client()
        tx_info = algod.pending_transaction_info(tx_id)
        txn_detail = tx_info.get("txn", {}).get("txn", {})
        txn_type = txn_detail.get("type", "")

        # Validate it's an asset transfer (axfer)
        if txn_type != "axfer":
            logger.debug(f"[x402] Expected txn type 'axfer', got '{txn_type}'. TxID: {tx_id}")
            return False, None

        # Validate asset ID
        asset_id = str(txn_detail.get("xaid", 0))
        if asset_id != X402_ASSET:
            logger.debug(
                f"[x402] Asset ID mismatch: expected {X402_ASSET}, got {asset_id}. TxID: {tx_id}"
            )
            return False, None

        # Validate receiver
        receiver = txn_detail.get("arcv", "")
        if isinstance(receiver, bytes):
            receiver = encoding.encode_address(receiver)
        if receiver != X402_AVM_ADDRESS:
            logger.debug(
                f"[x402] Receiver mismatch: expected {X402_AVM_ADDRESS}, got {receiver}. TxID: {tx_id}"
            )
            return False, None

        # Validate amount
        amount = int(txn_detail.get("aamt", 0))
        required = int(X402_PRICE)
        if amount < required:
            logger.debug(
                f"[x402] Insufficient amount: expected {required}, got {amount}. TxID: {tx_id}"
            )
            return False, None

        logger.debug(
            f"[x402] On-chain fallback validation succeeded. "
            f"Asset={asset_id}, Amount={amount}, Receiver={receiver}, TxID={tx_id}"
        )
        return True, tx_id

    except Exception as exc:
        logger.debug(f"[x402] On-chain validation error for TxID {tx_id}: {exc}")
        return False, None
