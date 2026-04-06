import os
import base64
from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure credentials
ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
MNEMONIC = os.getenv("MNEMONIC", "")

# Initialize Client
client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def get_sender_info():
    if not MNEMONIC:
        return None, "MNEMONIC_NOT_CONFIGURED"
    
    words = MNEMONIC.strip().split()
    if len(words) != 25:
        return None, f"INVALID_LENGTH_{len(words)}"
        
    try:
        pk = mnemonic.to_private_key(MNEMONIC)
        addr = account.address_from_private_key(pk)
        return pk, addr
    except Exception as e:
        return None, str(e)

def compile_contract(contract_path):
    # This assumes the user has already run 'python smart_contract.py'
    with open(contract_path, "r") as f:
        teal_code = f.read()
    response = client.compile(teal_code)
    return base64.b64decode(response['result'])

def create_escrow_app(supplier_address, amount_microalgos):
    pk, sender = get_sender_info()
    if not pk:
        raise ValueError(f"Aborting: {sender}. (Note: algosdk expects 25 words. For 24-word Pera wallets, use frontend signing).")
    
    # Load and compile TEAL
    approval_source = compile_contract("escrow_approval.teal")
    clear_source = compile_contract("escrow_clear.teal")

    # Define Application Parameters
    global_schema = transaction.StateSchema(num_uints=2, num_byte_slices=2) # released, amount | buyer, supplier
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Args: supplier_address (Bytes), agreed_amount (Int)
    app_args = [
        sender, # Buyer
        supplier_address,
        amount_microalgos.to_bytes(8, 'big')
    ]

    params = client.suggested_params()
    
    # Create the App
    txn = transaction.ApplicationCreateTxn(
        sender, params, transaction.OnComplete.NoOpOC,
        approval_source, clear_source,
        global_schema, local_schema, app_args
    )

    signed_txn = txn.sign(pk)
    txid = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    transaction.wait_for_confirmation(client, txid, 4)
    response = client.pending_transaction_info(txid)
    app_id = response['application-index']
    app_address = transaction.logic.get_application_address(app_id) # The escrow's address!
    
    return app_id, app_address

def fund_escrow(app_address, amount):
    pk, sender = get_sender_info()
    if not pk: return
    params = client.suggested_params()
    txn = transaction.PaymentTxn(sender, params, app_address, amount)
    signed_txn = txn.sign(pk)
    txid = client.send_transaction(signed_txn)
    print(f"Escrow funded: {txid}")

def release_escrow(app_id):
    pk, sender = get_sender_info()
    if not pk: return
    params = client.suggested_params()
    app_args = [b"release"]
    
    txn = transaction.ApplicationNoOpTxn(sender, params, app_id, app_args)
    signed_txn = txn.sign(pk)
    txid = client.send_transaction(signed_txn)
    print(f"Escrow released to supplier! Transaction: {txid}")

if __name__ == "__main__":
    # Example Demo Flow
    # Replace with a real testnet address you want to pay
    demo_supplier = "GD6477M6GCOY6SJYV6G57H7W6RQF2XG6NIU7D4O4ZX7L3V47V4K6A2PZ" 
    demo_amount = 100_000 # 0.1 ALGO (demo stable amount)
    
    try:
        print("Creating Smart Escrow App...")
        app_id, app_address = create_escrow_app(demo_supplier, demo_amount)
        print(f"App Created! ID: {app_id}, Escrow Address: {app_address}")

        print("Step 1: Funding Escrow (Buyer deposits funds)...")
        fund_escrow(app_address, demo_amount)

        print("Step 2: Releasing Escrow (Buyer confirms delivery)...")
        release_escrow(app_id)
    except Exception as e:
        print(f"Deployment Error: {e}")
