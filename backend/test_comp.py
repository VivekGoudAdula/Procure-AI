import algopy
from algopy import arc4

class Hello(algopy.ARC4Contract):
    @arc4.abimethod
    def hello(self, name: algopy.String) -> algopy.String:
        return algopy.String("Hello ") + name
