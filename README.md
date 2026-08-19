<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:6C5CE7,100:00D2FF&height=220&section=header&text=Smart%20Queue%20Management%20System&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Real-time%20%C2%B7%20Multi-tenant%20%C2%B7%20Role-based%20Queue%20%26%20Appointment%20Platform&descSize=18&descAlignY=55" alt="header"/>

<img src="https://readme-typing-svg.demolab.com/?lines=%F0%9F%8E%9F%EF%B8%8F+Queues%2C+Counters+%26+Appointments+%E2%80%94+Live;%F0%9F%9B%A1%EF%B8%8F+Admin+%E2%86%92+Org+%E2%86%92+Staff+%E2%86%92+User;%E2%9A%A1+Powered+by+Socket.IO+%2B+MongoDB+%2B+React&font=Fira%20Code&center=true&width=650&height=45&color=6C5CE7&vCenter=true&size=22&pause=1800" alt="typing-svg" />

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![Status](https://img.shields.io/badge/Backend-Stable-brightgreen?style=flat-square&logo=checkmarx)
![Roles](https://img.shields.io/badge/Roles-Admin%20%7C%20Org%20%7C%20Staff%20%7C%20User-blueviolet?style=flat-square)
![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-orange?style=flat-square&logo=socket.io)
![Multi--tenant](https://img.shields.io/badge/Architecture-Multi--tenant-informational?style=flat-square)
![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

<img src="https://skillicons.dev/icons?i=nodejs,express,react,mongodb,tailwind,socketio,javascript,vite&theme=dark" alt="skills"/>

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 📑 Table of Contents

<div align="center">

| | | | |
|:---:|:---:|:---:|:---:|
| 1️⃣ [Account & Access Model](#1️⃣-account--access-model) | 2️⃣ [Features](#2️⃣-features) | 3️⃣ [Architecture](#3️⃣-system-architecture) | 4️⃣ [Tech Stack](#4️⃣-technology-stack) |
| 5️⃣ [Queue Flow](#5️⃣-queue-flow) | 6️⃣ [Appointment Flow](#6️⃣-appointment-flow) | 7️⃣ [Project Structure](#7️⃣-project-structure) | 8️⃣ [Env Variables](#8️⃣-environment-variables) |
| 9️⃣ [API Overview](#9️⃣-api-overview) | 🔟 [Security](#🔟-authentication--security) | 🔌 [WebSocket Events](#-websocket-event-mappings) | 🚀 [Setup](#-local-development-setup) |
| 🧪 [Tests](#-verification-tests) | 📦 [Deployment](#-deployment-instructions) | 📊 [Dev Status](#-development-status) | ⭐ [Support](#-support-this-project) |

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 1️⃣ Account & Access Model

> 🔐 **Nobody self-registers into a privileged role.** Every account above `USER` is issued top-down by the tier above it.

```
        🛡️  ADMIN            (exactly 1 — bootstrapped at setup)
          │
          │  creates & issues credentials for
          ▼
     🏢  ORGANIZATION        (many)
          │
          │  creates & issues credentials for
          ▼
        🧑‍💼  STAFF            (many, scoped to one organization)


          🙋  USER            (many — the ONLY self-service signup)
```

<div align="center">

| Role | 🔑 How the account is created | 👤 Managed by |
|:---:|---|---|
| 🛡️ **Admin** | Bootstrapped once at system setup — there is only ever **one**. | Self-managed |
| 🏢 **Organization** | Created **by the Admin**, including real-time captured location; platform issues login credentials. | Fully self-service once created — Admin does *not* touch daily ops |
| 🧑‍💼 **Staff** | Created **by their Organization**, which issues credentials and assigns counters. | The owning Organization |
| 🙋 **User** | 🌟 **The only public self-registration** — anyone can sign up. | The user |

</div>

🎛️ **Login** is one page with a **role selector**: `Admin ⏷ / Organization ⏷ / Staff ⏷ / User ⏷` — the right dashboard and permissions load automatically.

✅ **Uniqueness enforced at signup:**
- 📧 Email — unique
- 📱 Mobile number — unique

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 2️⃣ Features

<details open>
<summary>🛡️ <strong>Admin Portal</strong></summary>
<br>

- 🏗️ **Organization Onboarding** — registers tenants with real-time location capture and issues their credentials
- 👀 **Read-Only Oversight** — views org details & tenant analytics, but never touches an org's services/queues/counters/staff
- 🌍 **Root Console** — system-wide multi-tenant overview
</details>

<details open>
<summary>🏢 <strong>Organization Portal</strong></summary>
<br>

- 🧑‍💼 **Staff Provisioning** — creates staff accounts & credentials
- 🛠️ **Service Configuration** — create / **edit** / audit / remove services
- 📋 **Queue Configuration** — map services → queues, set FIFO/PRIORITY policy, **edit** anytime
- 🖥️ **Counter Management** — create, **edit**, toggle online/offline, assign staff
- ✏️ **Profile Editing** — update organization details post-registration
- 📅 **Slot Generator** — build appointment calendars with capacity caps
- ✅ **Booking Approvals** — confirm customer appointment slots
- 📊 **Dashboard Analytics** — traffic, service time & status breakdowns
</details>

<details open>
<summary>🧑‍💼 <strong>Staff Portal</strong></summary>
<br>

- 🎚️ **Desk Panel Controls** — toggle assigned counters online/offline
- 🎫 **Token Operations**
  - 📢 **Call Next**
  - ▶️ **Start Service** → `IN_SERVICE`
  - ✅ **Complete Service** → `COMPLETED`, desk freed
  - ⏭️ **Skip Token** → `SKIPPED`, desk freed
- 👥 **Waitline Auditing** — live view of who's checked in & waiting
</details>

<details open>
<summary>🙋 <strong>User Portal</strong></summary>
<br>

- 📝 **Self-Registration / Login** — the only open signup flow
- 🔍 **Browse & Join Queues** — live org/service/queue listings
- 🎟️ **Live Token Status** — `WAITING → CALLED → IN_SERVICE → COMPLETED`, live position & ETA
- ⚡ **Real-Time Sync** — instant updates, zero reloads
- 📅 **Appointment Booking** — pick & book open slots
- ✅ **Appointment Check-In** — auto-converts to an active token
- ❌ **Token Cancellation** — leave anytime before being called
</details>

<details open>
<summary>🌐 <strong>Cross-Cutting</strong></summary>
<br>

- 📄 **Pagination** everywhere — organizations, services, queues, counters, staff, appointments, tokens
- ✏️ **Full edit support** — org details, services, queues, counters (nothing is create-only)
- 🔒 **Tenant isolation** — an org (and its staff) only ever sees its own data
</details>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 3️⃣ System Architecture

**REST API Flow**
```
[⚛️ React Client] ──Axios (JWT)──> [🌐 Express Router] ──> [🎮 Controllers] ──> [🍃 MongoDB]
```

**WebSocket Flow**
```
[⚛️ React Client] <──────────── 🔌 Socket.IO (WebSockets) ────────────> [🟢 Express + Socket.IO Server]
```

⚡ When staff change a ticket's state, the backend broadcasts over queue-specific rooms — listening clients instantly recalculate wait lines, positions & ETAs.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 4️⃣ Technology Stack

<div align="center">

| Layer | 🧩 Technology | Purpose |
|---|---|---|
| 🎨 Frontend | React (v19) | Reactive UI architecture |
| 💅 Styling | Tailwind CSS (v4) | Utility-first responsive styling |
| 🧭 Routing | React Router DOM (v7) | Role-based route guards |
| 📡 Data Fetching | Axios | REST client + interceptors |
| 📈 Charts | Recharts | Analytics visualizations |
| 🔌 Real-time | Socket.IO Client | WebSocket bindings |
| 🎯 Icons | React Icons | Vector icon library |
| 🟢 Backend | Node.js / Express.js | Server & middleware |
| 🍃 Database | MongoDB / Mongoose | Document store & ODM |
| 🔑 Auth | JSON Web Tokens | Stateless, role-aware sessions |
| 🔒 Password Security | bcryptjs | Hashing |
| 📶 Real-time Server | Socket.IO | Room-based broadcasting |

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 5️⃣ Queue Flow

**🎫 Token Lifecycle**
```
[Join / Check-In] ──▶ 🟡 WAITING ──▶ 📢 CALLED ──▶ 🔵 IN_SERVICE ──▶ 🟢 COMPLETED
```

| Status | Meaning |
|:---:|---|
| 🟡 `WAITING` | In line, eligible to be called |
| 📢 `CALLED` | Alerted to head to the counter |
| 🔵 `IN_SERVICE` | Being served |
| 🟢 `COMPLETED` | Done, desk freed |
| ⚪ `SKIPPED` | No-show, desk freed |
| 🔴 `CANCELLED` | Cancelled before being called |

**🖥️ Counter Lifecycle**
```
🟢 AVAILABLE ──▶ 🔵 BUSY ──▶ 🟢 AVAILABLE
```

| Status | Meaning |
|:---:|---|
| 🟢 `AVAILABLE` | Online & ready — "Call Next" enabled |
| 🔵 `BUSY` | Serving — Start / Complete / Skip enabled |
| ⚫ `OFFLINE` | Closed, no operations |

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 6️⃣ Appointment Flow

```
[📅 Book Slot] ──▶ 🟡 BOOKED ──▶ 🟢 CONFIRMED ──▶ 🔵 CHECKED_IN (🎫 Token Created)
```

1. **📅 Booking** — customer selects a slot → `BOOKED`
2. **✅ Confirmation** — org approves → `CONFIRMED`
3. **🚪 Check-In** — on the day → `CHECKED_IN`, auto-creates a `WAITING` token

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 7️⃣ Project Structure

```
smart-queue/
├── backend/
│   ├── src/
│   │   ├── config/         # 🔧 Database connection configuration
│   │   ├── controllers/    # 🎮 API endpoint controller handlers
│   │   ├── middleware/     # 🔒 JWT auth, role checks, tenant boundary checks
│   │   ├── models/         # 🗂️ Mongoose schemas
│   │   ├── routes/         # 🛣️ Express route definitions
│   │   ├── services/       # 🧮 Wait-time & queue-position calculations
│   │   ├── socket/         # 🔌 Socket.IO event registrations & helpers
│   │   └── server.js       # 🚀 App entrypoint
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/            # 📡 Centralized API service wrappers
│   │   ├── components/     # 🧱 Reusable UI widgets
│   │   ├── context/        # 🌐 Auth & Socket state providers
│   │   ├── hooks/          # 🪝 Custom hooks (e.g. useOrg)
│   │   ├── layouts/        # 🖼️ Layout shells (Sidebar, Navbar)
│   │   ├── pages/          # 📄 Role-divided dashboards & config screens
│   │   ├── routes/         # 🛡️ Protected, role-based route guards
│   │   ├── App.jsx
│   │   └── index.css       # 💅 Tailwind v4 import
│   ├── .env
│   └── package.json
│
└── README.md
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 8️⃣ Environment Variables

**Backend** (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | 🔌 Local Express port | `5000` |
| `MONGO_URI` | 🍃 MongoDB connection URI | `mongodb://127.0.0.1:27017/smart-queue` |
| `JWT_SECRET` | 🔑 JWT signing secret | `your_secret_key` |

**Frontend** (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | 🌐 REST API root | `http://localhost:5000` |

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 9️⃣ API Overview

| Route group | 🎯 Purpose |
|---|---|
| `/api/auth` | 🙋 User registration, 🔑 role-aware login, `/me` |
| `/api/organizations` | 🛡️ Admin-issued org creation, 📄 paginated registry, profile detail/update |
| `/api/organization-staff` | 🏢 Org-issued staff creation & membership mapping |
| `/api/services` | 🛠️ Create / edit / list (📄 paginated) / delete services |
| `/api/queues` | 📋 Create/edit queues, `/policy`, `/join`, `/next`, `/analytics` |
| `/api/counters` | 🖥️ Create/edit counters, `/staff`, `/status` |
| `/api/tokens` | 🎫 `/status`, `/start`, `/complete`, `/skip`, `/cancel` |
| `/api/appointment-slots` | 📅 Create & list available slots |
| `/api/appointments` | ✅ Bookings, `/confirm`, `/check-in` |

📄 **Pagination** is live on `organizations`, `services`, `queues`, `counters`, `staff`, `appointments`, and `tokens`.

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 🔟 Authentication & Security

1. 🔑 **JWT** on every request — `Authorization: Bearer <JWT>`
2. 🎛️ **Role-aware login** — explicit role selector, JWT scoped accordingly
3. 🔒 **bcryptjs hashing** — passwords never stored in plaintext
4. 🆔 **Unique fields** — email & mobile enforced unique at the DB level
5. 🛡️ **Role checks** — middleware validates `ADMIN` / `ORGANIZATION` / `STAFF` / `USER` before any controller runs
6. 🏢 **Tenant boundaries** — `organizationAccessMiddleware.js` scopes orgs/staff to their own resources only
7. ⛔ **Provisioning chain enforced** — self-registration as Org or Staff is rejected server-side

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 🔌 WebSocket Event Mappings

| Event | Direction | Purpose |
|---|:---:|---|
| `joinQueue` | Client → Server | Subscribe to `queue:<queueId>` |
| `joinUser` | Client → Server | Subscribe to `user:<userId>` |
| `QUEUE_UPDATED` | Server → Room | Queue/check-in/completion changed |
| `TOKEN_CALLED` | Server → Queue Room | A ticket was called |
| `YOUR_TOKEN_CALLED` | Server → User Room | Direct alert to the customer |

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 🚀 Local Development Setup

**Prerequisite:** MongoDB running at `mongodb://127.0.0.1:27017/smart-queue`

```bash
# 1️⃣ Backend
cd backend
npm install
npm run dev          # → http://localhost:5000

# 2️⃣ Frontend
cd ../frontend
npm install
npm run dev           # → http://localhost:5173

# 3️⃣ Bootstrap the one-and-only Admin
cd ../backend
node elevate_admin.js
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 🧪 Verification Tests

Covered in `backend/testSocket.js`, `backend/elevate_admin.js`, and `test_smart_queue.js`:

- ✅ Hashing & role-aware JWT logins
- ✅ Full provisioning chain (Admin → Org → Staff → User)
- ✅ Role protections (e.g. staff can't touch other counters)
- ✅ Tenant isolation across orgs
- ✅ Concurrent desk operations
- ✅ Appointment → check-in → token transitions

```bash
cd backend
node testSocket.js
```

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## 📦 Deployment Instructions

**Frontend**
- `npm run build` → output in `dist/`
- Point `VITE_API_URL` at your production backend

**Backend**
- `npm start`
- Set `PORT`, `MONGO_URI`, `JWT_SECRET` in host env
- Confirm CORS allows the production frontend origin

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:00D2FF,100:6C5CE7&height=4"/>

## 📊 Development Status

> All backend contracts below are ✅ implemented & tested. Frontend alignment is next.

<div align="center">

![Phase 1](https://img.shields.io/badge/Phase%201%20Auth-Complete-brightgreen?style=for-the-badge)
![Phase 2](https://img.shields.io/badge/Phase%202%20Orgs-Complete-brightgreen?style=for-the-badge)
![Phase 3](https://img.shields.io/badge/Phase%203%20Staff-Complete-brightgreen?style=for-the-badge)
![Phase 4](https://img.shields.io/badge/Phase%204%20Resources-Complete-brightgreen?style=for-the-badge)
<br/>
![Phase 5](https://img.shields.io/badge/Phase%205%20Queue%20Ops-Complete-brightgreen?style=for-the-badge)
![Phase 6](https://img.shields.io/badge/Phase%206%20Realtime-Complete-brightgreen?style=for-the-badge)
![Phase 7](https://img.shields.io/badge/Phase%207%20Appointments-Complete-brightgreen?style=for-the-badge)
<br/>
![Phase 8](https://img.shields.io/badge/Phase%208%20Pagination-Complete-brightgreen?style=for-the-badge)
![Phase 9](https://img.shields.io/badge/Phase%209%20Security-Complete-brightgreen?style=for-the-badge)

</div>

<details>
<summary>🔐 <strong>Phase 1 — Authentication Foundation</strong> ✅</summary><br>

User model · Password hashing · Unique email · Unique mobile · Role validation · Admin bootstrap · Public user registration · Role-aware login · JWT · `/auth/me`
</details>

<details>
<summary>🏢 <strong>Phase 2 — Organization Lifecycle</strong> ✅</summary><br>

Admin → Create Organization · Org account creation · Org profile · Org update · Org authorization · Org isolation · Location validation
</details>

<details>
<summary>🧑‍💼 <strong>Phase 3 — Staff Lifecycle</strong> ✅</summary><br>

Org → Create Staff · Staff account creation · OrganizationStaff membership · Staff credentials · Staff update/deactivation · Staff org isolation
</details>

<details>
<summary>🛠️ <strong>Phase 4 — Organization Resources</strong> ✅</summary><br>

Services (create/edit/paginate) · Queues (create/edit/paginate) · Counters (create/edit/assign/paginate)
</details>

<details>
<summary>🎫 <strong>Phase 5 — Queue Operations</strong> ✅</summary><br>

Join queue · Token generation · Token ownership · Token status · Call next · Start · Complete · Skip · Cancel
</details>

<details>
<summary>⚡ <strong>Phase 6 — Real-Time</strong> ✅</summary><br>

Socket auth · Org rooms · Queue rooms · Token events · User updates · Staff updates
</details>

<details>
<summary>📅 <strong>Phase 7 — Appointments</strong> ✅</summary><br>

Slots · Booking · Confirmation · Check-in · Completion · Cancellation
</details>

<details>
<summary>📄 <strong>Phase 8 — Pagination + Analytics</strong> ✅</summary><br>

Pagination across orgs, staff, services, queues, counters, appointments, tokens · Analytics validation
</details>

<details>
<summary>🛡️ <strong>Phase 9 — Security Testing</strong> ✅</summary><br>

Admin isolation · Org A/B isolation · Staff isolation · User token isolation · Invalid role login · Invalid JWT · Expired JWT · Unauthorized resource access
</details>

<div align="center">

### 🎯 Next Step: Frontend alignment against the now-stable backend contract set

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=rect&color=0:6C5CE7,100:00D2FF&height=4"/>

## ⭐ Support This Project

<div align="center">

If this project helped you, consider giving it a star — it genuinely helps! ✨

[![GitHub Repo stars](https://img.shields.io/github/stars/Mithuna-spec/smart-queue-nodejs-project?style=social)](https://github.com/Mithuna-spec/smart-queue-nodejs-project/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Mithuna-spec/smart-queue-nodejs-project?style=social)](https://github.com/Mithuna-spec/smart-queue-nodejs-project/network/members)

</div>

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:00D2FF,100:6C5CE7&height=150&section=footer&animation=fadeIn"/>
