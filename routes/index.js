const express = require('express');
const moment = require('moment-timezone');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const db = require('../db'); // Import database connection
const { successResponse, errorResponse } = require('../utils/responseSchema');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// refresh token
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(403).json({
            success: false,
            message: 'Refresh token required',
            error: 'Forbidden'
        });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, 'secret_refresh_key', (err, payload) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token',
                error: 'Forbidden'
            });
        }

        // Check the token type
        if (payload.type !== 'refresh') {
            return res.status(403).json({
                success: false,
                message: 'Invalid token type',
                error: 'Forbidden'
            });
        }

        // Generate a new access token
        const accessToken = jwt.sign(
            { id: payload.id, type: 'access' },
            'secret_access_key',
            { expiresIn: '15m' }
        );

        res.json({
            success: true,
            message: 'Access token refreshed successfully',
            data: { accessToken }
        });
    });
});


router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic email validation
    if (!validator.isEmail(email)) {
        return res.status(400).json(errorResponse('Invalid email format'));
    }

    try {
        // Check if email already exists in the database
        const checkEmailQuery = 'SELECT * FROM USERS WHERE EMAIL = ?';
        db.get(checkEmailQuery, [email], async (err, row) => {
            if (err) {
                return res.status(500).json(errorResponse('Error checking email', err.message));
            }
            if (row) {
                return res.status(400).json(errorResponse('Email already in use'));
            }

            // If email is not in use, proceed with user registration
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = `INSERT INTO USERS (USERNAME, EMAIL, HASHED_PASS) VALUES (?, ?, ?)`;

            db.run(insertQuery, [username, email, hashedPassword], function (err) {
                if (err) {
                    return res.status(400).json(errorResponse('Registration failed', err.message));
                }
                res.status(201).json(successResponse('User registered successfully', { id: this.lastID }));
            });
        });
    } catch (error) {
        res.status(500).json(errorResponse('Server error during registration', error.message));
    }
});


// User Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM USERS WHERE EMAIL = ?`;

    db.get(query, [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json(errorResponse('Invalid email or password', 'Unauthorized'));
        }

        const isPasswordValid = await bcrypt.compare(password, user.HASHED_PASS);
        if (!isPasswordValid) {
            return res.status(401).json(errorResponse('Invalid email or password', 'Unauthorized'));
        }

        const access_token = jwt.sign({ id: user.ID , type: 'access'}, 'secret_access_key', { expiresIn: '1h' });
        const refresh_token = jwt.sign({ id: user.ID , type:'refresh'}, 'secret_refresh_key', { expiresIn: '30d' });

        const token = { access_token, refresh_token };
        res.status(200).json(successResponse('Login successful', token));
    });
});


// Add Expense
router.post('/expenses', authenticateToken, (req, res) => {
    const { amount, category, date, notes } = req.body;
    const userId = req.user.id;

    const query = `INSERT INTO EXPENSE (USER_ID, AMOUNT, CATEGORY, DATE, NOTES) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [userId, amount, category, date, notes], function (err) {
        if (err) {
            return res.status(400).json(errorResponse('Failed to add expense', err.message));
        }
        res.status(201).json(successResponse('Expense added successfully', { id: this.lastID }));
    });
});


// Get User Expenses
router.get('/expenses', authenticateToken, (req, res) => {
    // Extract userID from the authenticated user information
    const userId = req.user.id;

    // SQL query to fetch expenses for the given user, ordered by date descending
    const query = `SELECT * FROM EXPENSE WHERE USER_ID = ? ORDER BY DATE DESC`;

    // Execute the SQL query with the userId as a parameter
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(400).json(errorResponse('Failed to retrieve expenses', err.message));
        }
        res.json(successResponse('Expenses retrieved successfully', rows));
    });
});


router.get('/expenses/years', authenticateToken, (req, res) => {
    const userId = req.user.id;

    // SQL query to fetch all unique years where expenses exist for this user
    const query = `
    SELECT DISTINCT strftime('%Y', DATE) AS year 
    FROM EXPENSE 
    WHERE USER_ID = ?
    ORDER BY year DESC`;

    // Execute the SQL query with the userId as a parameter
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(400).json(errorResponse('Failed to retrieve expense years', err.message));
        }

        // Transform the result to just an array of years (as numbers)
        const years = rows.map(row => parseInt(row.year));

        res.json(successResponse('Expense years retrieved successfully', years));
    });
});

router.get('/expenses/months-by-year', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { year } = req.query;

    if (!year) {
        return res.status(400).json(errorResponse('Year parameter is required'));
    }

    // SQL query to fetch all unique months for a specific year where expenses exist for this user
    const query = `
    SELECT DISTINCT strftime('%m', DATE) AS month 
    FROM EXPENSE 
    WHERE USER_ID = ? AND strftime('%Y', DATE) = ?
    ORDER BY month DESC`;

    // Execute the SQL query with the userId and year as parameters
    db.all(query, [userId, year], (err, rows) => {
        if (err) {
            return res.status(400).json(errorResponse('Failed to retrieve expense months for year', err.message));
        }

        // Transform the result to just an array of months (as numbers)
        const months = rows.map(row => parseInt(row.month));

        res.json(successResponse('Expense months retrieved successfully for year ' + year, months));
    });
});


// Get User Total Expense and total expense for each category filtered by date range
router.get('/expenses/total', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { year, month } = req.query;

    if (!year) {
        return res.status(400).json(errorResponse('Year parameter is required'));
    }

    // SQL query to fetch total expense for each category
    let query;
    let params = [userId, year];

    if (month) {
        query = `
        SELECT 
            SUM(AMOUNT) AS total_expense, 
            CATEGORY
        FROM 
            EXPENSE 
        WHERE 
            USER_ID = ? AND strftime('%Y', DATE) = ? AND strftime('%m', DATE) = ?
        GROUP BY 
            CATEGORY`;
        params.push(month);
    } else {
        query = `
        SELECT 
            SUM(AMOUNT) AS total_expense, 
            CATEGORY
        FROM 
            EXPENSE 
        WHERE 
            USER_ID = ? AND strftime('%Y', DATE) = ?
        GROUP BY 
            CATEGORY`;
    }

    // Execute the SQL query with the userId, year, and optional month as parameters
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(400).json(errorResponse('Failed to retrieve expenses stats', err.message));
        }

        // Calculate total across all categories
        const total = rows.reduce((sum, row) => sum + parseFloat(row.total_expense), 0);

        // Add a new row for the total
        rows.push({
            total_expense: total,
            CATEGORY: 'Total'
        });

        // Sort rows first by total_expense (descending) then by CATEGORY (ascending)
        const sortedRows = rows.sort((a, b) => {
            if (b.CATEGORY === 'Total') return 1; // Ensure 'total' is always last
            if (a.CATEGORY === 'Total') return -1;

            // Compare total_expense first
            if (parseFloat(b.total_expense) !== parseFloat(a.total_expense)) {
                return parseFloat(b.total_expense) - parseFloat(a.total_expense);
            }
            // If total_expense is the same, sort by category name
            return a.CATEGORY.localeCompare(b.CATEGORY);
        });

        // Map to only include total_expense and category in the response
        const simplifiedRows = sortedRows.map(row => ({
            total_expense: row.total_expense,
            category: row.CATEGORY
        }));

        res.json(successResponse('Expenses stats retrieved successfully', simplifiedRows));
    });
});


// Get Daily Spending by Month and Year
router.get('/expenses/daily', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json(errorResponse('Both year and month parameters are required'));
    }

    const query = `
    SELECT 
        DATE(DATE) AS day, 
        SUM(AMOUNT) AS daily_total
    FROM 
        EXPENSE 
    WHERE 
        USER_ID = ? 
        AND strftime('%Y', DATE) = ? 
        AND strftime('%m', DATE) = ?
    GROUP BY 
        DATE(DATE)
    ORDER BY 
        DATE(DATE) DESC`;

    const params = [userId, year, month];

    // Execute the SQL query with the userId, year, and month as parameters
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(400).json(errorResponse('Failed to retrieve daily expenses', err.message));
        }

        res.json(successResponse('Daily expenses retrieved successfully', rows));
    });
});

module.exports = router;
