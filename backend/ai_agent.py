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

def select_best_supplier(product_name, quantity, budget):
    print(f"\n[ProcureAI Agent] Sourcing '{product_name}' for quantity {quantity} with budget ${budget}...")
    
    data = load_data()
    # Filter suppliers by product (case-insensitive)
    suppliers = [s for s in data.get("suppliers", []) if product_name.lower() in s["product"].lower()]
    print(f"[ProcureAI Agent] Found {len(suppliers)} potential suppliers in database.")
    
    if not suppliers:
        print(f"[ProcureAI Agent] No matching suppliers for '{product_name}'.")
        return {"error": "No suppliers found! Try searching for 'Industrial Components'."}

    print("[ProcureAI Agent] Initializing Multi-Agent Negotiation Protocol (A2A)...")
    negotiation_results = []
    
    # 5. IMPLEMENT NEGOTIATION LOOP
    all_negotiation_logs = []
    
    for s in suppliers:
        print(f"  - Initiating Agent-to-Agent dialogue with '{s['name']}'...")
        best_offer = None
        supplier_logs = []
        
        # 3 Rounds of negotiation
        for round_num in range(1, 4):
            try:
                # 4. MODIFY AI PROCUREMENT AGENT: Call each supplier agent dynamically
                full_endpoint = f"{BASE_URL}{s['endpoint']}" if s['endpoint'].startswith("/") else s['endpoint']
                
                response = requests.post(
                    full_endpoint,
                    json={
                        "product": product_name,
                        "quantity": quantity,
                        "budget": budget,
                        "round": round_num
                    },
                    timeout=5
                )
                
                if response.status_code == 200:
                    offer = response.json()
                    offer_price = offer["offer_price"]
                    message = offer["message"]
                    
                    # 6. GENERATE NEGOTIATION TRANSCRIPT
                    supplier_logs.append({"role": "agent", "message": f"Round {round_num}: Can you offer better pricing for {quantity} units of {product_name}?"})
                    supplier_logs.append({"role": "supplier", "message": message})
                    
                    if best_offer is None or offer_price < best_offer["offer_price"]:
                        best_offer = offer
                else:
                    print(f"    Error from supplier {s['id']}: {response.status_code}")
            except Exception as e:
                print(f"    Failed to reach supplier agent {s['id']}: {e}")
                break
        
        if best_offer:
            # 7. FINAL SUPPLIER SELECTION: score = (reliability * 1000) / final_price
            score = (s["reliability"] * 1000) / best_offer["offer_price"]
            
            negotiation_results.append({
                "supplier": s,
                "final_offer": best_offer,
                "score": score,
                "logs": supplier_logs
            })

    if not negotiation_results:
        return {"error": "Negotiation failed with all suppliers."}

    # Sort by score descending
    negotiation_results.sort(key=lambda x: x["score"], reverse=True)
    best_match = negotiation_results[0]
    selected_supplier = best_match["supplier"]
    final_unit_price = best_match["final_offer"]["offer_price"]
    total_cost = round(final_unit_price * quantity, 2)
    
    print(f"[ProcureAI Agent] WINNER: '{selected_supplier['name']}' selected at unit price ${final_unit_price}.")
    
    # Use logs from the winning supplier for the frontend display
    negotiation_logs = best_match["logs"]
    
    reasoning = f"Selected {selected_supplier['name']} based on high reliability ({selected_supplier['reliability']*100}%) and a final negotiated price of ${final_unit_price} (Score: {round(best_match['score'], 2)})."

    print(f"[ProcureAI Agent] Procurement Cycle Complete. Total Deal Value: ${total_cost}\n")

    return {
        "supplier_list": [
            {**nr["supplier"], "negotiated_price": nr["final_offer"]["offer_price"]} 
            for nr in negotiation_results
        ],
        "selected_supplier": {
            **selected_supplier,
            "final_price": total_cost,
            "reasoning": reasoning
        },
        "final_price": total_cost,
        "reasoning": reasoning,
        "negotiation_logs": negotiation_logs
    }
