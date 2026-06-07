import os
import logging
from algosdk import account, encoding
from algosdk.v2client import algod
import algokit_utils
from blockchain import escrow_client
from blockchain.escrow_client import EscrowContractClient, CreateArgs, FundArgs

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
    Optimized for speed - broadcasts immediately without waiting for confirmation.
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

        # Use EscrowContractFactory for deployment with optimized send params
        factory = escrow_client.EscrowContractFactory(
            algorand=algorand,
            default_sender=deployer.address,
            default_signer=deployer.signer
        )

        # Optimize deployment - wait only 1 round for fast confirmation
        from algokit_utils import SendParams
        send_params = SendParams(
            max_rounds_to_wait_for_confirmation=1,  # Wait only 1 round (~4 seconds on testnet)
            suppress_log=True  # Reduce logging overhead
        )

        client, result = factory.send.create.create(
            args=CreateArgs(
                _buyer=buyer_address,
                _supplier=supplier_address,
                _amount=amount_microalgos
            ),
            send_params=send_params
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

def confirm_delivery_on_chain(app_id: int, buyer_address: str, supplier_address: str = None):
    """
    Calls the confirm_delivery method on the smart contract.
    """
    try:
        algorand = get_algorand_client()
        
        # Get deployer account
        if MNEMONIC:
            from algosdk import mnemonic, account as algosdk_account
            pk = mnemonic.to_private_key(MNEMONIC)
            deployer_addr = algosdk_account.address_from_private_key(pk)
            from algokit_utils.models.account import SigningAccount
            buyer = SigningAccount(private_key=pk, address=deployer_addr)
        else:
            buyer = algorand.account.from_environment("DEPLOYER")

        # Instantiate EscrowContractClient
        client = EscrowContractClient(
            algorand=algorand,
            app_id=app_id,
            default_sender=buyer.address,
            default_signer=buyer.signer
        )
        
        # Configure static fee to cover inner transaction fee (2000 microalgos)
        # and provide account references for the supplier receiver.
        call_params = algokit_utils.CommonAppCallParams(
            account_references=[supplier_address] if supplier_address else None,
            static_fee=algokit_utils.AlgoAmount(micro_algo=2000)
        )
        
        result = client.send.confirm_delivery(params=call_params)
        
        return {
            "status": "released",
            "transaction_id": result.transaction_id if hasattr(result, "transaction_id") else getattr(result, "tx_id", ""),
            "message": "On-chain settlement released successfully"
        }
    except Exception as e:
        logger.error(f"Failed to confirm delivery on-chain: {e}")
        return {"error": str(e)}
