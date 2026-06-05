# StrataOS

Premium Australian strata management SaaS MVP.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_TEST_PASSWORD=StrataOS123!` for the seeded test accounts
4. Apply migrations:

```bash
supabase db push
```

5. Seed core MVP data:

```bash
supabase db reset
```

The seed script creates:
- 1 company
- 4 buildings
- seeded users and roles
- building memberships
- notices
- resident report issue
- maintenance request
- work order
- contractor update
- document
- message
- in-app notifications
- committee motion
- audit log

## Auth and test users

The app can be tested in two modes:

- Without Supabase env vars: local seeded fallback mode.
- With Supabase env vars: Supabase-backed reads/writes. The seed script creates matching Supabase Auth users, and the test login calls Supabase Auth when `VITE_SUPABASE_TEST_PASSWORD=StrataOS123!`.

Seeded test accounts:

- `super@strataos.test` - Platform Super Admin
- `owner@northshorestrata.com.au` - Company Owner / Portfolio Admin
- `manager@northshorestrata.com.au` - Strata Manager
- `resident@example.com` - Resident
- `committee@example.com` - Committee Member
- `contractor@liftcare.com.au` - Contractor

Password for all seeded accounts: `StrataOS123!`

## Core MVP flows

Use Login, select a seeded account, then test:

1. Resident reports issue: Resident -> Report Issue -> Submit issue.
2. Manager sees/triages issue: Switch Role -> Strata Manager -> Maintenance.
3. Manager assigns contractor: Maintenance -> Assign contractor.
4. Contractor sees/updates job: Switch Role -> Contractor -> Add update or Mark in progress.
5. Manager creates notice: Switch Role -> Strata Manager -> Communications -> Create notice.
6. Resident sees notice: Switch Role -> Resident -> Communications.
7. Resident messages manager: Resident -> Messages -> Send message.
8. Manager uploads document: Strata Manager -> Documents -> Upload document.
9. Resident views document: Resident -> Documents.
10. Committee member votes: Committee Member -> Committee -> Vote yes.

## RLS and tenant isolation

Core tables include `company_id` and, where relevant, `building_id`. RLS policies use:

- `user_roles` for company-level roles
- `building_memberships` for building-level access
- contractor assignment checks for work order updates

Expected visibility:

- Resident: own building and lot context
- Committee: committee/building records for their building
- Contractor: assigned work orders and job updates
- Strata Manager: assigned buildings
- Portfolio Admin: all buildings under their company
- Platform Super Admin: all tenants

## Deferred

Not implemented for MVP:

- SMS
- payments
- accounting integrations
- AI assistant backend
- push notifications
- contractor marketplace
