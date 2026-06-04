import os
from dotenv import load_dotenv, find_dotenv

# Load env variables
load_dotenv(find_dotenv())

# x402 Protocol Version — must be 2 for CAIP-2 network identifiers
X402_VERSION = 2

# Treasury wallet address to receive x402 payments
X402_AVM_ADDRESS = os.getenv("X402_AVM_ADDRESS", "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY")

# GoPlausible public facilitator endpoint for payment verification and settlement
X402_FACILITATOR_URL = os.getenv("X402_FACILITATOR_URL", "https://facilitator.goplausible.xyz").rstrip("/")

# Facilitator fee-payer address (managed exclusively by GoPlausible — no private key required on our side)
X402_FACILITATOR_FEE_PAYER = "ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA"

# Network CAIP-2 identifier for Algorand TestNet (official ALGORAND_TESTNET_CAIP2 constant)
X402_NETWORK = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI="

# Payment amount in USDC atomic units (6 decimals): 50000 = 0.05 USDC
X402_PRICE = "50000"

# Algorand TestNet USDC ASA ID (Circle USDC on TestNet)
X402_ASSET = "10458941"

# Payment scheme identifier
X402_SCHEME = "exact"

# Enable demo resilience fallback (unlocks resource if transaction is signed/extracted locally even if on-chain/facilitator lookup fails)
X402_DEMO_FALLBACK = os.getenv("X402_DEMO_FALLBACK", "True").lower() == "true"
