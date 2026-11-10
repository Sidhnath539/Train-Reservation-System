# Railora - Indian Railway Reservation System Deployment Guide

This project is a production-ready, full-stack Railway Reservation System built with **Node.js, Express, MySQL, and Modern Vanilla Web Technologies**.

The project is pre-configured with zero-friction deployment configurations for **Docker**, **Docker Compose**, **Railway**, **Render**, and **Vercel**.

---

## 🚀 One-Command Deployment with Docker Compose (Recommended)

Run the complete full stack (Node.js application + initialized MySQL 8.0 database) with a single command:

```bash
docker compose up -d
```

- **Application URL**: `http://localhost:5000`
- **Database**: Port `3307` on host (`3306` inside container)
- **Auto-Initialization**: The database schema and catalog are automatically imported on the first container boot from [`database/railway.sql`](database/railway.sql).

To stop the containers:
```bash
docker compose down
```

---

## ☁️ Cloud Platform Deployments

### Option 1: Railway (Fastest Cloud Setup)

Railway provides both **Node.js compute** and **MySQL database** in one dashboard with zero configuration.

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select this repository: `https://github.com/Sidhnath539/Train-Reservation-System`.
4. In the project canvas, click **New** → **Database** → **Add MySQL**.
5. Railway automatically provides `DATABASE_URL` and `MYSQL_URL` to your service.
6. In your web service settings, add environment variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Any random 32+ character secure string (e.g. `railora_prod_super_secure_jwt_secret_2026`).
7. Click **Deploy**.
   - The application automatically detects the MySQL service, runs table verification, and seeds the entire database from `database/railway.sql` on first start!

---

### Option 2: Render

1. Go to [Render.com](https://render.com/) and sign in.
2. Click **New +** → **Blueprint** and connect your GitHub repository.
3. Render reads [`render.yaml`](render.yaml) automatically.
4. Set your `DATABASE_URL` connection string when prompted:
   - You can obtain a free MySQL database from [Aiven](https://aiven.io/), [TiDB Cloud](https://tidbcloud.com/), or [Clever Cloud](https://www.clever-cloud.com/).
   - Format: `mysql://user:password@host:port/dbname?ssl={"rejectUnauthorized":false}`
5. Deploy the service. Health checks (`/api/health`) will monitor service uptime.

---

### Option 3: Docker Container Build

The repository includes a lightweight, hardened Alpine Linux [`Dockerfile`](Dockerfile).

```bash
# 1. Build the Docker image
docker build -t railora-system .

# 2. Run container with environment variables
docker run -d -p 5000:5000 \
  -e DATABASE_URL="mysql://user:password@host:3306/railway_db" \
  -e JWT_SECRET="your_secure_jwt_secret" \
  --name railora-app railora-system
```

---

## 🔑 Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` or `MYSQL_URL` | **Yes** (Cloud) | _None_ | Full connection string (e.g. `mysql://user:pass@host:3306/dbname`) |
| `PORT` | Optional | `5000` | Port for Express server (auto-assigned on Render/Railway/Heroku) |
| `NODE_ENV` | Optional | `development` | Mode (`production` recommended in cloud) |
| `JWT_SECRET` | **Yes** | Built-in fallback | Secret key for signing and verifying JWT authentication tokens |
| `DB_HOST` | If no URI | `localhost` | MySQL host address |
| `DB_USER` | If no URI | `root` | MySQL username |
| `DB_PASSWORD` | If no URI | _empty_ | MySQL password |
| `DB_NAME` | If no URI | `railway_db` | Target database name |
| `DB_PORT` | Optional | `3306` | MySQL port number |
| `DB_SSL` | Optional | `false` | Set to `true` if your cloud database requires SSL |

---

## 🛠️ Included Deployment Assets

- [`docker-compose.yml`](docker-compose.yml): Complete containerized stack with MySQL 8.0 health checks and auto-seeding.
- [`Dockerfile`](Dockerfile): Multi-stage, security-hardened Alpine container specification.
- [`.dockerignore`](.dockerignore): Keeps Docker builds minimal and fast.
- [`railway.json`](railway.json): Native Railway deployment specification with health checks.
- [`render.yaml`](render.yaml): Render Blueprint for infrastructure-as-code deployment.
- [`vercel.json`](vercel.json): Serverless configuration for Vercel deployment.
- [`Procfile`](Procfile): Declares the web dyno process command (`web: npm start`).
- [`.gitignore`](.gitignore): Prevents accidental commits of `node_modules` or `.env` credentials.

---

## 👥 Default Seed Accounts

Upon first launch, the database is auto-seeded with test data and accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@railway.gov.in` | `admin123` | Full access to add trains, manage schedules, update status & view passenger bookings |
| **Passenger** | `rahul@gmail.com` | `password123` | Book tickets, view PNR slips, search trains & check schedules |
