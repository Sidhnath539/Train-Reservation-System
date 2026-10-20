# Railora - Indian Railway Reservation System Deployment Guide

This project is a full-stack Railway Reservation System built with **Node.js, Express, MySQL, and Modern Vanilla Web Technologies**. It is pre-configured for seamless cloud deployment.

---

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Fastest & Easiest)
Railway provides both **Node.js hosting** and **MySQL database** in one dashboard with zero configuration.

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository: `https://github.com/Sidhnath539/Train-Reservation-System`.
4. Click **Add a Service** → **Database** → **MySQL**.
5. Railway will automatically link the MySQL service and provide `DATABASE_URL`.
6. Add the following Environment Variables in your Web Service:
   - `JWT_SECRET`: Any random 32+ character secure string (e.g. `railora_prod_super_secure_jwt_secret_2026`).
   - `NODE_ENV`: `production`
7. Click **Deploy**.
   - The application will automatically connect to the MySQL database.
   - On initial launch, the system automatically runs `database/railway.sql` to seed all stations, trains, seats, and default accounts.

---

### Option 2: Render
Render offers free cloud web hosting and managed databases.

1. Go to [Render.com](https://render.com/) and sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Connect your repository: `Sidhnath539/Train-Reservation-System`.
4. Render will read the included [`render.yaml`](render.yaml) file and provision:
   - A Web Service running Node.js.
   - A Managed MySQL Database instance.
5. Alternatively, create a **Web Service** manually:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `DATABASE_URL`: Your MySQL connection URI (e.g. from Aiven, Clever Cloud, or Render).
     - `JWT_SECRET`: Random secret string.
     - `NODE_ENV`: `production`
     - `DB_SSL`: `true`

---

### Option 3: Docker Deployment
The repository includes a production-ready, lightweight Alpine [`Dockerfile`](Dockerfile).

#### Build & Run locally or on any VPS / Cloud Container Service:
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
| `DATABASE_URL` | **Yes** (Cloud) | _None_ | Full connection string (e.g. `mysql://user:pass@host:3306/dbname`) |
| `PORT` | Optional | `5000` | Port on which the Express server listens (auto-assigned by PaaS) |
| `NODE_ENV` | Optional | `development` | Environment mode (`production` recommended in cloud) |
| `JWT_SECRET` | **Yes** | Built-in fallback | Secret key for signing and verifying JWT authentication tokens |
| `DB_HOST` | If no URI | `localhost` | MySQL host address |
| `DB_USER` | If no URI | `root` | MySQL username |
| `DB_PASSWORD` | If no URI | _empty_ | MySQL password |
| `DB_NAME` | If no URI | `railway_db` | Target database name |
| `DB_PORT` | Optional | `3306` | MySQL port number |
| `DB_SSL` | Optional | `false` | Set to `true` if your cloud database requires SSL certificates |

---

## 🛠️ Included Deployment Files

- [`.gitignore`](.gitignore): Pre-configured to prevent accidental commit of `node_modules` or `.env` credentials.
- [`Procfile`](Procfile): Declares the web dyno process command (`web: npm start`).
- [`railway.json`](railway.json): Native Railway deployment specification.
- [`render.yaml`](render.yaml): Render Blueprint for infrastructure-as-code deployment.
- [`Dockerfile`](Dockerfile): Multi-stage, security-hardened Alpine container specification.
- [`.dockerignore`](.dockerignore): Keeps Docker builds minimal and fast.

---

## 👥 Default Seed Accounts

Upon first launch, the database is auto-seeded with test data and accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@railway.gov.in` | `admin123` | Full access to add trains, manage schedules, update status & view passenger bookings |
| **Test Passenger** | `rahul@gmail.com` | `password123` | Book tickets, view PNR slips, search trains & check live radar |
