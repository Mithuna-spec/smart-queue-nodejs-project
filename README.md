# Smart Queue Management System

A professional, full-stack queue management solution built to streamline customer traffic, automate slot bookings, optimize desk allocations, and monitor wait lines in real-time. Designed on a multi-tenant model, it supports concurrent customer interactions, staff panel controls, organization configuration consoles, and system-wide administrative oversight.

```
User / Staff / Organization / Admin
                ↓
          React Frontend
                ↓
       REST API + Socket.IO
                ↓
    Node.js / Express Backend
                ↓
             MongoDB
```

---

## 1. Features

### User Profile Roles
* **Register / Login**: Secure profile registration and session token management.
* **Browse & Join Queues**: Real-time listing of active organizations and services. Customers can register into queue lines directly.
* **Live Token Status**: Visual ticket renders detailing current status (`WAITING`, `CALLED`, `IN_SERVICE`, `COMPLETED`), queue position, and estimated wait times.
* **Real-time Synchronization**: Instant updates to wait lines and position shifts without page reloads (via Socket.IO).
* **Appointment Booking**: Select available slots under services and submit bookings.
* **Appointment Check-in**: Checked-in confirmed slots automatically transition into active queue tokens.
* **Token Cancellation**: Exit queues at any time before being called.

### Organization Owners
* **Service Configurations**: Create, audit, and remove services with customizable average handling times and appointment toggles.
* **Queue Properties**: Map services to queue entities and set policies (e.g., FIFO or PRIORITY).
* **Staff Registries**: Register pre-existing users as organization staff members.
* **Counter Assignments**: Create physical desk counters, toggle their states, and map active staff members to them.
* **Slot Generator**: Generate appointment calendars for services with specific start/end times and capacity caps.
* **Booking Approvals**: Accept and confirm customer appointment slots to prepare them for check-in.
* **Dashboard Analytics**: Consolidated oversight of traffic volume, service times, and status distributions.

### Staff Operators
* **Desk Panel Controls**: Manage counter online/offline states.
* **Token Operations**:
  * **Call Next**: Call the next waiting user based on queue sorting rules.
  * **Start Service**: Mark user ticket status as `IN_SERVICE`.
  * **Complete Service**: Close the active session, resolving the token as `COMPLETED` and releasing the desk back to `AVAILABLE`.
  * **Skip Token**: Skip un-represented users, updating ticket to `SKIPPED` and freeing the desk.
* **Waitline Auditing**: Real-time lists of customers checked-in and waiting for the active counter's service.

### System Administrators
* **Root Console**: Multi-tenant overview.
* **Organization Registrations**: Register new tenant organizations and assign MongoDB Owner User IDs.
* **Global Configuration Auditing**: System-wide service, counter, staff, and queue directory structures.
* **Tenant Analytics**: Select any registered organization to audit queue performance, token statuses, and handling pace.

---

## 2. System Architecture

### REST API Flow
```
[React Client] ── Axios (JWT Header) ──> [Express Router] ──> [Controllers] ──> [MongoDB (Mongoose)]
```
HTTP API endpoints process authentication, organization setup, counter configurations, and slot booking states.

### WebSocket Flow
```
[React Client] <────────────── Socket.IO (WebSockets) ──────────────> [Express Server (Socket.io)]
```
Socket.IO is integrated to deliver low-latency real-time synchronization. When a staff operator changes ticket states (e.g. calls the next customer), the backend broadcasts status signals over queue-specific rooms. Waiting customer clients listen to these channels and immediately recalculate wait lines, queue positions, and estimated wait times.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (v19) | Reactive user interface architecture |
| **Styling** | Tailwind CSS (v4) | Responsive, modern utility-first CSS |
| **Routing** | React Router DOM (v7) | Declarative client-side route paths and guards |
| **Data Fetching** | Axios | REST API service wrapper with interceptors |
| **Charts** | Recharts | Dynamic analytics data plots |
| **Real-time** | Socket.IO Client | Real-time WebSocket connection bindings |
| **Icons** | React Icons | Vector asset library |
| **Backend** | Node.js / Express.js | Core server framework and middleware stack |
| **Database** | MongoDB / Mongoose | Scalable Document Database and Object Modeling |
| **Authentication** | JSON Web Tokens (JWT) | Stateless role-based session tokens |
| **Password Security** | Bcryptjs | Hashing password credentials |
| **Real-time Server** | Socket.IO | Connection routing and room-based broadcasts |

---

## 4. User Roles

* **`USER`**: Customers seeking service. Standard public registration defaults to this role.
* **`STAFF`**: Desk operators serving wait lines. Associated with an organization via the `OrganizationStaff` schema, defining their status and roles.
* **`ORGANIZATION`**: Business owners who configure services, counters, queues, and approve slots.
* **`ADMIN`**: Root system administrators with absolute system-wide oversight and tenant organization creation rights.

---

## 5. Queue Flow

### Token Lifecycle
```
[Join Queue / Check-In] ──> WAITING ──> [Staff Calls] ──> CALLED ──> [Staff Starts] ──> IN_SERVICE ──> [Staff Completes] ──> COMPLETED
```
* **`WAITING`**: Token is in the queue line. Eligible to be called.
* **`CALLED`**: Staff operator calls the token. The customer is alerted to go to the assigned counter.
* **`IN_SERVICE`**: Customer has arrived at the counter and service starts.
* **`COMPLETED`**: Service completes. The desk is freed.
* **`SKIPPED`**: Customer does not show up. The token is skipped and desk is freed.
* **`CANCELLED`**: Customer cancels their token manually from their dashboard before being called.

### Counter Lifecycle
```
AVAILABLE ──> [Staff Calls User] ──> BUSY ──> [Staff Completes/Skips] ──> AVAILABLE
```
* **`AVAILABLE`**: The counter is online and ready. Staff can click "Call Next".
* **`BUSY`**: The counter is actively serving a client. Operators can click "Start Service", "Complete", or "Skip".
* **`OFFLINE`**: The counter is closed. No operations can occur.

---

## 6. Appointment Flow

```
[User Book Slot] ──> BOOKED ──> [Org Approves] ──> CONFIRMED ──> [User Check-In] ──> CHECKED_IN (Queue Token Created)
```
1. **Booking**: Customer selects an active slot. Initial state is `BOOKED`.
2. **Confirmation**: Organization approves the slot, changing status to `CONFIRMED`.
3. **Check-In**: Customer checks in on the day of the appointment. The slot transitions to `CHECKED_IN`, automatically creating a `WAITING` token in the service queue.

---

## 7. Project Structure

```
smart-queue/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection configuration
│   │   ├── controllers/    # API endpoint controller handlers
│   │   ├── middleware/     # JWT Auth, Role check, and Tenant check
│   │   ├── models/         # Mongoose Schemas
│   │   ├── routes/         # Express API Route paths
│   │   ├── services/       # Wait time & queue position calculations
│   │   ├── socket/         # Socket.IO event registrations & helpers
│   │   └── server.js       # App listener mount and connection initiation
│   ├── .env                # Backend environment configuration
│   └── package.json        # Backend NPM script config
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Centralized API service wrappers
│   │   ├── components/     # Reusable UI widgets
│   │   ├── context/        # Auth & Socket state providers
│   │   ├── hooks/          # Custom hooks (e.g. useOrg)
│   │   ├── layouts/        # Layout shells (Sidebar, Navbar)
│   │   ├── pages/          # Dashboards and configurations (role-divided)
│   │   ├── routes/         # Protected and role-based route guards
│   │   ├── App.jsx         # App root wrapper
│   │   └── index.css       # Tailwind v4 import
│   ├── .env                # Frontend environment configuration
│   └── package.json        # Frontend NPM script config
│
└── README.md
```

---

## 8. Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Local express listener port | `5000` |
| `MONGO_URI` | MongoDB connection URI string | `mongodb://127.0.0.1:27017/smart-queue` |
| `JWT_SECRET` | Secret token string for signing JWTs | `your_secret_key` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Root URL pointing to the REST API | `http://localhost:5000` |

---

## 9. API Overview

### Route Groups
* **`/api/auth`**: Users registration (`/register`), login (`/login`), and profile details (`/me`).
* **`/api/organizations`**: Tenant registry, creation, and detail queries.
* **`/api/services`**: Create, get, and delete service definitions.
* **`/api/queues`**: Create queues, update policies (`/:queueId/policy`), join queues (`/:queueId/join`), call next (`/:queueId/next`), and fetch analytics (`/:queueId/analytics`).
* **`/api/tokens`**: Status lookup (`/:id/status`), start service (`/:id/start`), complete (`/:id/complete`), skip (`/:id/skip`), and cancel (`/:id/cancel`).
* **`/api/appointments`**: Bookings, confirmation approvals (`/:id/confirm`), and check-in (`/:id/check-in`).
* **`/api/appointment-slots`**: Create slots and get available slots.
* **`/api/counters`**: Create counters, assign staff (`/:counterId/staff`), and update status (`/:counterId/status`).
* **`/api/organization-staff`**: Map pre-registered staff users to organizations.

---

## 10. Authentication & Security

1. **JSON Web Tokens**: Authenticated requests must append the JWT as a Bearer token:
   `Authorization: Bearer <JWT>`
2. **Password Cryptography**: Passwords are saved as bcryptjs hashes.
3. **Role Checks**: Express middleware checks user permissions (`ADMIN`, `ORGANIZATION`, `STAFF`, `USER`) before routing.
4. **Tenant Access Boundaries**: `organizationAccessMiddleware.js` verifies that organization owners and staff operators belong to the organization context of the requested resources (queues, tokens, counters).

---

## 11. WebSocket Event Mappings

* **`joinQueue` (Emit)**: Client subscribes to updates on a specific queue room (`queue:<queueId>`).
* **`joinUser` (Emit)**: Client subscribes to updates on a specific user room (`user:<userId>`).
* **`QUEUE_UPDATED` (Broadcast)**: Sent when queue configurations, check-ins, or completions shift.
* **`TOKEN_CALLED` (Broadcast)**: Sent to alert a queue room that a ticket number has been called.
* **`YOUR_TOKEN_CALLED` (Broadcast)**: Direct notification sent to the customer user room.

---

## 12. Local Development Setup

### Prerequisite
Ensure MongoDB is running locally on:
`mongodb://127.0.0.1:27017/smart-queue`

### Step 1: Start Backend Server
```powershell
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

### Step 2: Start Frontend Server
```powershell
cd ../frontend
npm install
npm run dev
```
The client dashboard will launch on `http://localhost:5173`.

---

## 13. Verification Tests
A complete backend validation suite is present in `backend/testSocket.js` and `backend/elevate_admin.js` equivalents. Additionally, `test_smart_queue.js` runs comprehensive lifecycle tests:
* Hashing & JWT logins.
* Role protections (ensuring staff members cannot intercept other counters).
* Concurrent desk operations.
* Appointment check-in transition checks.

To run tests:
```powershell
cd backend
node testSocket.js
```

---

## 14. Deployment Instructions

### Frontend Build
* **Command**: `npm run build`
* **Output Folder**: `dist/`
* Make sure `VITE_API_URL` points to your production backend URI.

### Backend Node.js
* **Command**: `npm start`
* Configure `PORT`, `MONGO_URI`, and `JWT_SECRET` in host env.
* Confirm the backend's CORS settings allow the production frontend URL.
