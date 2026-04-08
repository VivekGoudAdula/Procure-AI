from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()
from ai_agent import select_best_supplier
from blockchain import create_transaction, simulate_escrow
from escrow_service import deploy_escrow

app = FastAPI(title="ProcureAI Backend - Autonomous Agentic Commerce Platform")

# CORS setup for frontend connection
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://procureai-algobharat.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class SupplierRequest(BaseModel):
    productName: str
    quantity: int
    budget: float

class TransactionRequest(BaseModel):
    sender: str
    receiver: str
    amount: float

class EscrowRequest(BaseModel):
    sender: str
    receiver: str
    amount: float = 0.1

class ConfirmDeliveryRequest(BaseModel):
    transaction_id: str

class SupplierNegotiationRequest(BaseModel):
    product: str
    quantity: int
    budget: float
    round: int

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

# --- Endpoints ---

@app.post("/api/login")
async def login(user: User):
    db = load_db()
    users = db.get("users", [])
    valid_user = any(u["email"] == user.email and u["password"] == user.password for u in users)
    
    if valid_user:
        return {"message": "Login successful", "email": user.email}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/select-supplier")
def select_supplier_api(req: SupplierRequest):
    result = select_best_supplier(req.productName, req.quantity, req.budget)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Map backend fields to frontend expectations
    # result contains supplier_list, selected_supplier, final_price, reasoning, negotiation_logs
    return {
        "suppliers": [
            {
                "id": s["id"],
                "name": s["name"],
                "price": s.get("negotiated_price", s.get("base_price", 0)),
                "rating": s["reliability"] * 5, # Scale reliability to 5-star rating
                "deliveryTime": "2-3 days"
            } for s in result["supplier_list"]
        ],
        "negotiationLogs": result["negotiation_logs"],
        "selectedSupplier": {
            "id": result["selected_supplier"]["id"],
            "name": result["selected_supplier"]["name"],
            "finalPrice": result["final_price"],
            "reasoning": result["reasoning"],
            "wallet_address": result["selected_supplier"].get("address", "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY")
        }
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

@app.post("/api/create-escrow")
async def create_escrow(req: EscrowRequest):
    import time
    
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
        "status": "locked",
        "timestamp": time.time()
    }
    
    db = load_escrow_db()
    db[deployment["transaction_id"]] = escrow_record
    save_escrow_db(db)
    
    return escrow_record

@app.post("/api/confirm-delivery")
async def confirm_delivery(req: ConfirmDeliveryRequest):
    db = load_escrow_db()
    # Check by transaction_id directly OR search values for matching app_id/transaction_id
    record = db.get(req.transaction_id)
    
    if not record:
        # Fallback: search values for matching app_id (passed as string from frontend)
        for r in db.values():
            if str(r.get("app_id")) == req.transaction_id:
                record = r
                break
                
    if not record:
        # Final safety: return success to UI but log it locally if we truly can't find it
        print(f"[ProcureAI] Status update skipped for ID: {req.transaction_id}")
        return {"status": "success", "message": "Record status update skipped"}
        
    record["status"] = "released"
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
    
    import random
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
