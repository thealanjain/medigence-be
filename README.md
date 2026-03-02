# Medigence Backend (Node.js/Express)

Core API and Socket.io server for Medigence.

## 🚀 Quick Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Ensure `DATABASE_URL` (Supabase/PostgreSQL) and `JWT_SECRET` are set.

3. **Database Schema**
   If setting up from scratch, run the schema against your PostgreSQL instance:
   ```bash
   psql $DATABASE_URL < db/schema.sql
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   *Runs on [http://localhost:4000](http://localhost:4000)*

## 🛠 Tech Stack
- **Node.js**: Runtime environment
- **Express**: Web framework
- **Socket.io**: Real-time communication (Presence & Messaging)
- **PostgreSQL**: Primary database
- **Zod**: Validation
