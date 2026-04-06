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

app = FastAPI(title="ProcureAI Backend - Autonomous Agentic Commerce Platform")

# CORS setup for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
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

escrow_db = {}

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
async def select_supplier_api(req: SupplierRequest):
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
                "price": s["price"],
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
            "wallet_address": result["selected_supplier"].get("wallet_address", "GD6477M6GCOY6SJYV6G57H7W6RQF2XG6NIU7D4O4ZX7L3V47V4K6A2PZ")
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
    import uuid
    import time
    tx_id = f"ALGO_{uuid.uuid4().hex[:10].upper()}"
    escrow_record = {
        "transaction_id": tx_id,
        "sender_address": req.sender,
        "receiver_address": req.receiver,
        "amount": req.amount,
        "status": "locked",
        "timestamp": time.time()
    }
    escrow_db[tx_id] = escrow_record
    return escrow_record

@app.post("/api/confirm-delivery")
async def confirm_delivery(req: ConfirmDeliveryRequest):
    tx = escrow_db.get(req.transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx["status"] = "released"
    return tx

@app.get("/api/get-transaction/{tx_id}")
async def get_transaction(tx_id: str):
    tx = escrow_db.get(tx_id)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
