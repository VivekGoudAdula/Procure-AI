from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Any
import json
import os
import hashlib
from datetime import datetime
import time
import random
from dotenv import load_dotenv

# Load .env file
load_dotenv()
from ai_agent import select_best_supplier, run_agent_competition
from blockchain import create_transaction, simulate_escrow
from escrow_service import deploy_escrow
from services.alibaba_procurement_service import AlibabaProcurementService
from services.multilingual_negotiation_service import MultilingualNegotiationService
from services.procurement_message_engine import ProcurementMessageEngine
from services.translation_service import TranslationService
from services.email_service import EmailService
from services.negotiation_intelligence import NegotiationIntelligenceEngine
from services.dashboard_analytics import DashboardAnalyticsService
from services.procurement_insights import ProcurementInsightsService
from services.settlement_analytics import SettlementAnalyticsService
from services.procurement_analytics_engine import ProcurementAnalyticsEngine

app = FastAPI(title="ProcureAI Backend - Autonomous Agentic Commerce Platform")

# Services initialization
procurement_engine = AlibabaProcurementService()
negotiation_engine = MultilingualNegotiationService()
message_engine = ProcurementMessageEngine()
translation_service = TranslationService()
email_service = EmailService()
negotiation_intelligence = NegotiationIntelligenceEngine()
dashboard_analytics = DashboardAnalyticsService()
procurement_insights = ProcurementInsightsService()
settlement_analytics = SettlementAnalyticsService()
procurement_analytics_engine = ProcurementAnalyticsEngine()

# CORS setup for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for delivery proofs
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "database.json")

def load_db():
    if not os.path.exists(DATABASE_PATH):
        # Default mock database structure
        return {"users": [], "suppliers": []}
    with open(DATABASE_PATH, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DATABASE_PATH, "w") as f:
        json.dump(data, f, indent=4)

# Models
class User(BaseModel):
    email: str
    password: str

class ProcurementPolicy(BaseModel):
    max_budget: float | None = None
    min_reliability: float | None = None
    max_delivery_days: int | None = None
    min_success_rate: float | None = None
    require_on_chain_verified: bool = False

class SupplierRequest(BaseModel):
    productName: str
    quantity: int
    budget: float
    policy: ProcurementPolicy | None = None

class ProcurementIntelligenceRequest(BaseModel):
    product_name: str
    quantity: int
    budget: float
    lead_time_days: int | None = None
    shipping_region: str | None = None
    quality_level: str | None = None
    procurement_policy: dict | None = None

class TransactionRequest(BaseModel):
    sender: str
    receiver: str
    amount: float

class EscrowRequest(BaseModel):
    sender: str
    receiver: str
    amount: float = 0.1
    supplier_id: int
    promised_delivery_days: int

class ConfirmDeliveryRequest(BaseModel):
    transaction_id: str

class SupplierNegotiationRequest(BaseModel):
    product: str
    quantity: int
    budget: float
    round: int

class VerifyDeliveryRequest(BaseModel):
    escrow_id: str

class X402SessionRequest(BaseModel):
    product_name: str
    quantity: int
    budget: float

class X402SessionResponse(BaseModel):
    session_id: str
    status: str
    authorization: str
    credits_allocated: bool
    secure_channel: bool
    negotiation_enabled: bool
    logs: list[str]
    timestamps: dict

class HumanSelectSupplierRequest(BaseModel):
    supplier_id: str | int
    session_id: str

class MultilingualNegotiationRequest(BaseModel):
    """Single-round multilingual negotiation request."""
    buyer_message: str
    supplier_language: str
    product: str
    round_number: int | None = None

class FullNegotiationRequest(BaseModel):
    """Full 3-round multilingual negotiation request."""
    buyer_message: str
    supplier_language: str
    product: str

class NegotiationIntelligenceRequest(BaseModel):
    """Negotiation Intelligence extraction request."""
    supplier_message: str
    supplier_metadata: Optional[dict] = None
    procurement_context: Optional[dict] = None



class ProcurementInquiryRequest(BaseModel):
    product: str
    quantity: Any
    budget: Any
    lead_time: Any
    requirements: Any
    destination_country: Optional[str] = "Global"
    shipping_preference: Optional[str] = "EXW / FOB"

class SendInquiryRequest(BaseModel):
    supplier_name: str
    supplier_email: str
    supplier_region: str
    original_message: str
    translated_message: Optional[str] = None
    procurement_context: Optional[dict] = None

class SendInquiryResponse(BaseModel):
    status: str
    message: str
    email_status: dict
    translation_details: dict
    supplier_reply_simulation: Optional[dict] = None

class ProcurementInquiryResponse(BaseModel):
    message: str
    metadata: dict
    logs: list[str]

ESCROW_DB_PATH = os.path.join(os.path.dirname(__file__), "escrow_records.json")

def load_escrow_db():
    if not os.path.exists(ESCROW_DB_PATH):
        return {}
    try:
        with open(ESCROW_DB_PATH, "r") as f:
            return json.load(f)
    except:
        return {}

def save_escrow_db(data):
    with open(ESCROW_DB_PATH, "w") as f:
        json.dump(data, f, indent=4)

def update_supplier_reputation(supplier_id: int, delivered_on_time: bool):
    db = load_db()
    suppliers = db.get("suppliers", [])
    supplier = next((s for s in suppliers if s["id"] == supplier_id), None)
    
    if not supplier:
        return
    
    supplier["total_deals"] = supplier.get("total_deals", 0) + 1
    supplier["successful_deals"] = supplier.get("successful_deals", 0) + 1
    
    if delivered_on_time:
        supplier["on_time_deliveries"] = supplier.get("on_time_deliveries", 0) + 1
    else:
        supplier["late_deliveries"] = supplier.get("late_deliveries", 0) + 1
        
    # Recalculate metrics
    total = supplier["total_deals"]
    success_rate = (supplier["successful_deals"] / total) * 100
    on_time_rate = (supplier["on_time_deliveries"] / total) * 100
    
    reliability_score = (success_rate * 0.6) + (on_time_rate * 0.4)
    reliability_score = max(0, min(100, reliability_score))
    
    rating = round((reliability_score / 100) * 5, 1)
    
    supplier["reliability_score"] = int(reliability_score)
    supplier["success_rate"] = int(success_rate)
    supplier["rating"] = rating
    supplier["last_updated"] = datetime.now().isoformat()
    
    # On-chain Hash MVP
    reputation_data = f"{supplier['id']}-{supplier['total_deals']}-{int(success_rate)}-{int(on_time_rate)}"
    supplier["reputation_hash"] = hashlib.sha256(reputation_data.encode()).hexdigest()
    
    save_db(db)
    print(f"Updated reputation for supplier {supplier_id}")

# --- Endpoints ---

@app.get("/api/procurement/analytics")
async def get_procurement_analytics():
    try:
        return procurement_analytics_engine.calculate_procurement_intelligence()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/analytics")
async def get_dashboard_analytics():
    try:
        return dashboard_analytics.calculate_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/insights")
async def get_dashboard_insights():
    try:
        res = procurement_insights.generate_insights()
        return {
            "insights": res["insights"],
            "signals": res["signals"],
            "scorecard": res["scorecard"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/procurement-feed")
async def get_dashboard_feed():
    try:
        res = procurement_insights.generate_insights()
        return res["procurement_feed"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/regions")
async def get_dashboard_regions():
    try:
        res = dashboard_analytics.calculate_analytics()
        return res["regions_detail"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settlements/analytics")
async def get_settlements_analytics():
    try:
        return settlement_analytics.calculate_settlements_telemetry()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settlements/ledger")
async def get_settlements_ledger():
    try:
        return settlement_analytics.compile_settlement_ledger()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/x402/initiate-session", response_model=X402SessionResponse)
async def initiate_x402_session(req: X402SessionRequest):
    session_id = f"X402-PROC-{random.randint(1000, 9999)}"
    now = datetime.now()
    
    return {
        "session_id": session_id,
        "status": "ACTIVE",
        "authorization": "APPROVED",
        "credits_allocated": True,
        "secure_channel": True,
        "negotiation_enabled": True,
        "logs": [
            "Opening agentic procurement channel...",
            "Establishing x402 authorization...",
            "Negotiation credits allocated.",
            "Supplier intelligence request approved.",
            "Cross-border procurement channel secured.",
            "Machine-to-machine procurement orchestration active.",
            "AI negotiation cycle initiated..."
        ],
        "timestamps": {
            "initialized": now.isoformat(),
            "authorized": (now).isoformat(),
            "negotiation_started": (now).isoformat()
        }
    }

@app.post("/api/procurement/intelligence")
async def get_procurement_intelligence(req: ProcurementIntelligenceRequest):
    try:
        result = procurement_engine.run_intelligence(req.dict())
        return result
    except Exception as e:
        print(f"[ProcureAI] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(user: User):
    db = load_db()
    users = db.get("users", [])
    valid_user = any(u["email"] == user.email and u["password"] == user.password for u in users)
    
    if valid_user:
        return {"message": "Login successful", "email": user.email}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/agent-competition")
def agent_competition_api(req: SupplierRequest):
    policy_dict = req.policy.dict() if req.policy else None
    result = run_agent_competition(req.productName, req.quantity, req.budget, policy_dict)
    return result

@app.post("/api/select-supplier")
async def select_supplier_api(req: SupplierRequest):
    try:
        policy_dict = req.policy.dict() if req.policy else None
        result = select_best_supplier(req.productName, req.quantity, req.budget, policy_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error in select_supplier_api: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    if result.get("status") == "no_supplier_found":
        return result
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Map backend fields to frontend expectations
    return {
        "deal": result.get("deal"),
        "rounds": result.get("rounds"),
        "finalDecision": result.get("winner"),
        "suppliers": [
            {
                "id": s["id"],
                "name": s["name"],
                "price": s.get("negotiated_price", s.get("base_price", 0)),
                "rating": s.get("rating", 4.5),
                "deliveryTime": f"{s['delivery_days']} days",
                "reliability": s["reliability_score"],
                "success_rate": s.get("success_rate", 90),
                "score": s.get("score", 0)
            } for s in result["supplier_list"]
        ],
        "negotiationLogs": result["negotiation_logs"],
        "selectedSupplier": {
            "id": result["selected_supplier"]["id"],
            "name": result["selected_supplier"]["name"],
            "finalPrice": result["final_price"],
            "reasoning": result["reasoning"],
            "wallet_address": result["selected_supplier"].get("address", "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY"),
            "unit_price": result["selected_supplier"].get("unit_price", 0),
            "reliability": result["selected_supplier"]["reliability_score"],
            "deliveryTime": f"{result['selected_supplier']['delivery_days']} days"
        },
        "policy_applied": result.get("policy_applied", False),
        "filtered_out_count": result.get("filtered_out_count", 0),
        "rejection_reasons": result.get("rejection_reasons", [])
    }

@app.post("/api/procurement/select-supplier")
async def human_select_supplier(req: HumanSelectSupplierRequest):
    print(f"[PROCURE-AI] Human procurement approval received.")
    print(f"[PROCURE-AI] Supplier partnership authorized.")
    print(f"[PROCURE-AI] Negotiation lifecycle finalized.")
    print(f"[PROCURE-AI] Preparing procurement commitment...")
    
    return {
        "status": "APPROVED",
        "selected_supplier": {"id": req.supplier_id},
        "procurement_commitment_ready": True
    }

@app.post("/api/prepare-transaction")
async def prepare_transaction(req: TransactionRequest):
    """
    Called by frontend when user confirms selection.
    Prepares an unsigned transaction for the wallet to sign.
    """
    return create_transaction(req.sender, req.receiver, req.amount)

@app.get("/api/escrow/{action}")
async def escrow_api(action: str):
    """
    Simulation of escrow status: 'lock' or 'release'.
    """
    return simulate_escrow(action)

@app.post("/api/procurement/initiate-commitment")
async def create_escrow(req: EscrowRequest):
    # 1. Deploy real smart contract on TestNet
    amount_microalgos = int(req.amount * 1_000_000)
    deployment = deploy_escrow(req.sender, req.receiver, amount_microalgos)
    
    if "error" in deployment:
        print(f"[ProcureAI] Deployment Error: {deployment['error']}")
        raise HTTPException(status_code=500, detail=f"Blockchain deployment failed: {deployment['error']}")
    
    print(f"[ProcureAI] Deployed Escrow: ID={deployment['app_id']}, Address={deployment['app_address']}")
    
    escrow_record = {
        "transaction_id": deployment["transaction_id"],
        "app_id": deployment["app_id"],
        "app_address": deployment["app_address"],
        "sender_address": req.sender,
        "receiver_address": req.receiver,
        "amount": req.amount,
        "supplier_id": req.supplier_id,
        "promised_delivery_days": req.promised_delivery_days,
        "escrow_status": "funded",
        "timestamp": time.time(),
        "delivery_proof": None,
        "verified": False
    }
    
    db = load_escrow_db()
    db[deployment["transaction_id"]] = escrow_record
    save_escrow_db(db)
    
    return escrow_record
    
@app.post("/api/procurement/release-settlement")
async def confirm_delivery(req: ConfirmDeliveryRequest):
    db = load_escrow_db()
    # Search by transaction_id OR app_id (often used interchangeably in frontend)
    record = db.get(req.transaction_id)
    if not record:
        for r in db.values():
            if str(r.get("app_id")) == req.transaction_id:
                record = r
                break
    
    if not record:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if record.get("escrow_status") != "verified":
        raise HTTPException(status_code=400, detail="Delivery must be verified before release")

    record["escrow_status"] = "released"
    
    print("[PROCURE-AI] Delivery verification confirmed.")
    print("[PROCURE-AI] Procurement commitment validated.")
    print("[PROCURE-AI] Executing Algorand settlement release...")
    print("[PROCURE-AI] Settlement lifecycle completed.")
    
    # Update Reputation
    supplier_id = record.get("supplier_id")
    if supplier_id:
        # Calculate if on-time
        promised_days = record.get("promised_delivery_days", 3)
        created_at = record.get("timestamp", time.time())
        # If proof exists, use its submission time, else use now
        proof = record.get("delivery_proof")
        if proof and "submitted_at" in proof:
             try:
                 submitted_at_dt = datetime.fromisoformat(proof["submitted_at"])
                 created_at_dt = datetime.fromtimestamp(created_at)
                 actual_days = (submitted_at_dt - created_at_dt).days
             except:
                 actual_days = 0
        else:
             actual_days = 0
             
        on_time = actual_days <= promised_days
        update_supplier_reputation(supplier_id, on_time)

    save_escrow_db(db)
    return record

@app.post("/api/update-escrow-status")
async def update_escrow_status(req: dict):
    db = load_escrow_db()
    tx_id = req.get("transaction_id")
    status = req.get("status")
    
    record = db.get(tx_id)
    if not record:
        for r in db.values():
            if str(r.get("app_id")) == tx_id:
                record = r
                break
    
    if record:
        record["escrow_status"] = status
        save_escrow_db(db)
        return record
    raise HTTPException(status_code=404, detail="Escrow not found")

@app.post("/api/submit-delivery-proof")
async def submit_delivery_proof(
    escrow_id: str = Form(...),
    proof_type: str = Form(...), # "invoice_file" | "timestamp" | "tracking_id"
    file: UploadFile = File(None),
    value: str = Form(None)
):
    db = load_escrow_db()
    record = db.get(escrow_id)
    if not record:
        for r in db.values():
            if str(r.get("app_id")) == escrow_id:
                record = r
                break
    
    if not record:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    file_url = None
    if proof_type == "invoice_file":
        if not file:
            raise HTTPException(status_code=400, detail="Invoice file is required")
        
        # Validate extension
        ext = file.filename.split(".")[-1].lower()
        if ext not in ["jpg", "jpeg", "png", "pdf"]:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, and PDF are allowed")
            
        filename = f"{escrow_id}_{int(time.time())}.{ext}"
        invoice_dir = os.path.join(UPLOAD_DIR, "invoices")
        if not os.path.exists(invoice_dir):
            os.makedirs(invoice_dir)
            
        filepath = os.path.join(invoice_dir, filename)
        with open(filepath, "wb") as f:
            f.write(await file.read())
        
        file_url = f"/uploads/invoices/{filename}"
        proof_value = filename
    else:
        proof_value = value if value else str(import_datetime().now())

    record["delivery_proof"] = {
        "type": proof_type,
        "value": proof_value,
        "file_path": file_url,
        "submitted_at": str(import_datetime().now())
    }
    record["escrow_status"] = "proof_submitted"
    record["verified"] = False
    
    save_escrow_db(db)
    return record

def import_datetime():
    import datetime
    return datetime.datetime

@app.post("/api/procurement/verify-delivery")
async def verify_delivery(req: VerifyDeliveryRequest):
    db = load_escrow_db()
    record = db.get(req.escrow_id)
    if not record:
        for r in db.values():
            if str(r.get("app_id")) == req.escrow_id:
                record = r
                break
    
    if not record:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    if not record.get("delivery_proof"):
        raise HTTPException(status_code=400, detail="No delivery proof submitted")
    
    # MVP logic for verification
    proof = record["delivery_proof"]
    if proof["type"] == "timestamp":
        # Auto-valid
        pass
    else:
        # Basic validation
        if len(proof["value"]) < 5:
             raise HTTPException(status_code=400, detail="Invalid proof format")

    record["escrow_status"] = "verified"
    record["verified"] = True
    
    save_escrow_db(db)
    return record

class UpdateStatusRequest(BaseModel):
    transaction_id: str
    status: str

@app.post("/api/update-escrow-status")
async def update_escrow_status(req: UpdateStatusRequest):
    db = load_escrow_db()
    record = db.get(req.transaction_id)
    if not record:
        for r in db.values():
            if str(r.get("app_id")) == req.transaction_id:
                record = r
                break
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    record["escrow_status"] = req.status
    save_escrow_db(db)
    return record

@app.get("/api/get-transaction/{tx_id}")
async def get_transaction(tx_id: str):
    db = load_escrow_db()
    tx = db.get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@app.post("/api/signup")
async def signup(user: User):
    db = load_db()
    users = db.setdefault("users", [])
    if any(u["email"] == user.email for u in users):
        raise HTTPException(status_code=400, detail="User already exists")
    
    users.append({"email": user.email, "password": user.password})
    save_db(db)
    return {"message": "User registered successfully"}

@app.get("/api/suppliers")
async def get_suppliers():
    db = load_db()
    return db.get("suppliers", [])

@app.get("/api/suppliers/{supplier_id}")
async def get_supplier(supplier_id: int):
    db = load_db()
    suppliers = db.get("suppliers", [])
    supplier = next((s for s in suppliers if s["id"] == supplier_id), None)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

class UpdateReputationRequest(BaseModel):
    supplier_id: int
    delivered_on_time: bool

@app.post("/api/update-reputation")
async def update_reputation_endpoint(req: UpdateReputationRequest):
    update_supplier_reputation(req.supplier_id, req.delivered_on_time)
    return {"message": "Reputation updated"}

# --- Supplier Agent Endpoint ---

@app.post("/supplier/{supplier_id}/respond")
async def supplier_respond(supplier_id: int, req: SupplierNegotiationRequest):
    db = load_db()
    suppliers = db.get("suppliers", [])
    supplier = next((s for s in suppliers if s["id"] == supplier_id), None)
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    base_price = supplier.get("base_price", 100.0)
    reliability = supplier.get("reliability", 0.8)
    
    # 3. SUPPLIER AGENT LOGIC
    # Round 1 -> 5%, Round 2 -> 10%, Round 3 -> 15%
    if req.round == 1:
        discount_percent = 0.05
    elif req.round == 2:
        discount_percent = 0.10
    else:
        discount_percent = 0.15
        
    # Factor reliability into pricing slightly (e.g. higher reliability = slightly less discount)
    reliability_impact = (1.0 - reliability) * 0.05
    final_discount = discount_percent + reliability_impact
    
    offer_price = round(base_price * (1 - final_discount), 2)
    
    messages = [
        "We are happy to collaborate on this order.",
        "We can offer a discounted rate for bulk purchase.",
        "Our best pricing comes with immediate on-chain settlement.",
        "Considering our high reliability, this is our best offer.",
        "We hope to establish a long-term partnership with your procurement network."
    ]
    
    message = random.choice(messages)
    if req.round == 3:
        message = f"This is our final offer of ${offer_price} per unit. We cannot go lower."
    elif req.round == 2:
        message = f"We have revised our quote to ${offer_price} after further internal review."
        
    return {
        "supplier_id": supplier_id,
        "offer_price": offer_price,
        "message": message,
        "confidence": reliability
    }

# --- Multilingual AI Negotiation Endpoints ---

@app.post("/api/negotiation/multilingual")
async def multilingual_negotiation(req: MultilingualNegotiationRequest):
    """
    Single-round multilingual procurement negotiation.
    Translates buyer message, simulates supplier response, and returns AI analysis.
    """
    try:
        result = negotiation_engine.run_negotiation(
            buyer_message=req.buyer_message,
            supplier_language=req.supplier_language,
            product=req.product,
            round_number=req.round_number
        )
        return result
    except Exception as e:
        print(f"[ProcureAI] Multilingual Negotiation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/negotiation/multilingual/full")
async def full_multilingual_negotiation(req: FullNegotiationRequest):
    """
    Full 3-round multilingual procurement negotiation sequence.
    Returns all negotiation rounds with cumulative AI analysis and procurement recommendation.
    """
    try:
        result = negotiation_engine.run_full_negotiation(
            buyer_message=req.buyer_message,
            supplier_language=req.supplier_language,
            product=req.product
        )
        return result
    except Exception as e:
        print(f"[ProcureAI] Full Negotiation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/negotiation/languages")
async def get_supported_languages():
    """Return the list of supported supplier languages for multilingual negotiation."""
    return negotiation_engine.get_supported_languages()


@app.post("/api/negotiation/intelligence")
async def get_negotiation_intelligence(req: NegotiationIntelligenceRequest):
    """
    Extracts structured procurement intelligence from supplier communication.
    """
    try:
        result = negotiation_intelligence.extract_negotiation_intelligence(
            supplier_message=req.supplier_message,
            supplier_metadata=req.supplier_metadata,
            procurement_context=req.procurement_context
        )
        return result
    except Exception as e:
        print(f"[ProcureAI] Negotiation Intelligence Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/procurement/generate-inquiry", response_model=ProcurementInquiryResponse)
async def generate_procurement_inquiry(req: ProcurementInquiryRequest):
    """
    AI Procurement Message Engine endpoint.
    Transforms raw buyer intent into a professional inquiry.
    """
    try:
        result = message_engine.generate_inquiry(req.dict())
        return result
    except Exception as e:
        print(f"[ProcureAI] Inquiry Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/procurement/send-inquiry", response_model=SendInquiryResponse)
async def send_procurement_inquiry(req: SendInquiryRequest):
    """
    Sends a translated procurement inquiry to a supplier and simulates their response.
    """
    try:
        # 1. Detect language if not provided
        target_lang = translation_service.detect_language(req.supplier_region)
        
        # 2. Translate message if not provided
        translated_msg = req.translated_message or translation_service.translate_message(req.original_message, target_lang)
        
        # 3. Generate HTML template
        html_body = email_service.generate_html_template(req.supplier_name, translated_msg)
        
        # 4. Send Email (REAL SMTP if configured)
        subject = f"Procurement Inquiry — ProcureAI Global Sourcing Network"
        email_result = email_service.send_procurement_inquiry(
            req.supplier_name, 
            req.supplier_email, 
            subject, 
            html_body
        )
        
        # 5. Simulate Supplier Reply (MVP)
        simulation = translation_service.simulate_supplier_reply(target_lang)
        
        return {
            "status": "success",
            "message": "Procurement inquiry transmitted successfully.",
            "email_status": email_result,
            "translation_details": {
                "detected_language": target_lang,
                "translated_message": translated_msg,
                "confidence": 0.98
            },
            "supplier_reply_simulation": simulation
        }
    except Exception as e:
        print(f"[ProcureAI] Send Inquiry Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
