from algopy import ARC4Contract, arc4, UInt64, Account, itxn, gtxn, Global, Txn, GlobalState


class EscrowContract(ARC4Contract):
    """
    ProcureAI Escrow Smart Contract
    Holds funds from buyer and releases to supplier upon delivery confirmation.
    """

    def __init__(self) -> None:
        self.buyer = GlobalState(Account)
        self.supplier = GlobalState(Account)
        self.amount = GlobalState(UInt64)
        self.is_funded = GlobalState(bool)
        self.is_released = GlobalState(bool)

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self, _buyer: Account, _supplier: Account, _amount: UInt64) -> None:
        """Initialize the escrow with buyer, supplier, and agreed amount."""
        self.buyer.value = _buyer
        self.supplier.value = _supplier
        self.amount.value = _amount
        self.is_funded.value = False
        self.is_released.value = False

    @arc4.abimethod
    def fund(self, payment: gtxn.PaymentTransaction) -> None:
        """Buyer funds the escrow with the agreed amount."""
        assert Txn.sender == self.buyer.value, "Only buyer can fund"
        assert payment.sender == Txn.sender, "Payment must come from buyer"
        assert payment.receiver == Global.current_application_address, "Payment must go to contract"
        assert payment.amount == self.amount.value, "Payment amount must match agreed amount"
        assert not self.is_funded.value, "Escrow already funded"
        self.is_funded.value = True

    @arc4.abimethod
    def confirm_delivery(self) -> None:
        """Buyer confirms delivery - releases funds to supplier."""
        assert Txn.sender == self.buyer.value, "Only buyer can confirm delivery"
        assert self.is_funded.value, "Escrow not funded yet"
        assert not self.is_released.value, "Funds already released"
        self.is_released.value = True
        itxn.Payment(
            receiver=self.supplier.value,
            amount=self.amount.value,
            fee=0,
        ).submit()

    @arc4.abimethod(readonly=True)
    def get_funded(self) -> arc4.Bool:
        """Returns whether escrow is funded."""
        return arc4.Bool(self.is_funded.value)

    @arc4.abimethod(readonly=True)
    def get_released(self) -> arc4.Bool:
        """Returns whether funds have been released."""
        return arc4.Bool(self.is_released.value)
