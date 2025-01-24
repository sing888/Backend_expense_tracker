# Back End Expense Tracker

This is a simple expense tracker application built using Node.js, Express.js, and SQLite3. It allows users to create accounts, add expenses, and view their expenses. The application uses JWT (JSON Web Tokens) for authentication and authorization.

## Getting Started
To get started, clone the repository and install the dependencies:

```
git clone https://github.com/sing888/Backend_expense_tracker.git
cd Backend_expense_tracker
npm install
```

## Running the Application
To run the application, use the following command:

```
npm start
node init_db.js
node app.js
```

The `init_db.js` file creates the SQLite3 database and the `app.js` file starts the server.

## API Endpoints

### Authentication

| Method | Endpoint | Description       |
| --- | --- |-------------------|
| POST | /register | Register a new user |
| POST | /login | Login a user      |
| POST | /refresh | Refresh Token     |

### Expenses

| Method | Endpoint          | Description |
| --- |-------------------| --- |
| GET | expenses/:id      | Get a specific expense |
| POST | /expenses         | Create a new expense |
