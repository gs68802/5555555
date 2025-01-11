const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    // Extract the token from the Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // If no token is provided, return an unauthorized error
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by ID from the decoded token
        const user = await User.findById(decoded.id);

        // If no user is found, return an error
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Attach the user object to the request object
        req.user = user;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        // Log the error for debugging purposes
        console.error('Error during authentication:', err);

        // If token verification fails, return an unauthorized error
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = authenticate;
