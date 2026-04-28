const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const db = require('./db');
const socketAuth = require('./middleware/socketAuth');

dotenv.config();

// Fail fast if critical env vars are missing
const required = ['JWT_SECRET', 'FRONTEND_URL'];
for (const key of required) {
    if (!process.env[key]) {
        console.error(`❌ Missing required env var: ${key}`);
        process.exit(1);
    }
}

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL;

const io = new Server(server, {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true },
});

// =========================================================
// 🛡️ SECURITY MIDDLEWARE
// =========================================================
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static('uploads'));

// Health check (for uptime monitors)
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Global rate limit — stricter on auth endpoints below
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', generalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 auth attempts per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts, please try again later.' },
});

// =========================================================
// 🌐 API ROUTES
// =========================================================
const authRoutes = require('./routes/authRoutes');
const tourRoutes = require('./routes/tourRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const helpdeskRoutes = require('./routes/helpdeskRoutes');
const walletRoutes = require('./routes/walletRoutes');
const cartRoutes = require('./routes/cartRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const promoRoutes = require('./routes/promoRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/helpdesk', helpdeskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promo', promoRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
    console.error('API Error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// =========================================================
// 🤖 ABANDONED CART CRON (race-safe)
// =========================================================
const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
    : null;

if (!transporter) {
    console.warn('⚠️  Email credentials not set — abandoned cart emails will be skipped.');
}

// Run every 15 minutes, target carts inactive for 1+ hour
cron.schedule('*/15 * * * *', async () => {
    if (!transporter) return;
    console.log('🤖 Cron: scanning abandoned carts...');

    try {
        // Atomically claim rows so a slow run can't double-send
        const [claimed] = await db.promise().query(`
            UPDATE saved_carts
            SET email_sent = TRUE
            WHERE email_sent = FALSE
              AND last_updated < (NOW() - INTERVAL 1 HOUR)
        `);

        if (claimed.affectedRows === 0) return;

        const [results] = await db.promise().query(`
            SELECT sc.user_id, u.username, u.email
            FROM saved_carts sc
            JOIN users u ON sc.user_id = u.id
            WHERE sc.email_sent = TRUE
              AND sc.last_updated < (NOW() - INTERVAL 1 HOUR)
              AND sc.last_updated > (NOW() - INTERVAL 2 HOUR)
        `);

        for (const cart of results) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: cart.email,
                    subject: 'You left something behind at Eco Tour Nepal! 🏔️',
                    text: `Hey ${cart.username}, you left items in your cart! Use code COMEBACK10 for 10% off.`,
                });
                console.log(`📧 Sent abandoned cart email to ${cart.email}`);
            } catch (mailErr) {
                console.error(`Email failed for ${cart.email}:`, mailErr.message);
            }
        }
    } catch (err) {
        console.error('Cron DB error:', err.message);
    }
});

// =========================================================
// ⚡ AUTHENTICATED WEBSOCKETS
// =========================================================
io.use(socketAuth);

io.on('connection', (socket) => {
    const { id: userId, username, role } = socket.user;
    console.log(`🟢 Authenticated: ${username} (${userId})`);

    // Auto-join personal notification room
    socket.join(`user_${userId}`);
    socket.join('community'); // scoped community broadcast room

    // --- 🌍 1. COMMUNITY CHAT ---
    socket.on('send_message', async (data) => {
        if (!data?.text || typeof data.text !== 'string' || data.text.length > 2000) return;

        try {
            const [result] = await db.promise().query(
                'INSERT INTO messages (author_id, author, text, time, image_url, reply_to_author, reply_to_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, username, data.text, new Date(), data.image_url || null, data.reply_to_author || null, data.reply_to_text || null]
            );
            io.to('community').emit('receive_message', {
                id: result.insertId,
                author_id: userId,
                author: username,
                text: data.text,
                time: new Date(),
                image_url: data.image_url || null,
                reply_to_author: data.reply_to_author || null,
                reply_to_text: data.reply_to_text || null,
            });
        } catch (err) {
            console.error('send_message error:', err.message);
            socket.emit('error', { event: 'send_message', message: 'Failed to send' });
        }
    });

    socket.on('like_message', async (data) => {
        if (!data?.msg_id) return;
        try {
            // Toggle like in a join table (replace JSON-blob approach)
            const [existing] = await db.promise().query(
                'SELECT 1 FROM message_likes WHERE message_id = ? AND user_id = ?',
                [data.msg_id, userId]
            );
            if (existing.length) {
                await db.promise().query(
                    'DELETE FROM message_likes WHERE message_id = ? AND user_id = ?',
                    [data.msg_id, userId]
                );
            } else {
                await db.promise().query(
                    'INSERT INTO message_likes (message_id, user_id) VALUES (?, ?)',
                    [data.msg_id, userId]
                );
            }
            const [[{ count }]] = await db.promise().query(
                'SELECT COUNT(*) as count FROM message_likes WHERE message_id = ?',
                [data.msg_id]
            );
            io.to('community').emit('update_likes', { msg_id: data.msg_id, count, user_id: userId });
        } catch (err) {
            console.error('like_message error:', err.message);
        }
    });

    // --- 🔒 2. PRIVATE 1-ON-1 CHAT ---
    // Room id convention: sorted user IDs joined by `_`
    socket.on('join_private_room', (room) => {
        if (typeof room !== 'string') return;
        const parts = room.split('_').map(Number);
        if (parts.length !== 2 || !parts.includes(userId)) {
            return socket.emit('error', { event: 'join_private_room', message: 'Forbidden' });
        }
        socket.join(room);
    });

    socket.on('send_private_message', async (data) => {
        if (!data?.room_id || !data?.receiver_id) return;
        const parts = String(data.room_id).split('_').map(Number);
        if (!parts.includes(userId)) return; // sender must be in the room

        try {
            const [result] = await db.promise().query(
                'INSERT INTO private_messages (room_id, sender_id, receiver_id, text, image_url, reply_to_author, reply_to_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [data.room_id, userId, data.receiver_id, data.text || '', data.image_url || null, data.reply_to_author || null, data.reply_to_text || null]
            );
            io.to(data.room_id).emit('receive_private_message', {
                id: result.insertId,
                room_id: data.room_id,
                sender_id: userId,
                receiver_id: data.receiver_id,
                text: data.text || '',
                image_url: data.image_url || null,
                reply_to_author: data.reply_to_author || null,
                reply_to_text: data.reply_to_text || null,
            });
        } catch (err) {
            console.error('send_private_message error:', err.message);
        }
    });

    // --- 🎧 3. LIVE HELPDESK ---
    socket.on('join_helpdesk', () => {
        socket.join(`helpdesk_${userId}`);
        if (role === 'admin') socket.join('admin_helpdesk_alerts'); // 🔒 admins only
    });

    socket.on('send_helpdesk_message', async (data) => {
        if (!data?.text) return;

        // Senders can only post as themselves; admins can post as 'admin' to any user's room
        let targetUserId;
        let senderType;
        if (role === 'admin' && data.user_id) {
            targetUserId = data.user_id;
            senderType = 'admin';
        } else {
            targetUserId = userId;
            senderType = 'user';
        }

        try {
            const [result] = await db.promise().query(
                'INSERT INTO helpdesk_messages (user_id, sender_type, text) VALUES (?, ?, ?)',
                [targetUserId, senderType, data.text]
            );
            const payload = {
                id: result.insertId,
                user_id: targetUserId,
                sender_type: senderType,
                text: data.text,
                created_at: new Date().toISOString(),
            };
            io.to(`helpdesk_${targetUserId}`).emit('receive_helpdesk_message', payload);
            if (senderType === 'user') io.to('admin_helpdesk_alerts').emit('admin_helpdesk_ping', payload);
        } catch (err) {
            console.error('send_helpdesk_message error:', err.message);
        }
    });

    // --- 🤝 4. REGIONAL CO-OP HUB (sellers only) ---
    socket.on('join_regional_room', (region) => {
        if (role !== 'seller' && role !== 'admin') {
            return socket.emit('error', { event: 'join_regional_room', message: 'Sellers only' });
        }
        if (typeof region !== 'string') return;
        socket.join(`region_${region}`);
    });

    socket.on('send_regional_message', (data) => {
        if (role !== 'seller' && role !== 'admin') return;
        if (!data?.region || !data?.text) return;
        io.to(`region_${data.region}`).emit('receive_regional_message', {
            ...data,
            sender_id: userId,
            sender_username: username,
        });
    });

    socket.on('disconnect', () => console.log(`🔴 Disconnected: ${username}`));
});

// =========================================================
// 🚀 SERVER + GRACEFUL SHUTDOWN
// =========================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => {
        if (db.end) db.end();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
