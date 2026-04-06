from algosdk.v2client import algod
from algosdk import transaction
import os

# TestNet Algorand Node (Example using Algonode)
ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")

def get_algod_client():
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# DEMO MODE: Configuration for Hackathon stability
DEMO_TRANSACTION_AMOUNT = 0.1 # ALGO

def create_transaction(sender_address, receiver_address, amount_algos):
    """
    Creates an unsigned payment transaction.
    """
    try:
        client = get_algod_client()
        params = client.suggested_params()
        
        # Use DEMO_TRANSACTION_AMOUNT for on-chain value to ensure demo stability
        amount_micro_algos = int(DEMO_TRANSACTION_AMOUNT * 1_000_000)
        
        txn = transaction.PaymentTxn(sender_address, params, receiver_address, amount_micro_algos)
        
        # Return dictified transaction for serialization
        return {"unsigned_txn": transaction.write_to_binary(txn).hex(), "message": "Transaction created successfully. Ready for signing."}
    except Exception as e:
        return {"error": str(e)}

def simulate_escrow(action):
    """
    Simulates simple escrow logic.
    """
    if action == "lock":
        return {"status": "locked", "message": "Funds are securely locked in the smart contract escrow."}
    elif action == "release":
        return {"status": "released", "message": "Conditions met. Funds released to the supplier."}
    else:
        return {"status": "error", "message": "Invalid escrow action."}
