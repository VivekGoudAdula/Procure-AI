import os
from pymongo import MongoClient
from dotenv import load_dotenv, find_dotenv

# Load env vars
load_dotenv(find_dotenv())

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("MONGO_DB_NAME", "procure_ai")

# Initialize client
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
suppliers_collection = db["suppliers"]
escrows_collection = db["escrows"]

# Ensure unique indexes
users_collection.create_index("email", unique=True)
suppliers_collection.create_index("id", unique=True)
escrows_collection.create_index("transaction_id", unique=True)

print(f"[MongoDB] Connected to database: '{DB_NAME}'")

def migrate_plaintext_passwords():
    """Migrates any legacy plaintext passwords in the database to secure bcrypt hashes."""
    import bcrypt
    try:
        users = list(users_collection.find({}))
        migrated_count = 0
        for user in users:
            pw_hash = user.get("password", "")
            if pw_hash and not (pw_hash.startswith("$2b$") or pw_hash.startswith("$2a$")):
                # Hash plaintext password
                hashed = bcrypt.hashpw(pw_hash.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                users_collection.update_one({"email": user["email"]}, {"$set": {"password": hashed}})
                migrated_count += 1
        if migrated_count > 0:
            print(f"[MongoDB Migration] Migrated {migrated_count} legacy plaintext password(s) to bcrypt.")
    except Exception as e:
        print(f"[MongoDB Migration] Error migrating plaintext passwords: {e}")

migrate_plaintext_passwords()

def get_alibaba_suppliers():
    import random
    import hashlib
    regions = ["China", "Vietnam", "India", "Turkey", "Bangladesh"]
    categories = ["apparel", "electronics", "industrial", "medical", "general"]
    products = {
        "industrial": ["Industrial Components", "Steel Rods", "Cement", "Plywood", "Valves", "Ball Bearings"],
        "apparel": ["Cotton Shirts", "Polyester Jackets", "T-Shirts Bulk", "Knitted Fabrics", "Premium Hides"],
        "electronics": ["Laptop", "Smartphones", "TV", "Server Rack", "Solid State Drive"],
        "medical": ["Surgical Masks", "Gloves", "Medical Gowns"],
        "general": ["Office Chairs", "Cardboard Packaging", "Plastic Shells"]
    }
    
    suppliers = []
    # Seed random to ensure stable metrics across calls
    rng = random.Random(42)
    for i in range(1, 135):
        cat = rng.choice(categories)
        prod = rng.choice(products[cat])
        region = rng.choice(regions)
        rel = rng.uniform(0.7, 0.99)
        base_price = round(rng.uniform(5.0, 1500.0), 2)
        s_id = f"ALB-{1000 + i}"
        suppliers.append({
            "id": s_id,
            "name": f"Alibaba Global {prod} Partner {i}",
            "category": cat,
            "product": prod,
            "reliability": rel,
            "address": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
            "endpoint": f"/supplier/{s_id}/respond",
            "base_price": base_price,
            "reliability_score": int(rel * 100),
            "rating": round(rel * 5, 1),
            "delivery_days": rng.randint(2, 15),
            "success_rate": max(0, min(100, int(rel * 100) + rng.randint(-3, 1))),
            "total_deals": 10 + i % 5,
            "successful_deals": 9 + i % 5,
            "failed_deals": 1,
            "on_time_deliveries": 8 + i % 5,
            "late_deliveries": 2,
            "reputation_hash": hashlib.sha256(f"{s_id}-{base_price}".encode()).hexdigest(),
            "country": region,
            "region": region,
            "moq": rng.choice([100, 250, 500, 1000]),
            "lead_time_days": rng.randint(5, 20),
            "negotiated_price": round(base_price * 0.85, 2)
        })
    return suppliers
