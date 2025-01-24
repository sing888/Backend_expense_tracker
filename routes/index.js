const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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


// User Registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO USERS (USERNAME, EMAIL, HASHED_PASS) VALUES (?, ?, ?)`;

        db.run(query, [username, email, hashedPassword], function (err) {
            if (err) {
                return res.status(400).json(errorResponse('Registration failed', err.message));
            }
            res.status(201).json(successResponse('User registered successfully', { id: this.lastID }));
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
        const refresh_token = jwt.sign({ id: user.ID , type:'refresh'}, 'secret_refresh_key', { expiresIn: '7d' });

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
router.get('/expenses/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `SELECT * FROM EXPENSE WHERE USER_ID = ?`;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(400).json(errorResponse('Failed to retrieve expenses', err.message));
        }
        res.json(successResponse('Expenses retrieved successfully', rows));
    });
});


module.exports = router;
