# Test Credentials & Environment Setup

This document provides coordinates for accessing the live development environment and test accounts.

## 👤 Test Accounts
*All accounts share the same password:* `admin@123`

| Role | Email |
| :--- | :--- |
| **Patient** | `demo.patient@medigence.com` |
| **Doctor** | `demo.doctor@medigence.com` |

---

## ⚡ Supabase Project Access
- **Project URL:** `https://hqxwtskpdwxysmxsywdw.supabase.co`
- **Publishable API Key:** `sb_publishable_kr7cZ6dgDmcsrCahdf25ng_r-2W7SCm`
- **DB Password:** `$x7H.QMj$WNWzfT`

---

## 🔗 Connection Strings

### Backend (.env)
```bash
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.hqxwtskpdwxysmxsywdw:$x7H.QMj$WNWzfT@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database (for migrations)
DIRECT_URL="postgresql://postgres.hqxwtskpdwxysmxsywdw:$x7H.QMj$WNWzfT@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hqxwtskpdwxysmxsywdw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_kr7cZ6dgDmcsrCahdf25ng_r-2W7SCm
```

---

## 🧪 Testing Instructions
1. **Resetting Data:** You can run `psql $DIRECT_URL < db/schema.sql` to wipe and re-seed the test data.
2. **Onboarding:** Login as the patient, complete all 3 steps, and select the doctor to start a chat.
3. **Chatting:** Open two separate browser tabs/windows (one for patient, one for doctor) to test real-time presence and messaging.
