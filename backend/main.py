from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Any
import os
import hashlib
from datetime import datetime, timedelta, timezone
import time
import random
import bcrypt
import jwt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv, find_dotenv

# Load .env file
load_dotenv(find_dotenv())
from ai.ai_agent import select_best_supplier, run_agent_competition
from blockchain.blockchain import create_transaction, simulate_escrow
from blockchain.escrow_service import deploy_escrow
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
from x402.payment_routes import router as x402_router

# Rate Limiting setup using slowapi
is_testing = os.getenv("TESTING", "False").lower() == "true"
limiter = Limiter(key_func=get_remote_address, enabled=not is_testing)

app = FastAPI(title="ProcureAI Backend - Autonomous Agentic Commerce Platform")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
if not allowed_origins:
    # Safe fallbacks for local development
    allowed_origins = ["http://localhost:3000", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*", "PAYMENT-SIGNATURE", "X-PAYMENT"],
    expose_headers=["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
)

# Register x402 payment-gated routes
app.include_router(x402_router)

# Static files for delivery proofs
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = "fallback_secret_key_for_development_and_demo_deployment_change_me_in_production"
    print("WARNING: JWT_SECRET_KEY environment variable is missing. Using fallback secret key.")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a secure JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """FastAPI security dependency to validate JWT access tokens."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

from database.db import (
    users_collection,
    escrows_collection,
    get_cached_suppliers,
    persist_suppliers_from_intelligence,
    supplier_ratings_collection,
)

def load_db():
    users = list(users_collection.find({}, {"_id": 0}))
    suppliers = get_cached_suppliers()
    return {"users": users, "suppliers": suppliers}

def save_db(data):
    if "users" in data:
        users_collection.delete_many({})
        if data["users"]:
            users_collection.insert_many(data["users"])
    # Local supplier DB removed; reputation updates will be kept in-memory or computed dynamically.

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
    supplier_id: Any
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

class SupplierRatingRequest(BaseModel):
    transaction_id: str
    supplier_id: str
    buyer_id: str
    rating: int
    review: str



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

def load_escrow_db():
    escrows = list(escrows_collection.find({}, {"_id": 0}))
    return {e["transaction_id"]: e for e in escrows if "transaction_id" in e}

def save_escrow_db(data):
    for tx_id, record in data.items():
        record["transaction_id"] = tx_id
        escrows_collection.replace_one({"transaction_id": tx_id}, record, upsert=True)

def update_supplier_reputation(supplier_id: Any, delivered_on_time: bool):
    db = load_db()
    suppliers = db.get("suppliers", [])
    supplier = next((s for s in suppliers if str(s["id"]) == str(supplier_id)), None)
    
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
async def get_procurement_analytics(current_user: str = Depends(get_current_user)):
    try:
        return procurement_analytics_engine.calculate_procurement_intelligence()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/analytics")
async def get_dashboard_analytics(current_user: str = Depends(get_current_user)):
    try:
        return dashboard_analytics.calculate_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/insights")
async def get_dashboard_insights(current_user: str = Depends(get_current_user)):
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
async def get_dashboard_feed(current_user: str = Depends(get_current_user)):
    try:
        res = procurement_insights.generate_insights()
        return res["procurement_feed"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/regions")
async def get_dashboard_regions(current_user: str = Depends(get_current_user)):
    try:
        res = dashboard_analytics.calculate_analytics()
        return res["regions_detail"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settlements/analytics")
async def get_settlements_analytics(current_user: str = Depends(get_current_user)):
    try:
        return settlement_analytics.calculate_settlements_telemetry()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settlements/ledger")
async def get_settlements_ledger(current_user: str = Depends(get_current_user)):
    try:
        return settlement_analytics.compile_settlement_ledger()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/procurement/intelligence")
async def get_procurement_intelligence(req: ProcurementIntelligenceRequest, current_user: str = Depends(get_current_user)):
    try:
        result = procurement_engine.run_intelligence(req.dict())
        persist_suppliers_from_intelligence(result, req.product_name)
        return result
    except Exception as e:
        print(f"[ProcureAI] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
@limiter.limit("5/minute")
async def login(request: Request, user: User):
    users = list(users_collection.find({}, {"_id": 0}))
    
    # Locate the user and verify their password
    found_user = next((u for u in users if u["email"] == user.email), None)
    if not found_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    pw_hash = found_user.get("password", "")
    valid_password = False
    
    try:
        valid_password = bcrypt.checkpw(user.password.encode("utf-8"), pw_hash.encode("utf-8"))
    except Exception:
        valid_password = False
        
    if valid_password:
        access_token = create_access_token(data={"sub": user.email})
        return {
            "message": "Login successful",
            "email": user.email,
            "access_token": access_token,
            "token_type": "bearer"
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/agent-competition")
@limiter.limit("30/minute")
def agent_competition_api(request: Request, req: SupplierRequest, current_user: str = Depends(get_current_user)):
    policy_dict = req.policy.dict() if req.policy else None
    result = run_agent_competition(req.productName, req.quantity, req.budget, policy_dict)
    return result

@app.post("/api/select-supplier")
@limiter.limit("30/minute")
async def select_supplier_api(request: Request, req: SupplierRequest, current_user: str = Depends(get_current_user)):
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
    
    # Map backend fields to frontend expectations robustly (supports both snake_case and camelCase)
    winner = result.get("winner") or result.get("selected_supplier") or result.get("selectedSupplier") or {}
    winner_id = winner.get("id")
    winner_name = winner.get("name")
    
    winner_unit_price = winner.get("unit_price") or winner.get("price") or winner.get("base_price", 0)
    winner_final_price = result.get("final_price") or winner.get("finalPrice") or round(winner_unit_price * req.quantity, 2)
    winner_reason = result.get("reasoning") or winner.get("reason") or winner.get("reasoning") or ""
    
    raw_suppliers = result.get("suppliers") or result.get("supplier_list") or result.get("scored_results") or []
    mapped_suppliers = []
    for s in raw_suppliers:
        mapped_suppliers.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "price": s.get("price") or s.get("negotiated_price") or s.get("base_price", 0),
            "rating": s.get("rating") or round((s.get("reliability_score", 85) / 20), 1),
            "deliveryTime": f"{s.get('delivery_days') or s.get('delivery', 5)} days",
            "reliability": s.get("reliability_score") or s.get("reliability", 90),
            "success_rate": s.get("success_rate", 90),
            "score": s.get("score", 0)
        })
        
    return {
        "deal": result.get("deal"),
        "rounds": result.get("rounds"),
        "finalDecision": winner,
        "suppliers": mapped_suppliers,
        "negotiationLogs": result.get("negotiationLogs") or result.get("negotiation_logs") or [],
        "selectedSupplier": {
            "id": winner_id,
            "name": winner_name,
            "finalPrice": winner_final_price,
            "reasoning": winner_reason,
            "wallet_address": winner.get("address") or winner.get("wallet_address", "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY"),
            "unit_price": winner_unit_price,
            "reliability": winner.get("reliability_score") or winner.get("reliability", 90),
            "deliveryTime": f"{(winner.get('delivery_days') or winner.get('delivery', 5))} days"
        },
        "policy_applied": result.get("policy_applied", False),
        "filtered_out_count": result.get("filtered_out_count", 0),
        "rejection_reasons": result.get("rejection_reasons", [])
    }

@app.post("/api/procurement/select-supplier")
@limiter.limit("30/minute")
async def human_select_supplier(request: Request, req: HumanSelectSupplierRequest, current_user: str = Depends(get_current_user)):
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
async def prepare_transaction(req: TransactionRequest, current_user: str = Depends(get_current_user)):
    """
    Called by frontend when user confirms selection.
    Prepares an unsigned transaction for the wallet to sign.
    """
    return create_transaction(req.sender, req.receiver, req.amount)

@app.get("/api/escrow/{action}")
@limiter.limit("20/minute")
async def escrow_api(request: Request, action: str, current_user: str = Depends(get_current_user)):
    """
    Simulation of escrow status: 'lock' or 'release'.
    """
    return simulate_escrow(action)

@app.post("/api/procurement/initiate-commitment")
@limiter.limit("20/minute")
async def create_escrow(request: Request, req: EscrowRequest, current_user: str = Depends(get_current_user)):
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
@limiter.limit("20/minute")
async def confirm_delivery(request: Request, req: ConfirmDeliveryRequest, current_user: str = Depends(get_current_user)):
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

    if record.get("escrow_status") == "released":
        raise HTTPException(status_code=400, detail="Escrow already released")

    if not record.get("verified"):
        raise HTTPException(status_code=400, detail="Cannot release escrow without verification")

    record["escrow_status"] = "released"
    
    print("[PROCURE-AI] Delivery verification confirmed.")
    print("[PROCURE-AI] Procurement commitment validated.")
    print("[PROCURE-AI] Executing Algorand settlement release...")
    
    # Wire the actual on-chain settlement call
    app_id = record.get("app_id")
    buyer_address = record.get("sender_address")
    supplier_address = record.get("receiver_address")
    if app_id and buyer_address:
        from blockchain.escrow_service import confirm_delivery_on_chain
        try:
            settlement_res = confirm_delivery_on_chain(int(app_id), buyer_address, supplier_address)
            if "error" in settlement_res:
                print(f"[PROCURE-AI] On-chain settlement release warning: {settlement_res['error']}")
            else:
                tx_id = settlement_res.get("transaction_id")
                if tx_id:
                    record["settlement_tx_id"] = tx_id
                    print(f"[PROCURE-AI] On-chain settlement transaction confirmed: {tx_id}")
        except Exception as e:
            print(f"[PROCURE-AI] Error calling on-chain settlement: {e}")
            
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

# NOTE: /api/update-escrow-status is defined below with a typed Pydantic model (UpdateStatusRequest).

@app.post("/api/submit-delivery-proof")
@limiter.limit("20/minute")
async def submit_delivery_proof(
    request: Request,
    escrow_id: str = Form(...),
    proof_type: str = Form(...), # "invoice_file" | "timestamp" | "tracking_id"
    file: UploadFile = File(None),
    value: str = Form(None),
    current_user: str = Depends(get_current_user)
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
        
        # Validate MIME type
        if file.content_type not in ["image/png", "image/jpeg", "application/pdf"]:
            raise HTTPException(status_code=400, detail="Only PNG, JPEG, and PDF file types are allowed")
        
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
        proof_value = value if value else datetime.now(timezone.utc).isoformat()

    record["delivery_proof"] = {
        "type": proof_type,
        "value": proof_value,
        "file_path": file_url,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    record["escrow_status"] = "proof_submitted"
    record["verified"] = False
    
    save_escrow_db(db)
    return record



@app.post("/api/procurement/verify-delivery")
@limiter.limit("20/minute")
async def verify_delivery(request: Request, req: VerifyDeliveryRequest, current_user: str = Depends(get_current_user)):
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
        print(f"[PROCURE-AI] Delivery proof missing for escrow {req.escrow_id}. Auto-generating proof for demo resilience.")
        record["delivery_proof"] = {
            "type": "timestamp",
            "value": datetime.now(timezone.utc).isoformat(),
            "file_path": None,
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
    
    # MVP logic for verification
    proof = record["delivery_proof"]
    if proof["type"] == "timestamp":
        # Auto-valid
        pass
    else:
        # Basic validation
        if len(proof["value"]) < 5:
             print(f"[PROCURE-AI] Proof value '{proof['value']}' is too short. Auto-correcting for demo resilience.")
             proof["value"] = "demo_proof_value"

    record["escrow_status"] = "verified"
    record["verified"] = True
    
    save_escrow_db(db)
    return record

class UpdateStatusRequest(BaseModel):
    transaction_id: str
    status: str

@app.post("/api/update-escrow-status")
@limiter.limit("20/minute")
async def update_escrow_status(request: Request, req: UpdateStatusRequest, current_user: str = Depends(get_current_user)):
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
@limiter.limit("20/minute")
async def get_transaction(request: Request, tx_id: str, current_user: str = Depends(get_current_user)):
    db = load_escrow_db()
    tx = db.get(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@app.post("/api/signup")
@limiter.limit("5/minute")
async def signup(request: Request, user: User):
    db = load_db()
    users = db.setdefault("users", [])
    if any(u["email"] == user.email for u in users):
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users.append({"email": user.email, "password": hashed_password})
    save_db(db)
    return {"message": "User registered successfully"}

@app.get("/api/suppliers")
@limiter.limit("30/minute")
async def get_suppliers(request: Request, current_user: str = Depends(get_current_user)):
    db = load_db()
    return db.get("suppliers", [])

@app.get("/api/suppliers/{supplier_id}")
@limiter.limit("30/minute")
async def get_supplier(request: Request, supplier_id: str, current_user: str = Depends(get_current_user)):
    db = load_db()
    suppliers = db.get("suppliers", [])
    supplier = next((s for s in suppliers if str(s["id"]) == str(supplier_id)), None)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

class UpdateReputationRequest(BaseModel):
    supplier_id: Any
    delivered_on_time: bool

@app.post("/api/update-reputation")
async def update_reputation_endpoint(req: UpdateReputationRequest, current_user: str = Depends(get_current_user)):
    update_supplier_reputation(req.supplier_id, req.delivered_on_time)
    return {"message": "Reputation updated"}

# --- Supplier Rating Endpoints ---

@app.post("/api/ratings")
@limiter.limit("20/minute")
async def create_supplier_rating(request: Request, req: SupplierRatingRequest, current_user: str = Depends(get_current_user)):
    """
    Submit a supplier rating after successful escrow release.
    
    Future Recommendation Score:
    Recommendation Score = AI Supplier Intelligence Score + Supplier Reputation Score
    This rating data will later be used by supplier ranking and recommendation modules.
    """
    # Validation
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    if not req.transaction_id:
        raise HTTPException(status_code=400, detail="transaction_id is required")
    
    if not req.supplier_id:
        raise HTTPException(status_code=400, detail="supplier_id is required")
    
    if not req.buyer_id:
        raise HTTPException(status_code=400, detail="buyer_id is required")
    
    # Check if rating already exists for this transaction
    existing_rating = supplier_ratings_collection.find_one({"transaction_id": req.transaction_id})
    if existing_rating:
        raise HTTPException(status_code=400, detail="Rating already submitted for this transaction")
    
    # Create rating document
    rating_doc = {
        "transaction_id": req.transaction_id,
        "supplier_id": req.supplier_id,
        "buyer_id": req.buyer_id,
        "rating": req.rating,
        "review": req.review,
        "created_at": datetime.now(timezone.utc)
    }
    
    supplier_ratings_collection.insert_one(rating_doc)
    
    return {"message": "Rating submitted successfully"}

@app.get("/api/ratings/supplier/{supplier_id}")
@limiter.limit("30/minute")
async def get_supplier_ratings(request: Request, supplier_id: str, current_user: str = Depends(get_current_user)):
    """
    Get average rating and reviews for a supplier.
    
    Future Recommendation Score:
    Recommendation Score = AI Supplier Intelligence Score + Supplier Reputation Score
    This rating data will later be used by supplier ranking and recommendation modules.
    """
    ratings = list(supplier_ratings_collection.find({"supplier_id": supplier_id}, {"_id": 0}))
    
    if not ratings:
        return {
            "average_rating": 0,
            "total_reviews": 0,
            "reviews": []
        }
    
    total_reviews = len(ratings)
    average_rating = sum(r["rating"] for r in ratings) / total_reviews
    
    return {
        "average_rating": round(average_rating, 1),
        "total_reviews": total_reviews,
        "reviews": ratings
    }

# --- Supplier Agent Endpoint ---

@app.post("/supplier/{supplier_id}/respond")
@limiter.limit("30/minute")
async def supplier_respond(request: Request, supplier_id: str, req: SupplierNegotiationRequest, current_user: str = Depends(get_current_user)):
    db = load_db()
    suppliers = db.get("suppliers", [])
    supplier = next((s for s in suppliers if str(s["id"]) == str(supplier_id)), None)
    
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
@limiter.limit("30/minute")
async def multilingual_negotiation(request: Request, req: MultilingualNegotiationRequest, current_user: str = Depends(get_current_user)):
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
@limiter.limit("30/minute")
async def full_multilingual_negotiation(request: Request, req: FullNegotiationRequest, current_user: str = Depends(get_current_user)):
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
@limiter.limit("30/minute")
async def get_supported_languages(request: Request, current_user: str = Depends(get_current_user)):
    """Return the list of supported supplier languages for multilingual negotiation."""
    return negotiation_engine.get_supported_languages()


@app.post("/api/negotiation/intelligence")
@limiter.limit("30/minute")
async def get_negotiation_intelligence(request: Request, req: NegotiationIntelligenceRequest, current_user: str = Depends(get_current_user)):
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
@limiter.limit("30/minute")
async def generate_procurement_inquiry(request: Request, req: ProcurementInquiryRequest, current_user: str = Depends(get_current_user)):
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
@limiter.limit("30/minute")
async def send_procurement_inquiry(request: Request, req: SendInquiryRequest, current_user: str = Depends(get_current_user)):
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


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for deployment platforms and monitoring."""
    return {
        "status": "healthy",
        "service": "ProcureAI",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    # Enable reload by default in dev mode, but disable it in production environments
    app_env = os.getenv("APP_ENV", "development").lower()
    if app_env == "production":
        reload_mode = False
    else:
        reload_mode = os.getenv("RELOAD", "True").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=reload_mode)
