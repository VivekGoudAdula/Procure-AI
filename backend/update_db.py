import json
import os

DATABASE_PATH = r"C:\HACKATHONS\36. ALGOBHARAT HACK SERIES 3.0 - ALGORAND\APP\backend\database.json"

def update_database():
    with open(DATABASE_PATH, 'r') as f:
        data = json.load(f)
    
    for supplier in data.get("suppliers", []):
        supplier["endpoint"] = f"/supplier/{supplier['id']}/respond"
        # Rename price to base_price if it's there
        if "price" in supplier:
            supplier["base_price"] = supplier.pop("price")
            
    with open(DATABASE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    update_database()
    print("Database updated successfully with supplier endpoints.")
