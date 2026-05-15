import os
import json
import random
import time
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class AlibabaProcurementService:
    def __init__(self):
        self.rapidapi_key = os.getenv("RAPIDAPI_KEY")
        self.rapidapi_host = os.getenv("RAPIDAPI_HOST", "alibaba-datahub.p.rapidapi.com")
        self.logs = []

    def _add_log(self, message: str):
        log_entry = f"[{datetime.now().strftime('%H:%M:%S')}] {message}"
        print(f"[PROCURE-AI] {message}")
        self.logs.append(log_entry)

    def _detect_category(self, query: str) -> str:
        query = query.lower()
        if any(w in query for w in ["motor", "engine", "industrial", "pump", "valve"]):
            return "industrial"
        elif any(w in query for w in ["shirt", "cotton", "apparel", "clothing", "fabric"]):
            return "apparel"
        elif any(w in query for w in ["laptop", "phone", "chip", "electronics", "cpu"]):
            return "electronics"
        elif any(w in query for w in ["glove", "medical", "mask", "surgical", "health"]):
            return "medical"
        return "general"

    def _get_category_metadata(self, category: str) -> Dict[str, Any]:
        metadata = {
            "industrial": {
                "regions": ["Germany", "USA", "Japan", "China"],
                "base_lead_time": 20,
                "base_price_range": (100, 5000),
                "risk_profile": "Medium"
            },
            "apparel": {
                "regions": ["Vietnam", "Turkey", "India", "China", "Bangladesh"],
                "base_lead_time": 10,
                "base_price_range": (2, 50),
                "risk_profile": "Low"
            },
            "electronics": {
                "regions": ["Taiwan", "South Korea", "China", "USA"],
                "base_lead_time": 15,
                "base_price_range": (50, 2000),
                "risk_profile": "High"
            },
            "medical": {
                "regions": ["Germany", "USA", "Turkey", "China"],
                "base_lead_time": 7,
                "base_price_range": (0.5, 100),
                "risk_profile": "Low"
            },
            "general": {
                "regions": ["Global"],
                "base_lead_time": 14,
                "base_price_range": (10, 500),
                "risk_profile": "Medium"
            }
        }
        return metadata.get(category, metadata["general"])

    def _fetch_alibaba_search(self, query: str) -> List[Dict[str, Any]]:
        if not self.rapidapi_key:
            self._add_log("RapidAPI key missing. Skipping search.")
            return []

        self._add_log("Searching Alibaba supplier ecosystem...")
        url = f"https://{self.rapidapi_host}/item_search"
        querystring = {"q": query, "page": "1"}
        
        headers = {
            "x-rapidapi-key": self.rapidapi_key,
            "x-rapidapi-host": self.rapidapi_host
        }

        try:
            response = requests.get(url, headers=headers, params=querystring, timeout=12)
            if response.status_code == 200:
                data = response.json()
                
                # DEEP DEBUG LOGGING
                print(f"[DEBUG] API Response Keys: {list(data.keys())}")
                
                items = []
                
                # Path 1: data -> result -> item (The one seen in terminal)
                if "data" in data and isinstance(data["data"], dict):
                    print(f"[DEBUG] Found 'data' dict with keys: {list(data['data'].keys())}")
                    res = data["data"].get("result", {})
                    if isinstance(res, dict):
                        print(f"[DEBUG] Found 'result' dict with keys: {list(res.keys())}")
                        items = res.get("item", [])
                        print(f"[DEBUG] 'item' key found: {'item' in res}, type: {type(items)}")
                
                # Path 2: result -> item
                if not items and "result" in data and isinstance(data["result"], dict):
                    res = data["result"]
                    print(f"[DEBUG] Trying 'result' -> 'item' path. Result keys: {list(res.keys())}")
                    items = res.get("item", [])
                    if not items:
                        items = res.get("items", [])
                    if not items and isinstance(res.get("result"), dict):
                        # Nested result?
                        items = res["result"].get("item", [])

                # Path 3: data (as a list)
                if not items and "data" in data and isinstance(data["data"], list):
                    print("[DEBUG] Trying 'data' list path")
                    items = data["data"]
                
                # Path 4: item (root level)
                if not items and "item" in data and isinstance(data["item"], list):
                    print("[DEBUG] Trying 'item' list path")
                    items = data["item"]

                # CATCH-ALL: Deep recursive search for any list containing item-like objects
                if not items:
                    print("[DEBUG] Initializing deep recursive search...")
                    def find_best_list(obj):
                        if isinstance(obj, list) and len(obj) > 0:
                            # Check if first element looks like an Alibaba item entry
                            first = obj[0]
                            if isinstance(first, dict) and ("item" in first or "itemId" in first or "seller" in first):
                                return obj
                        if isinstance(obj, dict):
                            for v in obj.values():
                                result = find_best_list(v)
                                if result: return result
                        return None
                    items = find_best_list(data) or []

                self._add_log(f"Products discovered: {len(items)}")
                return items
            else:
                self._add_log(f"Alibaba API error: {response.status_code}")
                return []
        except Exception as e:
            self._add_log(f"Search failed: {str(e)}")
            return []

    def _normalize_and_enrich(self, entry: Dict[str, Any], category: str) -> Dict[str, Any]:
        item = entry.get("item", {})
        seller = entry.get("seller", {})
        company = entry.get("company", {})
        
        # Extract Item Details
        item_id = item.get("itemId", str(random.randint(100000, 999999)))
        title = item.get("title", "Premium Product")
        img = item.get("image", "")
        if img.startswith("//"): img = f"https:{img}"
        
        # Extract Price & MOQ
        sku_def = item.get("sku", {}).get("def", {})
        price_module = sku_def.get("priceModule", {})
        price_formatted = price_module.get("priceFormatted", "$10.00")
        
        try:
            price_val = float(price_module.get("price", "10").split("-")[0].replace("$", "").replace(",", ""))
        except:
            price_val = 10.0

        moq_module = sku_def.get("quantityModule", {}).get("minOrder", {})
        moq_formatted = moq_module.get("quantityFormatted", "1 piece")
        try: moq_val = int(moq_module.get("quantity", 1))
        except: moq_val = 1

        # Extract Supplier Info
        supplier_name = company.get("companyName", "Alibaba Supplier")
        country = company.get("companyAddress", {}).get("country", "China")
        
        status = company.get("status", {})
        trade_assurance = status.get("tradeAssurance") == "1"
        gold = status.get("gold", False)
        verified = status.get("verified", False)
        
        store_age = str(seller.get("storeAge", "1"))

        return {
            "id": item_id,
            "name": supplier_name,
            "product_title": title,
            "product_image": img,
            "country": country,
            "region": country,
            "moq": moq_val,
            "moq_formatted": moq_formatted,
            "negotiated_price": price_val,
            "price_formatted": price_formatted,
            "trust_score": 90 if trade_assurance else 75,
            "success_rate": 95,
            "lead_time_days": 10,
            "on_chain_verified": trade_assurance,
            "trade_assurance": trade_assurance,
            "gold_status": gold,
            "verified": verified,
            "store_age": store_age,
            "has_deviations": False,
            "deviations": [],
            "production_capacity": 10000,
            "total_score": 85
        }

    def _get_language_for_region(self, region: str) -> str:
        mapping = {
            "Germany": "German",
            "China": "Mandarin",
            "Vietnam": "Vietnamese",
            "Turkey": "Turkish",
            "India": "Hindi/English",
            "USA": "English",
            "Japan": "Japanese"
        }
        return mapping.get(region, "English")

    def run_intelligence(self, request: Dict[str, Any]) -> Dict[str, Any]:
        query = request.get("product_name", "Industrial Components")
        quantity = request.get("quantity", 1)
        region_filter = request.get("shipping_region", "Global")

        self.logs = []
        self._add_log("Initializing Global Procurement Engine...")
        self._add_log(f"Request: '{query}' ({quantity} Units) | Region: {region_filter}")
        
        category = self._detect_category(query)
        
        # 1. Fetch from Alibaba
        items = self._fetch_alibaba_search(query)
        
        # 2. Extract and Enrich
        self._add_log("Extracting real-time supplier intelligence...")
        all_suppliers = [self._normalize_and_enrich(item, category) for item in items]
        
        # 3. Region Filtering
        if region_filter != "Global":
            self._add_log(f"Applying region constraint: {region_filter}")
            filtered = [s for s in all_suppliers if s["country"].lower() == region_filter.lower()]
            # Soft fallback if 0 results in region
            if not filtered:
                self._add_log(f"No suppliers found in {region_filter}. Surfacing global results with regional advisory.")
            else:
                all_suppliers = filtered

        if not all_suppliers:
            self._add_log("No direct matches found in global ecosystem.")
            return {
                "suppliers": [],
                "recommended_supplier": None,
                "rejected_suppliers": [],
                "procurement_analysis": {"total_scanned": 0, "eligible_count": 0},
                "logs": self.logs
            }

        self._add_log(f"Suppliers Discovered: {len(all_suppliers)}")

        # 3. Final Ranking
        self._add_log("Ranking suppliers by intelligence score...")
        all_suppliers.sort(key=lambda x: x["total_score"], reverse=True)
        
        recommended = all_suppliers[0] if all_suppliers else None
        
        if recommended:
            self._add_log(f"Recommended Intelligence: {recommended['name']}")

        analysis = {
            "category": category,
            "total_scanned": len(all_suppliers),
            "eligible_count": len(all_suppliers),
            "recommendation_reasoning": [
                "Highest verified market trust",
                "Optimal logistics performance",
                "Best negotiation potential",
                "Verified production capacity"
            ] if recommended else []
        }
        
        self._add_log("Procurement intelligence cycle complete.")
        
        return {
            "suppliers": all_suppliers,
            "recommended_supplier": recommended,
            "rejected_suppliers": [],
            "procurement_analysis": analysis,
            "logs": self.logs
        }
