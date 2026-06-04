# ProcureAI Backend Validation & Testing Suite

This repository contains a lightweight, isolated, and highly reliable automated testing suite for the **ProcureAI** backend. It validates key API endpoints, core business logic, and transaction lifecycles without requiring actual external database connections or blockchain operations.

---

## 🛠️ Testing Philosophy & Mock Strategy

To ensure hackathon stability and rapid, non-breaking validation:
* **Algorand TestNet Mocking**: Smart contract deployment and blockchain interactions are intercepted and mocked to avoid consuming Test ALGOs or failing due to TestNet latency or downtime.
* **In-Memory Database**: MongoDB calls are mocked using an in-memory dictionary-backed datastore to allow tests to run instantly without external connection dependencies.
* **Isolated Environment**: Network-sensitive services (such as SMTP email sending) are mocked to return mock success status immediately.

---

## 📋 Test Inventory

The suite contains **4 core tests** covering health, supplier intelligence, and blockchain escrow operations:

1. **`tests/test_health.py`**
   * `test_health_endpoint`: Verifies that the `/health` endpoint is alive (returns HTTP 200) and returns the correct healthy state payload.
2. **`tests/test_supplier_selection.py`**
   * `test_supplier_selection_api_response`: Checks the `/api/select-supplier` HTTP POST request structure (supplier list, rounds, final winner selection).
   * `test_ranking_logic_winner`: Calls the underlying mathematical ranking algorithm directly and verifies that the selected winner indeed has the highest score.
3. **`tests/test_escrow.py`**
   * `test_full_escrow_lifecycle`: Verifies the complete sequential lifecycle of an Algorand procurement escrow:
     1. **Creation**: `/api/procurement/initiate-commitment`
     2. **Delivery Proof**: `/api/submit-delivery-proof`
     3. **Verification**: `/api/procurement/verify-delivery`
     4. **Release Settlement**: `/api/procurement/release-settlement`

---

## 🚀 How to Run the Tests

### Prerequisites
Make sure `pytest` and `httpx` (for FastAPI's `TestClient`) are installed:
```bash
pip install pytest httpx
```

### Running the Suite
Execute the tests from the root of the project:
```bash
python -m pytest tests/
```

Or for verbose output:
```bash
python -m pytest -v tests/
```

---

## 📊 Expected Output

When running the tests, you should see output similar to the following:

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
