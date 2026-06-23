# Life Location Code Management System (LLCMS)

Sri Lanka administrative location code database with public search, duplicate GN analysis, DS officer verification workflow, and admin dashboard.

## Tech Stack
- **Backend**: Laravel 12, PHP 8.2, MySQL
- **Frontend**: React 18 + Vite
- **Auth**: Laravel Sanctum (token-based)
- **Export**: maatwebsite/excel + barryvdh/laravel-dompdf

---

## Prerequisites
- XAMPP (PHP 8.2 + MySQL)
- Node.js v18+
- Existing MySQL database: `lifelocationcode`

---

## Setup Instructions

### 1. Start MySQL
Open XAMPP Control Panel and start **MySQL**.

### 2. Backend Setup

```bash
cd backend

# Run migrations (creates new tables only)
C:\xampp\php\php.exe artisan migrate --force

# Seed admin user
C:\xampp\php\php.exe artisan db:seed --force

# Start Laravel API server
C:\xampp\php\php.exe artisan serve --port=8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Default Login
| Role  | Email              | Password    |
|-------|--------------------|-------------|
| Admin | admin@llcms.lk     | Admin@1234  |

---

## Database Tables Created (New)
| Table                    | Purpose                              |
|--------------------------|--------------------------------------|
| `users`                  | Admin and DS officer accounts        |
| `officer_ds_assignments` | Links officers to DS divisions       |
| `ds_verifications`       | DS verification status tracking      |
| `verification_logs`      | Audit trail for all changes          |
| `api_access_logs`        | Every public API request logged      |
| `personal_access_tokens` | Sanctum API tokens                   |

## Existing Tables (Read-only master data)
`province`, `district`, `divisional_secretariat`, `grama_niladhari_division`, `village`

---

## API Endpoints

### Public
| Method | Endpoint                          | Description               |
|--------|-----------------------------------|---------------------------|
| GET    | /api/provinces                    | All provinces             |
| GET    | /api/districts?province_id=       | Districts (filtered)      |
| GET    | /api/divisional-secretariats?district_id= | DS Divisions     |
| GET    | /api/gn-divisions?ds_id=          | GN Divisions              |
| GET    | /api/villages?gn_id=              | Villages                  |
| GET    | /api/search                       | Full search with filters  |
| GET    | /api/duplicate-gn                 | Same-GN analysis          |
| GET    | /api/export/search/excel          | Export search to Excel    |
| GET    | /api/export/search/pdf            | Export search to PDF      |
| GET    | /api/export/duplicate-gn/excel    | Export analysis to Excel  |
| GET    | /api/export/duplicate-gn/pdf      | Export analysis to PDF    |

### Authenticated
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| POST   | /api/login                            | Login                    |
| POST   | /api/logout                           | Logout                   |
| GET    | /api/me                               | Current user             |
| GET    | /api/verification/my-gn-divisions     | Officer's GN list        |
| PUT    | /api/verification/gn/{id}             | Update GN division       |
| PUT    | /api/verification/village/{id}        | Update village           |
| POST   | /api/verification/draft               | Mark DS as draft         |
| POST   | /api/verification/final               | Mark DS as verified      |

### Admin Only
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | /api/dashboard/stats                  | Dashboard stats          |
| GET    | /api/dashboard/verification-status   | DS verification status   |
| GET    | /api/admin/users                      | User list                |
| POST   | /api/admin/users                      | Create user              |
| PUT    | /api/admin/users/{id}                 | Update user              |
| DELETE | /api/admin/users/{id}                 | Delete user              |
| POST   | /api/admin/ds/{id}/lock               | Lock DS division         |
| POST   | /api/admin/ds/{id}/unlock             | Unlock DS division       |
| GET    | /api/admin/api-logs                   | API access logs          |

---

## Frontend Pages
| Route             | Page                        |
|-------------------|-----------------------------|
| /                 | Home                        |
| /search           | Public Location Search      |
| /same-gn          | Same GN Different DS Analysis |
| /login            | Login                       |
| /admin            | Admin Dashboard             |
| /admin/reports    | Verification Reports        |
| /admin/api-logs   | API Access Logs             |
| /verify           | DS Officer Dashboard        |
| /verify/gn/:id    | GN Division Editor          |

---

## Project Structure
```
Life Location Code Management System/
├── backend/           ← Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── LocationController.php
│   │   │   ├── SearchController.php
│   │   │   ├── DuplicateGnAnalysisController.php
│   │   │   ├── ExportController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── VerificationController.php
│   │   │   ├── ApiLogController.php
│   │   │   └── AdminController.php
│   │   ├── Http/Middleware/
│   │   │   └── LogApiAccess.php
│   │   ├── Models/
│   │   │   ├── Province.php
│   │   │   ├── District.php
│   │   │   ├── DivisionalSecretariat.php
│   │   │   ├── GramaNiladhariDivision.php
│   │   │   ├── Village.php
│   │   │   ├── User.php
│   │   │   ├── OfficerDsAssignment.php
│   │   │   ├── DsVerification.php
│   │   │   ├── VerificationLog.php
│   │   │   └── ApiAccessLog.php
│   │   └── Exports/
│   │       ├── SearchResultsExport.php
│   │       └── DuplicateGnExport.php
│   ├── database/migrations/   ← New tables only
│   ├── resources/views/exports/
│   └── routes/api.php
└── frontend/          ← React + Vite
    └── src/
        ├── pages/
        ├── components/
        ├── api/
        └── context/
```
