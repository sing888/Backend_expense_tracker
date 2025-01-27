const jwt = require('jsonwebtoken');

// Middleware to authenticate tokens
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Access denied, no token provided',
            error: 'Forbidden'
        });
    }

    // Verify the token
    jwt.verify(token, 'secret_access_key', (err, payload) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token',
                error: 'Forbidden'
            });
        }

        // Check the token type
        if (payload.type !== 'access') {
            return res.status(403).json({
                success: false,
                message: 'Invalid token type',
                error: 'Forbidden'
            });
        }

        req.user = payload; // Attach user info to the request
        next();
    });

}

module.exports = authenticateToken;


