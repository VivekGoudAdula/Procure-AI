import json
import random
import os

DATABASE_PATH = r"c:\HACKATHONS\36. ALGOBHARAT HACK SERIES 3.0 - ALGORAND\APP\backend\database.json"

def update_db():
    if not os.path.exists(DATABASE_PATH):
        print("Database not found")
        return

    with open(DATABASE_PATH, "r") as f:
        data = json.load(f)

    for s in data.get("suppliers", []):
        # Convert existing reliability (0-1) to reliability_score (0-100)
        rel = s.get("reliability", 0.8)
        s["reliability_score"] = int(rel * 100)
        
        # Add new fields
        s["rating"] = round(rel * 5, 1)
        s["delivery_days"] = random.randint(1, 7)
        s["success_rate"] = int(rel * 100) + random.randint(-5, 2)
        s["success_rate"] = max(0, min(100, s["success_rate"]))
        
        # Cleanup old reliability if needed, but keeping it might be safer for now
        # s.pop("reliability", None)

    with open(DATABASE_PATH, "w") as f:
        json.dump(data, f, indent=4)
    print("Database updated successfully")

if __name__ == "__main__":
    update_db()
