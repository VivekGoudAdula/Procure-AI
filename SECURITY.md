# ProcureAI Security Documentation

This document describes the security policies, access controls, key protection measures, and production-grade security implementations for ProcureAI.

---

## 🔒 Current Security Implementations

### 1. Cryptographic Password Hashing (Bcrypt)
All user passwords are encrypted using bcrypt hashing before storage.
* **Algorithm**: Blowfish-based key derivation function (`bcrypt`) with a dynamically generated salt (`gensalt`).
* **Hashed Storage**: Plaintext passwords are never stored. Upon login, credentials are safe-checked against bcrypt hashes, protecting user databases in case of breach.

### 2. JSON Web Token (JWT) Authentication
ProcureAI uses stateless JSON Web Token (JWT) authentication to secure backend operations.
* **Token Structure**: Issued JWTs include token expiration (`exp`) set to `30` minutes and user subject identifier (`sub`).
* **Validation**: FastAPI dependency injection (`get_current_user` using HTTPBearer credentials) validates signatures, claims, and expirations for all protected routes, including procurement insights, analytics, supplier selection, and escrow controls.

### 3. SlowAPI Rate Limiting
To mitigate brute-force and Denial of Service (DoS) attacks, endpoint rate limits are enforced server-side.
* **Mechanism**: Uses the `slowapi` library which tracks clients by remote IP addresses.
* **Limits**:
  * **Brute-Force Protection**: `/api/login` and `/api/signup` are strictly limited to `5 requests/minute`.
  * **API Protection**: Escrow operations, supplier selection, and negotiation routes are capped at `20-30 requests/minute`.

### 4. Secure File Upload Validation
Invoice and delivery proof uploads are heavily sanitized to prevent remote code execution or file traversal exploits.
* **MIME Verification**: Uploaded files are strictly restricted to `image/png`, `image/jpeg`, and `application/pdf`.
* **Extension Matching**: Only files with explicit `.jpg`, `.jpeg`, `.png`, and `.pdf` extensions are accepted.
* **Sanitization**: Destination filenames are re-mapped using the unique `escrow_id` and unix timestamps, isolating user inputs from backend path executions.

### 5. Configurable CORS (Cross-Origin Resource Sharing)
Access to backend endpoints is restricted to trusted origins.
* **Allowed Origins**: Configured dynamically via the `ALLOWED_ORIGINS` environment variable (e.g., `http://localhost:3000,http://localhost:5173`).
* **Credentials Policy**: Credentials sharing is turned off by default (`allow_credentials=False`) unless explicitly enabled, preventing unauthorized cross-site scripting/request attacks.

### 6. Environment Variable Separation
All high-privilege keys, database secrets, and blockchain credentials are separated from code.
* **Mnemonic Storage**: The platform's 25-word mnemonic key is loaded strictly at runtime.
* **Database Isolation**: MongoDB connection URIs are managed through Render environment variables.
* **Exclusion Policies**: `.gitignore` explicitly prevents `.env` or temporary key configs from being pushed to source repositories.

---

## 🗺️ Future Security Roadmap

To achieve enterprise-grade security, the following roadmap is planned:

### 🔑 1. Role-Based Access Control (RBAC)
* **Roadmap**: Define distinct scopes for users (e.g., `buyer`, `supplier`, `admin`).
* **Details**: Inspect JWT scopes during authentication to ensure only specific roles can trigger critical endpoints like `/api/procurement/verify-delivery` or `/api/procurement/release-settlement`.

### 🛡️ 2. Escrow Signature Handshake
* **Roadmap**: Require double signature verification.
* **Details**: Both buyer and supplier will submit signed messages to the API, which are verified on-chain by the smart contract before updating delivery or releasing escrow funds, providing end-to-end trust.
