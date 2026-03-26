# Security Overview - CapitalSphere

This document outlines the security measures implemented in the CapitalSphere Digital Banking platform.

## 1. Backend Security (Django)

### Security Headers
The following headers are enforced in production (`DEBUG=False`):
- `Strict-Transport-Security` (HSTS): 1 year duration.
- `X-Frame-Options: DENY`: Prevents the site from being embedded in iframes (Anti-Clickjacking).
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `Referrer-Policy: same-origin`: Protects sensitive data in URLs from being leaked.
- `SECURE_SSL_REDIRECT`: Forces all traffic over HTTPS.

### Authentication & Authorization
- **JWT (JSON Web Tokens)**: Used for stateless authentication.
  - `ROTATE_REFRESH_TOKENS`: Refresh tokens are rotated on every use.
  - `BLACKLIST_AFTER_ROTATION`: Old refresh tokens are invalidated immediately.
- **Throttling (Rate Limiting)**:
  - `Login`: 5 attempts per minute.
  - `Register/OTP/Password Reset`: 10 attempts per minute.
- **Password Hashing**: Uses `Argon2` as the primary hasher, which is more resistant to GPU-based brute-force attacks than standard PBKDF2.

### Auditing & Monitoring
- **Audit Logs**: Every sensitive action (Transfers, Account Creation, Loan Applications, KYC) is recorded in the `audit_logs` table with IP address and success status.
- **Security Logging**: Critical system errors and suspicious activities are logged to `backend/security.log`.

### Data Integrity
- **Atomic Transactions**: All money movements (transfers, deposits, disbursements) use Django's `transaction.atomic()` and `select_for_update()` to prevent race conditions and ensure data consistency.
- **Double-Entry Ledger**: Every transaction creates a corresponding ledger entry for auditing.

## 2. Frontend Security (React + Vite)

### Environment Management
- Sensitive configuration like `VITE_API_BASE_URL` is managed via `.env` files and is never hardcoded.
- `.env` files are excluded from version control via `.gitignore`.

### XSS Prevention
- React's default data binding provides built-in protection against most XSS attacks.
- Sensitive data is never stored in unencrypted cookies.

## 3. Deployment Recommendations

1. **Secret Key**: Ensure a unique, cryptographically strong `SECRET_KEY` is set in production.
2. **Database**: Use a managed PostgreSQL service with encrypted storage and SSL connections.
3. **Environment**: Always set `DEBUG=False` in production.
4. **CORS**: Narrow `CORS_ALLOWED_ORIGINS` to only the specific frontend domain.
