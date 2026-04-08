import os
from algopy import compile_contract
from escrow import EscrowContract

def compile():
    print("Compiling EscrowContract...")
    try:
        # Compile the contract to TEAL
        # Note: compile_contract returns (approval_teal, clear_teal)
        approval, clear = compile_contract(EscrowContract)

        # Write the approval program
        with open("approval.teal", "w") as f:
            f.write(approval)
        
        # Write the clear program
        with open("clear.teal", "w") as f:
            f.write(clear)

        print("Compilation successful!")
        print("- approval.teal generated")
        print("- clear.teal generated")
    except Exception as e:
        print(f"Compilation failed: {e}")

if __name__ == "__main__":
    compile()
