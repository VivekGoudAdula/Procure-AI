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

# 10. OPTIONAL (STABILITY): Dynamic BASE_URL for A2A communication
BASE_URL = os.environ.get("APP_URL", "http://localhost:8000")
if BASE_URL == "MY_APP_URL": # Default placeholder from .env
    BASE_URL = "http://localhost:8000"

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "database.json")

def load_data():
    if not os.path.exists(DATABASE_PATH):
        return {"users": [], "suppliers": []}
    with open(DATABASE_PATH, "r") as f:
        return json.load(f)

def run_agent_competition(product_name, quantity, budget):
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

    candidates = [s for s in all_suppliers if s["base_price"] <= budget * 1.5]
    if not candidates: candidates = all_suppliers[:10]
    
    if not candidates:
        raise ValueError("No suppliers found in database")
    
    top_suppliers = sorted(candidates, key=lambda x: x.get("reliability_score", 0), reverse=True)[:3]
    
    rounds = []
    # Initial state
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
            "reputation_hash": s.get("reputation_hash")
        } for s in top_suppliers
    }

    # Simulation: 3 Rounds
    for r_num in range(1, 4):
        round_suppliers = []
        for s_id, state in current_states.items():
            # Reduce price randomly 5-15%
            reduction = random.uniform(0.05, 0.15)
            state["price"] = round(state["price"] * (1 - reduction), 2)
            
            # Optionally adjust delivery +/- 1 day
            if random.random() > 0.6:
                adj = random.choice([-1, 0, 1])
                state["delivery"] = max(1, state["delivery"] + adj)
                
            round_suppliers.append(state.copy())
        
        rounds.append({
            "round": r_num,
            "suppliers": round_suppliers
        })

    # Compute Winner
    # score = (reliability * 0.5) + (1/price * 0.3) + (1/delivery * 0.2)
    # We need to normalize price and delivery to make the weights meaningful
    min_price = min(s["price"] for s in current_states.values())
    min_delivery = min(s["delivery"] for s in current_states.values())
    
    scored_results = []
    for s_id, state in current_states.items():
        # Using ratios for normalization: (min / current) ensures lower is better and result is 0-1
        price_factor = min_price / state["price"]
        delivery_factor = min_delivery / state["delivery"]
        
        # Reliability is 0-100, so we normalize to 0-1
        rel_factor = state["reliability"] / 100.0
        
        score = (rel_factor * 0.5) + (price_factor * 0.3) + (delivery_factor * 0.2)
        scored_results.append({**state, "score": round(score * 100, 2)})

    scored_results.sort(key=lambda x: x["score"], reverse=True)
    winner = scored_results[0]
    
    winner["reason"] = f"Best balance of price (${winner['price']}), reliability ({winner['reliability']}%), and delivery ({winner['delivery']} days). On-chain verified history with {winner['total_deals']} successful deals."

    return {
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
                "delivery_days": s["delivery_days"]
            } for s in top_suppliers
        ],
        "rounds": rounds,
        "winner": winner,
        "scored_results": scored_results
    }

def select_best_supplier(product_name, quantity, budget):
    # Keep this for compatibility but use the new logic
    comp_result = run_agent_competition(product_name, quantity, budget)
    winner = comp_result["winner"]
    
    return {
        **comp_result,
        "supplier_list": [
            {
                "id": s["id"],
                "name": s["name"],
                "negotiated_price": s["price"],
                "delivery_days": s["delivery"],
                "reliability_score": s["reliability"],
                "score": s["score"],
                "rating": round((s["reliability"] / 20), 1),
                "success_rate": s.get("success_rate", 90),
                "total_deals": s.get("total_deals", 0),
                "last_updated": s.get("last_updated"),
                "reputation_hash": s.get("reputation_hash")
            } for s in comp_result["scored_results"]
        ],
        "selected_supplier": {
            "id": winner["id"],
            "name": winner["name"],
            "final_price": winner["price"] * quantity,
            "unit_price": winner["price"],
            "delivery_days": winner["delivery"],
            "reliability_score": winner["reliability"],
            "reasoning": winner["reason"],
            "last_updated": winner.get("last_updated"),
            "reputation_hash": winner.get("reputation_hash")
        },
        "final_price": winner["price"] * quantity,
        "reasoning": winner["reason"],
        "negotiation_logs": [
            item
            for r in comp_result["rounds"]
            for item in [
                {"role": "agent", "message": f"Round {r['round']}: Requesting best offers for {quantity} units..."},
                {"role": "supplier", "message": f"Competitive offers: " + ", ".join([f"{s['name']}: ${s['price']}" for s in r['suppliers']])}
            ]
        ]
    }


