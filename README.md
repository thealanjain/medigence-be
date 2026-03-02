# 🏥 Medigence Backend — Patient Onboarding & Doctor Chat System

A production-ready Node.js/Express backend with PostgreSQL and Socket.io for a healthcare application.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL (Supabase) |
| Real-Time | Socket.io |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| ORM | Raw SQL (pg driver) |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd be
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase database password:

```env
DATABASE_URL=postgresql://postgres.hqxwtskpdwxysmxsywdw:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your_secret_key_here
```

### 3. Run the database schema

```bash
psql $DATABASE_URL < db/schema.sql
```

Or use Supabase SQL Editor — paste the contents of `db/schema.sql`.

### 4. Start the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:4000`

---

## 📁 Project Structure

```
be/
├── db/
│   └── schema.sql              # Full DB schema + seed data
├── src/
│   ├── config/
│   │   └── config.js           # Env-based configuration
│   ├── database/
│   │   └── db.js               # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   ├── roleMiddleware.js   # Role-based access control
│   │   ├── validate.js         # Zod request validation
│   │   └── errorHandler.js     # Centralized error handling
│   ├── modules/
│   │   ├── auth/               # Signup, Login, GetMe
│   │   ├── doctors/            # Doctor listing
│   │   ├── onboarding/         # 3-step onboarding + draft
│   │   ├── chats/              # Chat rooms
│   │   └── messages/           # Chat messages
│   ├── sockets/
│   │   └── socketHandler.js    # Socket.io real-time logic
│   ├── utils/
│   │   ├── jwt.js              # JWT helpers
│   │   └── response.js         # API response format
│   ├── app.js                  # Express app
│   └── server.js               # HTTP + Socket.io server
├── .env.example
└── package.json
```

---

## 🔐 Authentication

### Signup
```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "role": "PATIENT"   // or "DOCTOR"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

Both return:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "PATIENT" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

Use the token as: `Authorization: Bearer <token>`

---

## 🌱 Seed Credentials

| Role | Email | Password |
|---|---|---|
| Doctor | dr.sharma@medigence.com | Doctor@123 |
| Doctor | dr.patel@medigence.com | Doctor@123 |
| Doctor | dr.kapoor@medigence.com | Doctor@123 |
| Patient | patient.demo@medigence.com | Patient@123 |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Get current user |

### Doctors
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctors` | ✅ | List all doctors |
| GET | `/api/doctors/:id` | ✅ | Get doctor by ID |

### Onboarding (PATIENT only)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/onboarding/step-1` | ✅ | Save personal info |
| POST | `/api/onboarding/step-2` | ✅ | Save medical info |
| POST | `/api/onboarding/step-3` | ✅ | Save insurance + doctor selection |
| GET | `/api/onboarding/draft` | ✅ | Get saved draft / resume progress |
| POST | `/api/onboarding/submit` | ✅ | Final submit → assigns doctor, creates chat |

### Chats
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/chats/my` | ✅ | Get my chats with unread counts |
| GET | `/api/chats/:chatId` | ✅ | Get single chat |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/:chatId` | ✅ | Get messages (paginated, ?page=1) |
| POST | `/api/messages` | ✅ | Send a message |
| PATCH | `/api/messages/:chatId/read` | ✅ | Mark messages as read |

---

## 💬 Socket.io Events

### Connection
```js
const socket = io('http://localhost:5000', {
  auth: { token: 'Bearer eyJ...' }
});
```

### Events (Client → Server)
| Event | Payload | Description |
|---|---|---|
| `authenticate` | — | Re-verify JWT |
| `join_chat` | `{ chatId }` | Join a chat room |
| `send_message` | `{ chatId, message_text }` | Send a message |
| `typing_start` | `{ chatId }` | Broadcast typing started |
| `typing_stop` | `{ chatId }` | Broadcast typing stopped |
| `mark_read` | `{ chatId }` | Mark messages as read |

### Events (Server → Client)
| Event | Description |
|---|---|
| `receive_message` | New message in room |
| `typing_start` | Another user started typing |
| `typing_stop` | Another user stopped typing |
| `messages_read` | Messages marked as read |
| `user_online` | User came online |
| `user_offline` | User went offline |

---

## 🧪 3-Step Onboarding Flow

**Step 1 — Personal Info**
```json
POST /api/onboarding/step-1
{
  "full_name": "John Doe",
  "age": 28,
  "gender": "Male",
  "phone": "+91-9876543210",
  "city": "Mumbai",
  "country": "India"
}
```

**Step 2 — Medical Info**
```json
POST /api/onboarding/step-2
{
  "blood_type": "O+",
  "allergies": ["Penicillin"],
  "chronic_conditions": ["Hypertension"],
  "current_medications": "Amlodipine 5mg"
}
```

**Step 3 — Insurance + Doctor Selection**
```json
POST /api/onboarding/step-3
{
  "preferred_doctor_id": "c3000000-0000-0000-0000-000000000001",
  "preferred_time_slot": "Morning",
  "referral_source": "Online",
  "insurance_provider": "Star Health"
}
```

**Final Submit**
```
POST /api/onboarding/submit
```
Returns: assignment + chat room created automatically.

---

## 🔒 Response Format

All endpoints return:
```json
{
  "success": true | false,
  "data": {},
  "message": "Human-readable message"
}
```

Validation errors also include:
```json
{
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

---

## 🏥 Health Check

```
GET /health
```
```json
{
  "success": true,
  "message": "Medigence API is running",
  "data": { "timestamp": "...", "env": "development" }
}
```
