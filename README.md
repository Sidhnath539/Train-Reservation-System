# 🚆 Railora - Indian Railway Reservation System

A full-stack, production-ready Railway Reservation System built with **Node.js**, **Express.js**, **MySQL (XAMPP)**, and a modern vanilla **HTML5 / CSS3 / JavaScript** frontend.

---

## 🌟 Key Features

1. **Train Search & Schedule Inquiry**
   - Live search by source station, destination station, and journey date.
   - Dynamic real-time class pricing (1A, 2A, 3A, SL, CC, EC) and seat availability badges (`AVL`, `WL`).
   - Station search with auto-complete and swap button.
   - Route and timing filters (Rajdhani, Shatabdi, Vande Bharat, Superfast, Duronto).

2. **Safe Ticket Booking (Atomic Concurrency)**
   - Powered by MySQL transactions (`BEGIN TRANSACTION`, `SELECT ... FOR UPDATE`, and `COMMIT`).
   - Prevents double booking or seat overselling during concurrent requests.
   - Dynamic passenger entry (up to 6 passengers per ticket) with berth preferences.
   - Realistic coach & seat allocation algorithm (e.g., `B2-21 (LB)`).
   - Generates unique 10-digit Indian Railway PNR numbers.

3. **PNR Status Inquiry & Printable Electronic Ticket**
   - 10-digit PNR lookup.
   - Realistic Indian Railways Electronic Reservation Slip (ERS) layout with train details, departure/arrival schedules, and passenger seat statuses.
   - Native Print / Save to PDF support (`Ctrl+P` / `window.print()`).

4. **Safe Ticket Cancellation & Automatic Seat Restoration**
   - Safe seat increment in `train_schedule_seats`.
   - Real-time refund calculation deducting applicable cancellation charges.
   - Updates passenger status to `CAN` and booking status to `CANCELLED`.

5. **Administrative Operations Dashboard**
   - KPI metrics: Total Active Trains, Total Bookings, Confirmed Bookings, Total Revenue.
   - Train Management: Add new trains with source/destination stations, departure/arrival times, and class base fares.
   - Delete / Toggle train status.
   - Passenger Reservation Manifest: Filter and search all system bookings by PNR, train number, passenger name, and status.

6. **Secure User Authentication & Password Recovery**
   - Password hashing with **Bcrypt**.
   - Stateless **JSON Web Tokens (JWT)**.
   - **Forgot Password / Self-Service Reset**: Two-factor verification using registered email & mobile number with instant password update.
   - Role-Based Access Control (`user` vs `admin`).
   - One-click demo credentials autofill for quick testing.

---

## 📁 Project Structure

```
Railway Reservation System/
├── package.json               # Node.js dependencies and run scripts
├── server.js                  # Express application & server entry point
├── db.js                      # MySQL2 connection pool with auto-initialization
├── .env                       # Environment variables (XAMPP DB settings)
├── .env.example               # Example environment configuration
├── database/
│   └── railway.sql            # Relational database schema & rich seed data
├── middleware/
│   └── auth.js                # JWT verification and admin role protection
├── routes/
│   ├── authRoutes.js          # Register, Login, User profile
│   ├── trainRoutes.js         # Search trains, stations directory, train details
│   ├── bookingRoutes.js       # Safe atomic booking, PNR lookup, cancellation
│   └── adminRoutes.js         # Stats KPIs, Train CRUD, Bookings manifest
├── public/                    # Frontend files
│   ├── assets/                # Generated hero banners & media
│   ├── index.html             # Homepage with IRCTC Vande Bharat hero & search
│   ├── trains.html            # Train search results & availability chips
│   ├── book.html              # Passenger booking form & fare breakdown
│   ├── pnr.html               # PNR lookup & realistic e-Ticket view
│   ├── my-bookings.html       # Passenger booking history & cancellation
│   ├── login.html             # Tabbed Login / Registration / Reset Password page
│   ├── admin.html             # Administrative operations dashboard
│   ├── css/
│   │   └── style.css          # Design system, Font Awesome icons
│   └── js/
│       ├── api.js             # Universal fetch wrapper, auth state, toasts
│       ├── auth.js            # Sign in, sign up, password recovery
│       ├── main.js            # Home page station autocomplete & search
│       ├── trains.js          # Search results, filter chips & booking modal
│       ├── pnr.js             # PNR search, e-Ticket rendering, cancellation
│       ├── bookings.js        # User bookings list & ticket view
│       └── admin.js           # Admin dashboard metrics, train CRUD, manifests
└── README.md                  # Project setup and documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher): Verify with `node -v`
- **XAMPP**: Installed on your system (Apache and MySQL modules)

---

### 2. Configure MySQL Database in XAMPP

1. Open the **XAMPP Control Panel**.
2. Click **Start** on the **MySQL** module (and Apache if you use phpMyAdmin).
3. Open your browser and navigate to **phpMyAdmin**: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
4. Click on the **Import** tab at the top.
5. Choose the file located at:
   `database/railway.sql`
6. Click **Import** (or **Go**).
   > *Note:* The SQL file automatically creates the database `railway_db` and seeds stations, trains, classes, and demo accounts.
   > *Bonus:* When you start `server.js`, it will also automatically attempt to initialize and seed `railway_db` if not yet present!

---

### 3. Verify or Update `.env` Settings

Check the `.env` file in the root directory. The defaults match standard XAMPP settings:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=railway_db
DB_PORT=3306
JWT_SECRET=railway_secret_key_2026_super_secure_jwt
```
*(If your XAMPP MySQL root has a password, enter it in `DB_PASSWORD`)*.

---

### 4. Install Dependencies

In the project folder, run:
```bash
npm install
```

---

### 5. Start the Application

To start the server:
```bash
npm start
```
Or with auto-restart on file change (development mode):
```bash
npm run dev
```

Once started, open your browser and visit:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Default Demo Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@railway.gov.in` | `admin123` | Admin Portal, Add/Delete Trains, View All Bookings, Cancel any ticket |
| **Standard Passenger** | `rahul@gmail.com` | `password123` | Book tickets, view personal bookings, cancel own tickets |

---

## 🧪 Sample Pre-Seeded PNRs to Test

You can test the **PNR Status** lookup immediately using any of these numbers:
- `8429104821` (New Delhi ➔ Howrah Rajdhani, Confirmed)
- `2940185930` (New Delhi ➔ Mumbai Central Tejas Rajdhani, Confirmed)
- `6519284710` (New Delhi ➔ Varanasi Vande Bharat, Confirmed)

---

## 🛡️ Database Concurrency & Safety

To prevent race conditions during simultaneous booking attempts:
```javascript
// Sample transaction flow in routes/bookingRoutes.js
const connection = await pool.getConnection();
await connection.beginTransaction();

// 1. Lock the schedule row to ensure atomic seat deduction
const [schedule] = await connection.query(
  'SELECT * FROM train_schedule_seats WHERE train_id = ? AND class_code = ? AND journey_date = ? FOR UPDATE',
  [train_id, class_code, journey_date]
);

// 2. Validate seat availability & assign seats
if (schedule[0].available_seats >= passengers.length) {
  await connection.query('UPDATE train_schedule_seats SET available_seats = available_seats - ? ...');
  // 3. Insert into bookings and passengers
}

await connection.commit();
connection.release();
```

---

## 📄 License
MIT License. Dedicated to Indian Railways Commuters.
