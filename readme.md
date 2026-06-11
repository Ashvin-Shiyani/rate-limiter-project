# 🚦 Distributed Rate Limiter Microservice

A production-ready rate limiting microservice built with Node.js, Redis, and PostgreSQL — featuring JWT authentication, three rate limiting algorithms, and a React dashboard with a dark terminal aesthetic.

**🌐 Live Demo:** https://rate-limiter-client.onrender.com  
**⚙️ Backend API:** https://rate-limiter-project-jqz3.onrender.com

---

## 📸 Screenshots

![Register](screenshots/Register.jpeg)
![Login](screenshots/Login.jpeg)
![Dashboard](screenshots/Dashboard.jpeg)

---

## 🤔 Why I Built This

Rate limiting is one of those things every production API needs but most tutorials skip. I wanted to actually understand how it works under the hood — not just `npm install express-rate-limit` and call it a day. So I built one from scratch with three different algorithms, atomic Redis operations via Lua scripting, and a full dashboard to manage API keys.

---

## ✨ Features

- 🔐 JWT authentication — register, login, protected routes
- ⚡ Three rate limiting algorithms — Fixed Window, Sliding Window, Token Bucket
- 🧠 Atomic Lua scripting for race-condition-free Token Bucket in Redis
- 🏷️ Tier system — Free (100 req/min), Silver (200 req/min), Gold (500 req/min)
- 🗝️ API key management — generate, view, delete keys from the dashboard
- 🌊 React dashboard with dark terminal theme and wave animations
- ☁️ Fully deployed — Render (backend + frontend), PostgreSQL, Redis Cloud

---

## 🧠 How the Algorithms Work

### Fixed Window

Divides time into fixed buckets (e.g. 0–60s, 60–120s). Counts requests per bucket. Simple and fast but can allow 2x the limit at window boundaries if a client bursts at the end of one window and the start of the next.

### Sliding Window

Tracks every request timestamp in a Redis sorted set. On each request, it removes timestamps older than the window and counts what's left. More accurate than fixed window — no boundary bursts.

### Token Bucket

Every API key gets a bucket of tokens. Tokens refill at a steady rate over time. Each request costs one token. If the bucket is empty, the request is rejected. This is the most flexible algorithm — it naturally handles bursts while enforcing average rate limits.

The Token Bucket is implemented using a **Lua script** executed atomically in Redis. This is critical in a distributed system — without atomicity, two simultaneous requests could both read the same token count, both decide there's enough tokens, and both proceed even when only one should.

---

## 🏗️ Architecture

React Frontend (Render Static Site)
↓
Express Backend (Render Web Service)
↓ ↓
PostgreSQL Redis Cloud
(users, (rate limit
api_keys) counters)

---

## 🛠️ Tech Stack

| Layer                 | Technology                       |
| --------------------- | -------------------------------- |
| Backend               | Node.js, Express                 |
| Database              | PostgreSQL                       |
| Cache / Rate Limiting | Redis                            |
| Authentication        | JWT, bcrypt                      |
| Atomic Scripting      | Lua                              |
| Frontend              | React 18, React Router v6, Axios |
| Deployment            | Render, Redis Cloud              |

---

## 📡 API Reference

### Auth

| Method | Endpoint         | Body                        | Description    |
| ------ | ---------------- | --------------------------- | -------------- |
| POST   | `/auth/register` | `{ name, email, password }` | Create account |
| POST   | `/auth/login`    | `{ email, password }`       | Get JWT token  |

### API Keys (requires `Authorization: Bearer <token>`)

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| POST   | `/keys/generate` | Generate a new API key |
| GET    | `/keys`          | List all your API keys |
| DELETE | `/keys/:id`      | Delete an API key      |

### Rate Limited Endpoint

```bash
GET /test
Header: x-api-key: YOUR_API_KEY
```

✅ Allowed:

```json
{ "message": "Request allowed!" }
```

🚫 Rate limited:

```json
{ "error": "Too many requests", "retryAfter": 60 }
```

---

## 🚀 Local Development

### Prerequisites

- Node.js
- PostgreSQL
- Redis (Docker: `docker run --name redis -p 6379:6379 -d redis`)

### Setup

```bash
git clone https://github.com/Ashvin-Shiyani/rate-limiter-project.git
cd rate-limiter-project
npm install
cd client && npm install && cd ..
```

Create `.env` in root:
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ratelimiter
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=yourjwtsecret
REDIS_HOST=localhost
REDIS_PORT=6379

### Run

```bash
# Backend
node src/index.js

# Frontend (new terminal)
cd client && npm start
```

## 📁 Project Structure

```
rate-limiter-project/
├── src/
│   ├── index.js
│   ├── config/
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── schema.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── keys.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   └── algorithms/
│       ├── fixedWindow.js
│       ├── slidingWindow.js
│       └── tokenBucket.js
├── scripts/
│   └── tokenBucket.lua
└── client/
    └── src/
        ├── App.js
        ├── api.js
        └── pages/
            ├── Login.js
            ├── Register.js
            └── Dashboard.js
```

## 👤 Author

**Ashvin Shiyani** — 3rd year Computer Science @ Acadia University  
GitHub: [@Ashvin-Shiyani](https://github.com/Ashvin-Shiyani)

**Collaborator:** [@Kartik-Holkar](https://github.com/Kartik-Holkar)
