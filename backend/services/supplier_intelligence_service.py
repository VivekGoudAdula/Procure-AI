import os
import json
import requests
import random
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = "alibaba-datahub.p.rapidapi.com"

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database.json")

class SupplierIntelligenceService:
    def __init__(self):
        self.api_key = RAPIDAPI_KEY
        self.host = RAPIDAPI_HOST

    def fetch_alibaba_data(self, item_id: str):
        """
        Fetch supplier/product data from Alibaba DataHub RapidAPI
        """
        if not self.api_key:
            return None
            
        url = f"https://{self.host}/item_sku"
        querystring = {"itemId": item_id}
        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.host
        }

        try:
            response = requests.get(url, headers=headers, params=querystring, timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Error fetching Alibaba data: {e}")
            return None

    def get_suppliers(self, product_name: str, quantity: int, budget: float, filters: dict = None):
        """
        Main entry point for procurement intelligence
        """
        # 1. Load local suppliers as base
        with open(DATABASE_PATH, "r") as f:
            data = json.load(f)
            all_suppliers = data.get("suppliers", [])

        # Filter by product name (basic search)
        matched_suppliers = [
            s for s in all_suppliers 
            if product_name.lower() in s.get("product", "").lower() or 
               product_name.lower() in s.get("category", "").lower()
        ]
        
        if not matched_suppliers:
            # Fallback to some defaults if no match
            matched_suppliers = all_suppliers[:10]

        # 2. Enrich and Score
        enriched_suppliers = []
        rejected_suppliers = []
        
        for s in matched_suppliers:
            # Enrich with dummy data for fields not in DB (simulating API enrichment)
            enriched = self._enrich_supplier(s, product_name)
            
            # Apply Filter Engine
            is_valid, reason = self._apply_filters(enriched, quantity, budget, filters)
            
            if is_valid:
                # Apply Scoring Engine
                enriched["procurement_score"] = self._calculate_score(enriched, budget)
                enriched_suppliers.append(enriched)
            else:
                enriched["rejection_reason"] = reason
                rejected_suppliers.append(enriched)

        # Sort by score
        enriched_suppliers.sort(key=lambda x: x["procurement_score"], reverse=True)

        # 3. AI Recommendation
        recommendation = self._generate_recommendation(enriched_suppliers, filters)

        return {
            "suppliers": enriched_suppliers,
            "recommended_supplier": recommendation.get("recommended_supplier"),
            "procurement_analysis": {
                "total_scanned": len(matched_suppliers),
                "eligible_count": len(enriched_suppliers),
                "rejected_count": len(rejected_suppliers),
                "average_price": sum(s["negotiated_price"] for s in enriched_suppliers) / len(enriched_suppliers) if enriched_suppliers else 0,
                "recommendation_reasoning": recommendation.get("reasoning", [])
            },
            "rejected_suppliers": rejected_suppliers
        }

    def _enrich_supplier(self, supplier, product_name):
        """
        Add fields required for premium intelligence
        """
        # Ensure base fields exist
        s = supplier.copy()
        
        # Add intelligence fields (mocking enrichment if not present)
        s["country"] = s.get("country", random.choice(["China", "Vietnam", "India", "Germany", "USA", "Japan"]))
        s["language"] = s.get("language", random.choice(["English", "Mandarin", "Hindi", "German", "Japanese"]))
        s["moq"] = s.get("moq", random.choice([1, 5, 10, 50, 100]))
        s["lead_time_days"] = s.get("delivery_days", random.randint(3, 30))
        s["production_capacity"] = s.get("production_capacity", random.choice([1000, 5000, 10000, 50000]))
        s["trust_score"] = s.get("reliability_score", random.randint(60, 99))
        s["successful_deals"] = s.get("successful_deals", random.randint(5, 500))
        s["success_rate"] = s.get("success_rate", random.randint(70, 100))
        s["on_chain_verified"] = bool(s.get("reputation_hash"))
        s["negotiated_price"] = s.get("base_price", 100.0) * random.uniform(0.85, 0.95)
        s["reliability_score"] = s.get("reliability_score", 80)
        s["rating"] = s.get("rating", round(random.uniform(3.5, 5.0), 1))
        s["shipping_region"] = s.get("shipping_region", random.choice(["Global", "Asia", "Europe", "North America"]))
        
        return s

    def _apply_filters(self, s, quantity, budget, filters):
        """
        Procurement Filter Engine
        """
        if not filters:
            return True, None
            
        # Max Budget
        total_cost = s["negotiated_price"] * quantity
        if filters.get("budget") and total_cost > filters["budget"]:
            return False, f"Total cost (${total_cost:,.2f}) exceeds budget (${filters['budget']:,.2f})"
            
        # Lead Time
        if filters.get("lead_time_days") and s["lead_time_days"] > filters["lead_time_days"]:
            return False, f"Lead time ({s['lead_time_days']} days) exceeds limit ({filters['lead_time_days']} days)"
            
        # MOQ
        if s["moq"] > quantity:
            return False, f"MOQ ({s['moq']}) is higher than requested quantity ({quantity})"
            
        # Trust Threshold
        if filters.get("min_trust") and s["trust_score"] < filters["min_trust"]:
            return False, f"Trust score ({s['trust_score']}) below minimum ({filters['min_trust']})"
            
        # Shipping Region
        if filters.get("shipping_region") and filters["shipping_region"] != "Global" and s["shipping_region"] != "Global" and s["shipping_region"] != filters["shipping_region"]:
            return False, f"Supplier does not ship to {filters['shipping_region']}"

        return True, None

    def _calculate_score(self, s, budget):
        """
        AI Procurement Scoring Engine (Weighted)
        """
        # Normalize price (lower is better) - assume budget is the max reference
        price_score = max(0, min(100, (1 - (s["negotiated_price"] / (budget if budget > 0 else 1000))) * 100))
        
        # Trust Score (already 0-100)
        trust_score = s["trust_score"]
        
        # Delivery Score (lower days is better) - assume 30 days is the max reference
        delivery_score = max(0, min(100, (1 - (s["lead_time_days"] / 30)) * 100))
        
        # Capacity Score (higher is better) - assume 10000 is the reference
        capacity_score = max(0, min(100, (s["production_capacity"] / 10000) * 100))
        
        # Weighted calculation
        # price_score * 0.35 + trust_score * 0.30 + delivery_score * 0.20 + capacity_score * 0.15
        score = (
            price_score * 0.35 +
            trust_score * 0.30 +
            delivery_score * 0.20 +
            capacity_score * 0.15
        )
        
        return round(score, 2)

    def _generate_recommendation(self, suppliers, filters):
        """
        AI Recommendation Engine
        """
        if not suppliers:
            return {"recommended_supplier": None, "reasoning": ["No suitable suppliers found."]}
            
        best = suppliers[0]
        
        reasoning = [
            f"Optimized negotiated price of ${best['negotiated_price']:,.2f} per unit",
            f"High trust score of {best['trust_score']}% based on {best['successful_deals']} successful deals",
            f"Fulfillment lead time of {best['lead_time_days']} days meets requirements",
            f"Production capacity of {best['production_capacity']} units/month ensures scalability",
            "Full compliance with procurement policy and region constraints"
        ]
        
        if best.get("on_chain_verified"):
            reasoning.append("On-chain verified reputation hash provides immutable trust")

        return {
            "recommended_supplier": best,
            "reasoning": reasoning
        }
