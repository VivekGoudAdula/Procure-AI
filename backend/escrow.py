try:
    from puyapy import ARC4Contract, arc4, UInt64, Account, Bool, itxn, gtxn, Global, Txn
except ImportError:
    from algopy import ARC4Contract, arc4, UInt64, Account, Bool, itxn, gtxn, Global, Txn

class EscrowContract(ARC4Contract):
    def __init__(self) -> None:
        self.buyer = Account()
        self.supplier = Account()
        self.amount = UInt64(0)
        self.is_funded = Bool(False)
        self.is_released = Bool(False)
        self.is_verified = Bool(False)

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self, buyer: Account, supplier: Account, amount: UInt64) -> None:
        self.buyer = buyer
        self.supplier = supplier
        self.amount = amount
        self.is_funded = Bool(False)
        self.is_released = Bool(False)
        self.is_verified = Bool(False)

    @arc4.abimethod
    def fund(self, payment: gtxn.PaymentTransaction) -> None:
        assert Txn.sender == self.buyer
        assert payment.sender == Txn.sender
        assert payment.receiver == Global.current_application_address
        assert payment.amount == self.amount
        assert not self.is_funded
        self.is_funded = Bool(True)

    @arc4.abimethod
    def mark_verified(self) -> None:
        assert Txn.sender == self.buyer, "Only buyer can verify"
        assert self.is_funded, "Must be funded"
        self.is_verified = Bool(True)

    @arc4.abimethod
    def confirm_delivery(self) -> None:
        assert Txn.sender == self.buyer
        assert self.is_funded
        assert self.is_verified, "Delivery not verified"
        assert not self.is_released
        self.is_released = Bool(True)
        itxn.Payment(
            receiver=self.supplier,
            amount=self.amount,
            fee=0
        ).submit()
