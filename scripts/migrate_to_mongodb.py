import json
import os
import sys

# Add backend directory to sys.path to enable imports of main and services
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from db import users_collection, suppliers_collection, escrows_collection

BASE_DIR = backend_path
DATABASE_PATH = os.path.join(BASE_DIR, "database.json")
ESCROW_RECORDS_PATH = os.path.join(BASE_DIR, "escrow_records.json")

def migrate():
    print("[Migration] Starting data migration from JSON to MongoDB...")

    # Migrate Users and Suppliers
    if os.path.exists(DATABASE_PATH):
        try:
            with open(DATABASE_PATH, "r", encoding="utf-8") as f:
                db_data = json.load(f)
            
            # Users migration
            users = db_data.get("users", [])
            if users:
                print(f"[Migration] Found {len(users)} users. Migrating...")
                # Clear and insert
                users_collection.delete_many({})
                users_collection.insert_many(users)
                print(f"[Migration] Successfully migrated users.")

            # Suppliers migration
            suppliers = db_data.get("suppliers", [])
            if suppliers:
                print(f"[Migration] Found {len(suppliers)} suppliers. Migrating...")
                suppliers_collection.delete_many({})
                suppliers_collection.insert_many(suppliers)
                print(f"[Migration] Successfully migrated suppliers.")
        except Exception as e:
            print(f"[Migration] Error migrating database.json: {e}")
    else:
        print(f"[Migration] database.json not found at {DATABASE_PATH}")

    # Migrate Escrow Records
    if os.path.exists(ESCROW_RECORDS_PATH):
        try:
            with open(ESCROW_RECORDS_PATH, "r", encoding="utf-8") as f:
                escrow_data = json.load(f)
            
            # escrow_data is a dict of escrow records
            if escrow_data:
                print(f"[Migration] Found {len(escrow_data)} escrow records. Migrating...")
                escrows_collection.delete_many({})
                
                # Convert the dictionary format to a list of documents
                documents = []
                for tx_id, record in escrow_data.items():
                    # Ensure transaction_id is in document
                    record["transaction_id"] = tx_id
                    documents.append(record)
                
                if documents:
                    escrows_collection.insert_many(documents)
                print(f"[Migration] Successfully migrated escrow records.")
        except Exception as e:
            print(f"[Migration] Error migrating escrow_records.json: {e}")
    else:
        print(f"[Migration] escrow_records.json not found at {ESCROW_RECORDS_PATH}")

    print("[Migration] Migration completed successfully.")

if __name__ == "__main__":
    migrate()
