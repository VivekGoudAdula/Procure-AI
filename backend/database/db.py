import hashlib
import os
import random
from typing import Any, Dict, List, Optional

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


def _map_intelligence_supplier(s: Dict[str, Any], product_name: str) -> Dict[str, Any]:
    """Normalize Alibaba intelligence rows for MongoDB + agent competition."""
    s_id = str(s.get("id", random.randint(100000, 999999)))
    trust = s.get("trust_score", 85)
    price = s.get("negotiated_price", s.get("base_price", 10.0))
    title = s.get("product_title", product_name)
    doc = {
        "id": s_id,
        "name": s.get("name", "Alibaba Supplier"),
        "category": s.get("category", "General"),
        "product": title,
        "product_title": title,
        "country": s.get("country", "China"),
        "region": s.get("region", s.get("country", "China")),
        "reliability": trust / 100.0,
        "address": s.get("address", "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY"),
        "endpoint": f"/supplier/{s_id}/respond",
        "base_price": float(price),
        "reliability_score": trust,
        "rating": round(trust / 20, 1),
        "delivery_days": s.get("lead_time_days", 10),
        "success_rate": s.get("success_rate", 95),
        "total_deals": s.get("total_deals", 10),
        "successful_deals": s.get("successful_deals", 9),
        "failed_deals": s.get("failed_deals", 1),
        "on_time_deliveries": s.get("on_time_deliveries", 8),
        "late_deliveries": s.get("late_deliveries", 2),
        "reputation_hash": s.get(
            "reputation_hash",
            hashlib.sha256(f"{s_id}-10-95-80".encode()).hexdigest(),
        ),
        "moq": s.get("moq"),
        "negotiated_price": price,
        "trust_score": trust,
        "on_chain_verified": s.get("on_chain_verified", False),
    }
    return doc


def persist_suppliers_from_intelligence(result: Dict[str, Any], product_name: str) -> int:
    """Store suppliers from an explicit sourcing run (POST /api/procurement/intelligence)."""
    raw = result.get("suppliers") or []
    if not raw:
        return 0
    saved = 0
    for s in raw:
        doc = _map_intelligence_supplier(s, product_name)
        suppliers_collection.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
        saved += 1
    if saved:
        print(f"[MongoDB] Cached {saved} supplier(s) from sourcing: '{product_name}'")
    return saved


def _load_suppliers_from_db() -> List[Dict[str, Any]]:
    return list(suppliers_collection.find({}, {"_id": 0}))


def _get_cached_suppliers_uncached(product_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Return suppliers cached in MongoDB (no live Alibaba API)."""
    try:
        suppliers = _load_suppliers_from_db()
    except Exception as e:
        print(f"[MongoDB] Error reading cached suppliers: {e}")
        return []

    if not product_name or not suppliers:
        return suppliers

    needle = product_name.strip().lower()
    matched = []
    for s in suppliers:
        hay = " ".join(
            str(s.get(k) or "")
            for k in ("product", "product_title", "name", "category")
        ).lower()
        if needle in hay or any(w in hay for w in needle.split() if len(w) > 3):
            matched.append(s)
    return matched


def get_cached_suppliers(product_name: Optional[str] = None) -> List[Dict[str, Any]]:
    return _get_cached_suppliers_uncached(product_name)


def get_alibaba_suppliers(product_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Backward-compatible alias: cached suppliers only (never hits Alibaba live)."""
    return get_cached_suppliers(product_name)
