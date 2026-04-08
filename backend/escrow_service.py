import os
import logging
from algosdk import account, encoding
from algosdk.v2client import algod
import algokit_utils
import escrow_client
from escrow_client import EscrowContractClient, CreateArgs, FundArgs

logger = logging.getLogger(__name__)

# Algorand configuration
# Algorand configuration
ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
MNEMONIC = os.getenv("MNEMONIC")

# Re-map for algokit_utils.from_environment()
os.environ["ALGOD_SERVER"] = ALGOD_ADDRESS
os.environ["ALGOD_TOKEN"] = ALGOD_TOKEN
os.environ["ALGOD_PORT"] = "443" if "https" in ALGOD_ADDRESS else ""
# Set up indexer
os.environ["INDEXER_SERVER"] = ALGOD_ADDRESS.replace("api", "idx")
os.environ["INDEXER_TOKEN"] = ALGOD_TOKEN
os.environ["INDEXER_PORT"] = os.environ["ALGOD_PORT"]

def get_algorand_client():
    """Configures AlgorandClient for the environment."""
    return algokit_utils.AlgorandClient.from_environment()

def deploy_escrow(buyer_address: str, supplier_address: str, amount_microalgos: int):
    """
    Deploys a new EscrowContract instance.
    In a real app, this would be triggered and paid for by the platform or buyer.
    """
    try:
        algorand = get_algorand_client()
        
        # Get deployer account
        if MNEMONIC:
            from algosdk import mnemonic, account as algosdk_account
            pk = mnemonic.to_private_key(MNEMONIC)
            deployer_addr = algosdk_account.address_from_private_key(pk)
            from algokit_utils.models.account import SigningAccount
            deployer = SigningAccount(private_key=pk, address=deployer_addr)
        else:
            deployer = algorand.account.from_environment("DEPLOYER")

        # Use EscrowContractFactory for deployment
        factory = escrow_client.EscrowContractFactory(
            algorand=algorand,
            default_sender=deployer.address,
            default_signer=deployer.signer
        )

        client, result = factory.send.create.create(
            args=CreateArgs(
                buyer=buyer_address,
                supplier=supplier_address,
                amount=amount_microalgos
            )
        )
        
        return {
            "app_id": client.app_id,
            "app_address": client.app_address,
            "transaction_id": result.transaction_id if hasattr(result, "transaction_id") else getattr(result, "tx_id", ""),
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Failed to deploy escrow: {e}")
        return {"error": str(e)}

def fund_escrow(app_id: int, buyer_address: str, amount_microalgos: int):
    """
    Helper to prepare the funding transaction.
    Usually the frontend will sign this, but we can provide logic here.
    """
    # This would involve creating a PaymentTransaction to the app address
    # and then calling the 'fund' method.
    pass

def confirm_delivery_on_chain(app_id: int, buyer_address: str):
    """
    Calls the confirm_delivery method on the smart contract.
    """
    try:
        algorand = get_algorand_client()
        
        # We need the buyer's signer. In a real app, this is in the wallet.
        # This service mostly facilitates read or platform-level calls.
        return {"message": "Requires signature from buyer wallet"}
    except Exception as e:
        return {"error": str(e)}
