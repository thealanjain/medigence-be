# Architecture & Design Decisions

This document outlines the core technical decisions made for the Medigence platform.

## 1. Authentication
*   **JWT-Based**: stateless authentication using JSON Web Tokens.
*   **Role-Based Access Control (RBAC)**: Defined `PATIENT` and `DOCTOR` roles at the database and middleware levels.
*   **Middleware**: Custom `authMiddleware` and `roleMiddleware` secure API routes and Socket.io connections.

## 2. Onboarding & Draft Saving
*   **Step-by-Step Persistence**: Each onboarding step is saved to its respective table (`patient_profiles`, etc.) immediately.
*   **JSONB Drafts**: We utilize an `onboarding_drafts` table with `JSONB` to store incomplete work, allowing users to resume from exactly where they left off.
*   **Submission Logic**: The final "Submit" step verifies all required steps are in the DB before assigning a doctor and creating a chat.

## 3. Real-time Architecture (Socket.io)
*   **Presence**: A global `onlineUsers` map tracks active `userIds`.
*   **Acknowledgement Pattern**: Messages are sent with a callback. The sender receives the confirmed message via this callback, whileothers receive it via a broadcast to avoid double-rendering/duplicate keys.
*   **Optimization**: Used `socket.to(room).emit()` to exclude the sender from broadcasts, reducing network waste.

## 4. Database Schema
*   **PostgreSQL**: Chosen for relational integrity between users, profiles, and chats.
*   **UUIDs**: All primary keys use UUIDs for security and better scalability.
*   **Normalized Tables**: Separate tables for `medical_information` and `insurance_information` keep data structured and queries fast.

## 5. Trade-offs & Assumptions
*   **Simple Polling fallback**: Socket.io is configured with `polling` fallback for environments where WebSockets might be blocked.
*   **Optimistic UI**: Frontend adds messages instantly to the UI before server confirmation to make the app feel "lag-free".
*   **Single Assignment**: For this version, we assume a patient connects with one primary doctor at a time via the onboarding flow.
