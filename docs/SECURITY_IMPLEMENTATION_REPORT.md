# Security Implementation Report: ProcureAI Hardening

This report details security implementations for the ProcureAI backend.

---

## 1. Password Security (Bcrypt)

- **Implementation**: Replaced plaintext passwords with bcrypt hashing.
- **Workflow**:
  - **Signup**: Passwords are salted and hashed using `bcrypt.hashpw()` and stored in MongoDB.
  - **Login**: Passwords are verified using `bcrypt.checkpw()`.
- **Backward Compatibility**: Checks for plaintext matches if hash doesn't match bcrypt patterns.

---

## 2. JWT Authentication Architecture

- **Token Scheme**: JWT using `PyJWT` library.
- **Tokens**: Created after login with:
  - Subject (`sub`): User email.
  - Expiration (`exp`): 30 minutes (configurable).
  - Signature: Signed with `JWT_SECRET_KEY` using `HS256`.
- **Middleware**: FastAPI dependency `get_current_user` validates tokens via `Authorization: Bearer` header. Returns 401/403 for invalid tokens.

---

## 3. API Rate Limiting Strategy

- **Library**: `slowapi`.
- **Resolver**: Client IP via `get_remote_address`.
- **Configuration**:
  - Enabled by default.
  - Disabled during tests (`TESTING=True`).
- **Limits**:
  - **Auth**: `5 requests/minute` for login/signup.
  - **Supplier/Negotiation**: `30 requests/minute`.
  - **Escrow**: `20 requests/minute`.

---

## 4. File Upload Validation

- **Mechanism**: Validates MIME type of uploaded files.
- **Target Route**: `/api/submit-delivery-proof`.
- **Rules**:
  - **Allowed**: `image/png`, `image/jpeg`, `application/pdf`.
  - **Rejection**: Other formats return 400 error.

---

## 5. CORS Hardening

- **Modification**: Replaced wildcard origins with restricted list.
- **Source**: Comma-separated domains from `ALLOWED_ORIGINS`.
- **Fallback**: Defaults to `http://localhost:3000,http://localhost:5173` in development.

---

## 6. Uvicorn Production Configuration

- **Rule**: Never run with `reload=True` in production.
- **Check**: Checks `APP_ENV`. If `"production"`, sets reload to `False`.

---

## 7. Protected Endpoints List

Critical endpoints are protected with JWT tokens:

### Dashboard & Analytics APIs (JWT Protected)
- `GET /api/procurement/analytics`
- `GET /api/dashboard/analytics`
- `GET /api/dashboard/insights`
- `GET /api/dashboard/procurement-feed`
- `GET /api/dashboard/regions`
- `GET /api/settlements/analytics`
- `GET /api/settlements/ledger`
- `POST /api/x402/initiate-session`
- `POST /api/procurement/intelligence`

### Supplier Sourcing & Negotiation APIs (JWT Protected + Rate Limited: 30 req/min)
- `POST /api/agent-competition`
- `POST /api/select-supplier`
- `POST /api/procurement/select-supplier`
- `GET /api/suppliers`
- `GET /api/suppliers/{supplier_id}`
- `POST /api/update-reputation`
- `POST /supplier/{supplier_id}/respond`
- `POST /api/negotiation/multilingual`
- `POST /api/negotiation/multilingual/full`
- `GET /api/negotiation/languages`
- `POST /api/negotiation/intelligence`
- `POST /api/procurement/generate-inquiry`
- `POST /api/procurement/send-inquiry`

### Escrow & Settlement APIs (JWT Protected + Rate Limited: 20 req/min)
- `POST /api/prepare-transaction`
- `GET /api/escrow/{action}`
- `POST /api/procurement/initiate-commitment`
- `POST /api/procurement/release-settlement`
- `POST /api/submit-delivery-proof` (Also enforces strict upload validation)
- `POST /api/procurement/verify-delivery`
- `POST /api/update-escrow-status`
- `GET /api/get-transaction/{tx_id}`

### Public Endpoints
- `GET /health` (Public health check)
- `POST /api/signup` (Public signup; rate limited: 5 req/min)
- `POST /api/login` (Public login; rate limited: 5 req/min)
