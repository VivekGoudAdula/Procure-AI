import os
import sys

# Add backend directory to sys.path to enable imports of main and services
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from db import suppliers_collection
import random

def update_db():
    suppliers = list(suppliers_collection.find({}))
    if not suppliers:
        print("No suppliers found in MongoDB")
        return

    for s in suppliers:
        # Convert existing reliability (0-1) to reliability_score (0-100)
        rel = s.get("reliability", 0.8)
        s["reliability_score"] = int(rel * 100)
        
        # Add new fields
        s["rating"] = round(rel * 5, 1)
        s["delivery_days"] = random.randint(1, 7)
        s["success_rate"] = int(rel * 100) + random.randint(-5, 2)
        s["success_rate"] = max(0, min(100, s["success_rate"]))
        
        # Replace the document in MongoDB, keeping the database in sync
        suppliers_collection.replace_one({"id": s["id"]}, s)

    print("Database updated successfully in MongoDB")

if __name__ == "__main__":
    update_db()
