import json
import random
import os
import requests
from groq import Groq
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Initialize Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Dynamic BASE_URL for A2A communication
BASE_URL = os.environ.get("APP_URL", "http://localhost:8000")
if BASE_URL == "MY_APP_URL":
    BASE_URL = "http://localhost:8000"

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "database.json")

def load_data():
    if not os.path.exists(DATABASE_PATH):
        return {"users": [], "suppliers": []}
    with open(DATABASE_PATH, "r") as f:
        return json.load(f)

def run_agent_competition(product_name, quantity, budget, policy=None):
    print(f"\n[ProcureAI] Starting Dynamic Agent Competition for '{product_name}'...")
    
    data = load_data()
    all_suppliers = [s for s in data.get("suppliers", []) if product_name.lower() in s["product"].lower()]
    
    if not all_suppliers:
        # Fallback to category if product not found
        categories = ["industrial", "electronics", "agriculture", "food", "medical", "office", "construction", "automotive", "textiles", "energy"]
        found_category = next((cat for cat in categories if cat in product_name.lower()), None)
        if found_category:
            all_suppliers = [s for s in data.get("suppliers", []) if s["category"] == found_category]
        else:
            all_suppliers = data.get("suppliers", [])[:10]

    # POLICY ENFORCEMENT
    filtered_out_count = 0
    rejection_reasons = []
    valid_suppliers = []

    if policy:
        print(f"[ProcureAI] Applying Procurement Policy: {policy}")
        for s in all_suppliers:
            reasons = []
            
            # 1. Budget Constraint (Total budget)
            total_price = s["base_price"] * quantity
            if policy.get("max_budget") and total_price > policy["max_budget"]:
                reasons.append(f"Price (${total_price}) exceeds max budget (${policy['max_budget']})")
            
            # 2. Reliability Constraint
            if policy.get("min_reliability") and s.get("reliability_score", 0) < policy["min_reliability"]:
                reasons.append(f"Reliability ({s.get('reliability_score', 0)}%) below minimum ({policy['min_reliability']}%)")
            
            # 3. Delivery Days Constraint
            if policy.get("max_delivery_days") and s.get("delivery_days", 99) > policy["max_delivery_days"]:
                reasons.append(f"Delivery ({s.get('delivery_days')} days) exceeds maximum ({policy['max_delivery_days']} days)")
                
            # 4. Success Rate Constraint
            if policy.get("min_success_rate") and s.get("success_rate", 0) < policy["min_success_rate"]:
                reasons.append(f"Success rate ({s.get('success_rate')}%) below minimum ({policy['min_success_rate']}%)")
                
            # 5. On-chain Verified Constraint
            if policy.get("require_on_chain_verified") and not s.get("reputation_hash"):
                reasons.append("Supplier is not on-chain verified")

            if not reasons:
                valid_suppliers.append(s)
            else:
                filtered_out_count += 1
                rejection_reasons.append({"supplier": s["name"], "reasons": reasons})
    else:
        valid_suppliers = all_suppliers

    if not valid_suppliers:
        return {
            "status": "no_supplier_found",
            "reason": "No suppliers match procurement policy",
            "filtered_out_count": filtered_out_count,
            "rejection_reasons": rejection_reasons[:5]
        }

    candidates = [s for s in valid_suppliers if s["base_price"] <= budget * 1.5]
    if not candidates: candidates = valid_suppliers[:3]
    
    top_suppliers = sorted(candidates, key=lambda x: x.get("reliability_score", 0), reverse=True)[:3]
    
    rounds = []
    current_states = {
        s["id"]: {
            "id": s["id"],
            "name": s["name"],
            "price": s["base_price"],
            "delivery": s["delivery_days"],
            "reliability": s["reliability_score"],
            "success_rate": s.get("success_rate", 90),
            "total_deals": s.get("total_deals", 0),
            "last_updated": s.get("last_updated"),
            "reputation_hash": s.get("reputation_hash"),
            "category": s.get("category", "General"),
            "product": s.get("product", product_name)
        } for s in top_suppliers
    }

    for r_num in range(1, 4):
        round_suppliers = []
        for s_id, state in current_states.items():
            reduction = random.uniform(0.05, 0.15)
            state["price"] = round(state["price"] * (1 - reduction), 2)
            
            if random.random() > 0.6:
                adj = random.choice([-1, 0, 1])
                state["delivery"] = max(1, state["delivery"] + adj)
                
            round_suppliers.append(state.copy())
        
        rounds.append({
            "round": r_num,
            "suppliers": round_suppliers
        })

    min_price = min(s["price"] for s in current_states.values())
    min_delivery = min(s["delivery"] for s in current_states.values())
    
    scored_results = []
    for s_id, state in current_states.items():
        price_factor = min_price / state["price"]
        delivery_factor = min_delivery / state["delivery"]
        rel_factor = state["reliability"] / 100.0
        
        score = (rel_factor * 0.5) + (price_factor * 0.3) + (delivery_factor * 0.2)
        scored_results.append({**state, "score": round(score * 100, 2)})

    scored_results.sort(key=lambda x: x["score"], reverse=True)
    winner = scored_results[0]
    
    winner["reason"] = f"Best balance of price (${winner['price']}), reliability ({winner['reliability']}%), and delivery ({winner['delivery']} days). On-chain verified history with {winner['total_deals']} successful deals."

    return {
        "status": "success",
        "deal": {
            "product": product_name,
            "quantity": quantity,
            "budget": budget
        },
        "suppliers": [
            {
                "id": s["id"],
                "name": s["name"],
                "base_price": s["base_price"],
                "reliability_score": s["reliability_score"],
                "delivery_days": s["delivery_days"],
                "success_rate": s.get("success_rate", 90),
                "total_deals": s.get("total_deals", 0),
                "last_updated": s.get("last_updated"),
                "reputation_hash": s.get("reputation_hash"),
                "category": s.get("category", "General"),
                "product": s.get("product", product_name)
            } for s in top_suppliers
        ],
        "rounds": rounds,
        "winner": winner,
        "scored_results": scored_results,
        "policy_applied": policy is not None,
        "filtered_out_count": filtered_out_count,
        "rejection_reasons": rejection_reasons[:5]
    }

def select_best_supplier(product_name, quantity, budget, policy=None):
    comp_result = run_agent_competition(product_name, quantity, budget, policy)
    
    if comp_result.get("status") == "no_supplier_found":
        return comp_result

    winner = comp_result["winner"]
    
    return {
        **comp_result,
        "suppliers": [
            {
                "id": s["id"],
                "name": s["name"],
                "price": s["price"],
                "delivery_days": s["delivery"],
                "reliability": s["reliability"],
                "score": s["score"],
                "rating": round((s["reliability"] / 20), 1),
                "success_rate": s["success_rate"],
                "total_deals": s["total_deals"],
                "last_updated": s["last_updated"],
                "reputation_hash": s["reputation_hash"],
                "category": s["category"],
                "product": s["product"]
            } for s in comp_result["scored_results"]
        ],
        "selectedSupplier": {
            "id": winner["id"],
            "name": winner["name"],
            "finalPrice": round(winner["price"] * quantity, 2),
            "unit_price": winner["price"],
            "deliveryTime": f"{winner['delivery']} Days",
            "reliability": winner["reliability"],
            "reasoning": winner["reason"],
            "last_updated": winner.get("last_updated"),
            "reputation_hash": winner.get("reputation_hash")
        },
        "negotiationLogs": [
            item
            for r in comp_result["rounds"]
            for item in [
                {"role": "agent", "message": f"Round {r['round']}: Requesting best offers for {quantity} units..."},
                {"role": "supplier", "message": f"Competitive offers: " + ", ".join([f"{s['name']}: ${s['price']}" for s in r['suppliers']])}
            ]
        ]
    }
