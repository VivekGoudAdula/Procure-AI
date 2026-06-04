"""
x402-gated FastAPI routes for ProcureAI Premium Supplier Intelligence.

Routes:
  - GET /api/x402/premium-supplier-report  — payment-gated premium report
  - GET /api/x402/status                   — debug endpoint: current x402 configuration
"""
import base64
import json
import logging
from typing import Optional

from fastapi import APIRouter, Header, Query, Response, status

from x402.config import (
    X402_ASSET,
    X402_AVM_ADDRESS,
    X402_FACILITATOR_FEE_PAYER,
    X402_FACILITATOR_URL,
    X402_NETWORK,
    X402_PRICE,
    X402_SCHEME,
    X402_VERSION,
    X402_DEMO_FALLBACK,
)
from x402.resource_server import (
    get_base64_requirements,
    get_payment_requirements,
    get_suggested_params,
    verify_payment_proof,
)
from x402.premium_report import generate_premium_report

logger = logging.getLogger(__name__)

router = APIRouter(tags=["x402 Payments"])


@router.get("/api/x402/premium-supplier-report")
async def get_premium_supplier_report(
    response: Response,
    supplier_id: str = Query(..., description="Supplier ID to generate the premium report for"),
    payment_signature: Optional[str] = Header(None, alias="PAYMENT-SIGNATURE"),
    x_payment: Optional[str] = Header(None, alias="X-PAYMENT"),
) -> dict:
    """
    HTTP 402-guarded endpoint that serves a Premium Supplier Intelligence Report.

    Flow:
      1. No proof header → return 402 challenge with v2 paymentRequirements and suggestedParams.
      2. Invalid proof   → return 402 with error detail.
      3. Valid proof     → return full premium report + PAYMENT-RESPONSE header.

    The 402 response body includes suggestedParams so the frontend can dynamically
    build the Atomic Transaction Group (ATG) using real-time network parameters.
    """
    resource_path = f"/api/x402/premium-supplier-report?supplier_id={supplier_id}"
    proof = payment_signature or x_payment

    # ── Step 1: No payment proof — issue 402 challenge ────────────────────
    if not proof:
        requirements_b64 = get_base64_requirements(resource_path)
        requirements = get_payment_requirements(resource_path)
        suggested_params = get_suggested_params()

        response.status_code = status.HTTP_402_PAYMENT_REQUIRED
        response.headers["PAYMENT-REQUIRED"] = requirements_b64
        response.headers["Access-Control-Expose-Headers"] = "PAYMENT-REQUIRED, PAYMENT-RESPONSE"

        logger.info(f"[x402] 402 challenge issued for: {resource_path}")

        return {
            **requirements,
            "suggestedParams": suggested_params,
        }

    # ── Step 2: Verify payment proof via facilitator + on-chain fallback ──
    is_valid, tx_id = await verify_payment_proof(proof, resource_path)

    if not is_valid:
        requirements_b64 = get_base64_requirements(resource_path)
        requirements = get_payment_requirements(resource_path)
        suggested_params = get_suggested_params()

        response.status_code = status.HTTP_402_PAYMENT_REQUIRED
        response.headers["PAYMENT-REQUIRED"] = requirements_b64
        response.headers["Access-Control-Expose-Headers"] = "PAYMENT-REQUIRED, PAYMENT-RESPONSE"

        logger.warning(f"[x402] Invalid proof rejected for: {resource_path}")

        return {
            "error": "Payment proof invalid or unverifiable. Ensure your USDC transfer was signed correctly.",
            **requirements,
            "suggestedParams": suggested_params,
        }

    # ── Step 3: Proof valid — generate and return premium report ──────────
    logger.info(
        f"[x402] Payment verified (TxID: {tx_id}). Releasing premium report for supplier '{supplier_id}'."
    )
    report = generate_premium_report(supplier_id)

    # Attach PAYMENT-RESPONSE confirmation header
    resp_details = {
        "txId": tx_id,
        "status": "success",
        "network": X402_NETWORK,
        "asset": X402_ASSET,
        "amount": X402_PRICE,
    }
    resp_b64 = base64.b64encode(json.dumps(resp_details).encode("utf-8")).decode("utf-8")
    response.headers["PAYMENT-RESPONSE"] = resp_b64
    response.headers["Access-Control-Expose-Headers"] = "PAYMENT-REQUIRED, PAYMENT-RESPONSE"

    return report


@router.get("/api/x402/status")
async def get_x402_status() -> dict:
    """
    Debug endpoint returning the current x402 payment configuration.

    Useful for verifying that the backend is using the correct v2 settings
    before making a payment from the frontend.
    """
    return {
        "x402Version": X402_VERSION,
        "scheme": X402_SCHEME,
        "network": X402_NETWORK,
        "facilitatorUrl": X402_FACILITATOR_URL,
        "feePayer": X402_FACILITATOR_FEE_PAYER,
        "treasuryAddress": X402_AVM_ADDRESS,
        "asset": X402_ASSET,
        "assetDescription": "TestNet USDC (ASA ID 10458941)",
        "amount": X402_PRICE,
        "amountDescription": "50000 atomic units = 0.05 USDC (6 decimals)",
        "verificationMode": "facilitator_with_onchain_fallback",
        "demoResilienceFallback": X402_DEMO_FALLBACK,
    }
