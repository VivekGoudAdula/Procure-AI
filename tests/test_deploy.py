import os
import sys
from dotenv import load_dotenv

# Load env variables BEFORE importing other modules
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

# Ensure we can import from the current directory (for escrow_service and escrow_client)
sys.path.append(os.path.join(os.getcwd(), "backend"))

from escrow_service import deploy_escrow

def test():
    print("🚀 Starting Test Deployment on Algorand TestNet...")
    
    # Test addresses
    buyer = "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE" # Dummy
    supplier = "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY"
    amount = 100000 # 0.1 ALGO
    
    print(f"Deploying with Buyer: {buyer[:10]}... and Amount: {amount/1000000} ALGO")
    
    result = deploy_escrow(buyer, supplier, amount)
    
    if "error" in result:
        print(f"❌ Deployment Failed: {result['error']}")
    else:
        print(f"✅ Deployment Successful!")
        print(f"App ID: {result['app_id']}")
        print(f"App Address: {result['app_address']}")
        print(f"Tx ID: {result['transaction_id']}")

if __name__ == "__main__":
    test()
