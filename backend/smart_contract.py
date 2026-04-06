from pyteal import *

def escrow_program():
    # Global state keys
    key_buyer = Bytes("buyer")
    key_supplier = Bytes("supplier")
    key_amount = Bytes("amount")
    key_is_released = Bytes("released")

    # Initialization: Called when creating the app
    # Expects 2 arguments: supplier_address (Bytes), agreed_amount (Int)
    on_create = Seq(
        App.globalPut(key_buyer, Txn.sender()),
        App.globalPut(key_supplier, Txn.application_args[0]),
        App.globalPut(key_amount, Btoi(Txn.application_args[1])),
        App.globalPut(key_is_released, Int(0)),
        Approve()
    )

    # Release Funds: Only callable by the stored buyer
    # This sends an Inner Transaction (ALGO transfer) to the supplier
    release_funds = Seq(
        # Security constraints
        Assert(Txn.sender() == App.globalGet(key_buyer)),
        Assert(App.globalGet(key_is_released) == Int(0)),
        
        # Inner Transaction: Transfer full amount from App account to Supplier
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(key_supplier),
            TxnField.amount: App.globalGet(key_amount),
            TxnField.fee: Int(0) # App account must have balance to cover this or we use pooled fees
        }),
        InnerTxnBuilder.Submit(),

        # Update state
        App.globalPut(key_is_released, Int(1)),
        Approve()
    )

    # Delete/Refund: Alternative end state (optional, for safety)
    # Allows buyer to reclaim funds if something goes wrong (not used in MVP release)
    refund = Seq(
        Assert(Txn.sender() == App.globalGet(key_buyer)),
        # Inner transaction back to buyer...
        Approve()
    )

    # Boilerplate Router Logic
    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.NoOp, 
            Cond(
                [Txn.application_args[0] == Bytes("release"), release_funds]
            )
        ],
        [Txn.on_completion() == OnComplete.DeleteApplication, Approve()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Approve()]
    )

    return compileTeal(program, mode=Mode.Application, version=6)

def clear_program():
    return compileTeal(Approve(), mode=Mode.Application, version=6)

if __name__ == "__main__":
    with open("escrow_approval.teal", "w") as f:
        f.write(escrow_program())
    with open("escrow_clear.teal", "w") as f:
        f.write(clear_program())
    print("Compilation successful: escrow_approval.teal and escrow_clear.teal generated.")
