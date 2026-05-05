# This file is auto-generated, do not modify
# flake8: noqa
# fmt: off
import typing

import algopy


class EscrowContract(algopy.arc4.ARC4Client, typing.Protocol):
    """

        ProcureAI Escrow Smart Contract
        Holds funds from buyer and releases to supplier upon delivery confirmation.
    
    """
    @algopy.arc4.abimethod(create='require')
    def create(
        self,
        _buyer: algopy.arc4.Address,
        _supplier: algopy.arc4.Address,
        _amount: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> None:
        """
        Initialize the escrow with buyer, supplier, and agreed amount.
        """

    @algopy.arc4.abimethod
    def fund(
        self,
        payment: algopy.gtxn.PaymentTransaction,
    ) -> None:
        """
        Buyer funds the escrow with the agreed amount.
        """

    @algopy.arc4.abimethod
    def mark_verified(
        self,
    ) -> None:
        """
        Mark the delivery as verified. Only buyer can call this.
        """

    @algopy.arc4.abimethod
    def confirm_delivery(
        self,
    ) -> None:
        """
        Buyer confirms delivery - releases funds to supplier.
        """

    @algopy.arc4.abimethod(readonly=True)
    def get_funded(
        self,
    ) -> algopy.arc4.Bool:
        """
        Returns whether escrow is funded.
        """

    @algopy.arc4.abimethod(readonly=True)
    def get_released(
        self,
    ) -> algopy.arc4.Bool:
        """
        Returns whether funds have been released.
        """

    @algopy.arc4.abimethod(readonly=True)
    def get_verified(
        self,
    ) -> algopy.arc4.Bool:
        """
        Returns whether delivery is verified.
        """
