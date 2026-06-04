# Security Implementation Report: ProcureAI Hardening

This report details the security hardening implementations completed for the ProcureAI backend.

---

## 1. Password Security (Bcrypt)

- **Implementation**: Replaced plaintext password storage with secure `bcrypt` hashing using a work factor/salt.
- **Workflow**:
  - **Signup (`/api/signup`)**: Passwords are coded to UTF-8, salted, and hashed using `bcrypt.hashpw(password, bcrypt.gensalt())`. The resulting string is persisted to MongoDB.
  - **Login (`/api/login`)**: Passwords submitted during authentication are verified using `bcrypt.checkpw(password, hash)`.
- **Backward Compatibility**: A robust check is implemented to verify plaintext matches if the database hash does not match standard bcrypt patterns, preventing service disruptions for legacy accounts.

---

## 2. JWT Authentication Architecture

- **Token Scheme**: JSON Web Tokens (JWT) using the `PyJWT` library.
- **Tokens**: Created after successful login, containing:
  - Subject (`sub`): Email address of the user.
  - Expiration (`exp`): 30 minutes by default (configurable).
  - Signature: Signed via the secret `JWT_SECRET_KEY` using the `HS256` hashing algorithm.
- **Access Middleware / Dependency**: A reusable FastAPI dependency `get_current_user` was added using `fastapi.security.HTTPBearer`. It intercepts the `Authorization: Bearer <token>` header, decodes the token, checks for signature validity and expiration, and retrieves the email. If the token is missing, invalid, or expired, it returns standard HTTP `401 Unauthorized` or `403 Forbidden` statuses.

---

## 3. API Rate Limiting Strategy

- **Library**: `slowapi` (based on limits).
- **Resolver**: Client remote IP address via `get_remote_address`.
- **Configuration**:
  - Enabled by default in development and production modes.
  - Disabled during test runs (`TESTING=True`) to maintain clean testing pipelines.
- **Endpoint Limits**:
  - **Auth Limits**: `5 requests/minute` (covers `/api/login` and `/api/signup` to prevent brute-force attacks).
  - **Supplier Selection/Negotiation**: `30 requests/minute` (prevents crawler spamming and API overloading).
  - **Escrow Operations**: `20 requests/minute` (mitigates double-spending and ledger manipulation vectors).

---

## 4. File Upload Validation

- **Mechanism**: Validates the MIME (Multipurpose Internet Mail Extensions) type of uploaded files in addition to standard file extension checking.
- **Target Route**: `/api/submit-delivery-proof` (invoice uploads).
- **Validation Rules**:
  - **Permitted MIME Types**: `image/png`, `image/jpeg`, `application/pdf`.
  - **Rejection Policy**: All other file formats are rejected immediately with a `400 Bad Request` HTTP error.

---

## 5. CORS Hardening

- **Modification**: Replaced wildcard configurations (`allow_origins=["*"]`) with restricted configurations.
- **Source**: Comma-separated domain names loaded dynamically from the `ALLOWED_ORIGINS` environment variable.
- **Fallbacks**: In development, defaults to standard local frontend environments (`http://localhost:3000,http://localhost:5173`).

---

## 6. Uvicorn Production Configuration

- **Rule**: Startup never runs with `reload=True` when running in production.
- **Check**: The startup checks the `APP_ENV` environment variable. If set to `"production"`, uvicorn hot-reload is forced to `False`.

---

## 7. Protected Endpoints List

All critical dashboard, analytics, escrow, supplier, and negotiation endpoints are protected using JWT token dependency. Below is the list of endpoints hardened:

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
