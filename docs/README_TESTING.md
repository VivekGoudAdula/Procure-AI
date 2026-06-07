# ProcureAI Backend Validation & Testing Suite

This repository contains an automated testing suite for the **ProcureAI** backend. It validates API endpoints, business logic, and transaction lifecycles without requiring external database connections or blockchain operations.

---

## Testing Strategy

To ensure stability and rapid validation:
* **Algorand TestNet Mocking**: Smart contract operations are mocked to avoid consuming Test ALGOs or failing due to network issues.
* **In-Memory Database**: MongoDB calls use an in-memory datastore for instant test execution.
* **Isolated Environment**: Network services like SMTP are mocked to return success immediately.

---

## Test Inventory

The suite contains **4 tests** covering health, supplier intelligence, and escrow operations:

1. **`tests/test_health.py`**
   * `test_health_endpoint`: Verifies the `/health` endpoint returns HTTP 200.
2. **`tests/test_supplier_selection.py`**
   * `test_supplier_selection_api_response`: Checks the `/api/select-supplier` request structure.
   * `test_ranking_logic_winner`: Verifies the ranking algorithm selects the highest score.
3. **`tests/test_escrow.py`**
   * `test_full_escrow_lifecycle`: Verifies the complete escrow lifecycle:
     1. **Creation**: `/api/procurement/initiate-commitment`
     2. **Delivery Proof**: `/api/submit-delivery-proof`
     3. **Verification**: `/api/procurement/verify-delivery`
     4. **Release Settlement**: `/api/procurement/release-settlement`

---

## How to Run Tests

### Prerequisites
Install pytest and httpx:
```bash
pip install pytest httpx
```

### Running the Suite
Run tests from the project root:
```bash
python -m pytest tests/
```

Or for verbose output:
```bash
python -m pytest -v tests/
```

---

## Expected Output

Expected output:

```
============================= test session starts =============================
platform win32 -- Python 3.11.x, pytest-7.x.x, pluggy-1.x.x
rootdir: C:\HACKATHONS\36. ALGOBHARAT HACK SERIES 3.0 - ALGORAND\APP
collected 4 items

tests/test_health.py .                                                   [ 25%]
tests/test_supplier_selection.py ..                                      [ 75%]
tests/test_escrow.py .                                                   [100%]

============================== 4 passed in 0.32s ==============================
```
