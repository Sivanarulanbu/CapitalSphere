# 🏦 CapitalSphere: Digital Banking Ecosystem

![CapitalSphere Banner](docs/images/banner.png)

CapitalSphere is a professional, high-trust digital banking application built using a modern **Django + React** tech stack. It provides a secure, glassmorphic UI for managing personal accounts, fund transfers, and loan applications, with full administrative control for banking staff.

---

## 🚀 Key Features

### 👤 User Services
- **Secure Authentication**: JWT-based login with optional OTP verification.
- **KYC Onboarding**: Digital document submission and verification tracking.
- **Account Management**: Support for Savings, Current, FD, and Salary accounts.
- **Modern Dashboard**: Real-time balance tracking and financial analytics using Recharts.

### 💸 Transactions & Loans
- **Fund Transfers**: Secure transfers between accounts with transaction PIN validation.
- **Beneficiary Management**: Save frequently used account details.
- **Loan Lifecycle**: Application, review by loan officers, and automated disbursement/repayment.
- **Transaction History**: Filterable, paginated history with risk scoring and audit logs.

### 🛡️ Security & Administration
- **Advanced Permissions**: Granular roles (User, Admin, Super Admin, Loan Officer).
- **Audit Logs**: Comprehensive tracking of all critical user actions and login sessions.
- **Pin Verification**: Hashed transaction PINs for double-factor fund security.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Frontend [Client Layer: React + Vite]
        UI[Glassmorphic UI] --> State[Auth Context / State]
        State --> Axios[Axios API Client]
    end

    subgraph Backend [Server Layer: Django REST Framework]
        Axios --> Auth[JWT Authentication]
        Auth --> Views[REST Views & Serializers]
        Views --> Business[Business Logic / Services]
    end

    subgraph Data [Persistence Layer]
        Business --> DB[(PostgreSQL Database)]
        Business --> Cache[Shared Cache / Redis]
    end

    subgraph External [External Services]
        Business --> Email[SMTP Email Service]
    end
```

---

## 📊 Database Schema (ERD)

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : owns
    USER ||--o{ OTP_VERIFICATION : verifies
    USER ||--o{ AUDIT_LOG : generates
    USER ||--o{ KYC_DOCUMENT : provides
    
    ACCOUNT ||--o{ TRANSACTION : sources
    ACCOUNT ||--o{ TRANSACTION : receives
    ACCOUNT ||--o{ LEDGER : records
    
    TRANSACTION ||--o{ LEDGER : split_into
    
    USER {
        uuid id PK
        string email
        string full_name
        string role
        string kyc_status
        string transaction_pin
    }
    
    ACCOUNT {
        uuid id PK
        string account_number
        string account_type
        decimal balance
        string status
    }
    
    TRANSACTION {
        uuid id PK
        decimal amount
        string type
        string status
        string reference_number
    }
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS (for Layouts), Lucide Icons, Recharts |
| **Backend** | Django 5, Django REST Framework, SimpleJWT, WhiteNoise |
| **Database** | PostgreSQL |
| **Security** | Argon2 Hashing, JWT Rotation, OTP-based Verification |

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup
1. Navigate to `backend/`
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:
   ```env
   DB_NAME=bank
   DB_USER=postgres
   DB_PASSWORD=your_password
   SECRET_KEY=your_secret_key
   ```
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Created with ❤️ for CapitalSphere.*
