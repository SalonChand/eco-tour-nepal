const jwt = require('jsonwebtoken');

/**
 * Socket.io authentication middleware.
 * Expects the client to pass a JWT in `socket.handshake.auth.token`.
 * On success, attaches the decoded payload to `socket.user`.
 *
 * Frontend usage:
 *   const socket = io(SERVER_URL, { auth: { token: localStorage.getItem('token') } });
 */
module.exports = function socketAuth(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Expecting payload like: { id, username, role }
        socket.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role || 'user',
        };
        return next();
    } catch (err) {
        return next(new Error('Invalid or expired token'));
    }
};
