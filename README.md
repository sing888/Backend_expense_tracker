# Backend Expense Tracker

A simple expense tracker application built with **Node.js**, **Express.js**, and **SQLite3**. Users can create accounts, add expenses, and view their expenses. The app uses **JWT (JSON Web Tokens)** for authentication and authorization.

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/sing888/Backend_expense_tracker.git
   cd Backend_expense_tracker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## Running the Application

1. Initialize the database:
   ```bash
   node init_db.js
   ```
2. Start the server:
   ```bash
   npm start
   ```
   Alternatively, run:
   ```bash
   node app.js
   ```

---

## API Endpoints

### **Authentication**

| Method | Endpoint   | Description         | Body                                                          |
|--------|------------|---------------------|---------------------------------------------------------------|
| POST   | /register  | Register a new user | `{"username": "string", "email": "string", "password": "string"}` |
| POST   | /login     | Log in a user       | `{"email": "string", "password": "string"}`                    |
| POST   | /refresh   | Refresh token       | `{"refreshToken": "string"}`                                   |

### **Expenses**

| Method | Endpoint       | Description            | Body                                                                                   |
|--------|----------------|------------------------|----------------------------------------------------------------------------------------|
| GET    | /expenses/:id  | Get a specific expense | None                                                                                   |
| POST   | /expenses      | Create a new expense   | `{"userId": int, "amount": float, "category": "string", "date": "string", "notes": "string"}` |

---
