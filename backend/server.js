const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http'); 
const { Server } = require('socket.io'); 
const cron = require('node-cron'); 
const nodemailer = require('nodemailer'); 
const db = require('./db'); 

dotenv.config();
const app = express();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", methods:["GET", "POST"] } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// =========================================================
// 🌐 API ROUTES (All 13 Modules)
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

app.use('/api/auth', authRoutes);
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

// =========================================================
// 🤖 AUTOMATED CRON JOB: ABANDONED CART RECOVERY
// =========================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER || 'test@gmail.com', pass: process.env.EMAIL_PASS || 'password' }
});

// Runs every minute to check for users who left items in their cart
cron.schedule('* * * * *', () => {
    console.log('🤖 Cron Job Running: Checking for abandoned carts...');
    
    const query = `
        SELECT sc.user_id, sc.cart_data, u.username, u.email 
        FROM saved_carts sc
        JOIN users u ON sc.user_id = u.id
        WHERE sc.email_sent = FALSE 
        AND sc.last_updated < (NOW() - INTERVAL 2 MINUTE)
    `;

    db.query(query, (err, results) => {
        if (err) return console.error('Cron DB Error:', err.message);
        
        results.forEach(cart => {
            console.log(`\n=================================================`);
            console.log(`📧 SENDING ABANDONED CART EMAIL TO: ${cart.email}`);
            console.log(`Message: "Hey ${cart.username}, you left items in your cart! Use code COMEBACK10 for 10% off!"`);
            console.log(`=================================================\n`);

            // Attempt to send email (Silently fails if .env is not fully set up)
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: cart.email,
                subject: 'You left something behind at Eco Tour Nepal! 🏔️',
                text: `Hey ${cart.username}, you left items in your cart! Come back and use promo code COMEBACK10 for a special discount.`
            }, (error) => {});

            // Mark as emailed so we don't spam them
            db.query('UPDATE saved_carts SET email_sent = TRUE WHERE user_id = ?', [cart.user_id]);
        });
    });
});

// =========================================================
// ⚡ REAL-TIME WEBSOCKETS (Chat, Helpdesk, & Collaboration)
// =========================================================
io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // --- 🌍 1. COMMUNITY CHAT ---
    socket.on('send_message', (data) => {
        const insertQuery = 'INSERT INTO messages (author, text, time, image_url, reply_to_author, reply_to_text) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(insertQuery,[data.author, data.text, data.time, data.image_url || null, data.reply_to_author || null, data.reply_to_text || null], (err, result) => {
            if (!err) { 
                data.id = result.insertId; 
                io.emit('receive_message', data); 
            }
        });
    });

    socket.on('like_message', (data) => {
        db.query('UPDATE messages SET liked_by = ? WHERE id = ?', [JSON.stringify(data.liked_by), data.msg_id], (err) => { 
            if (!err) io.emit('update_likes', data); 
        });
    });

    // --- 🔒 2. PRIVATE 1-ON-1 CHAT ---
    socket.on('join_private_room', (room) => socket.join(room));

    socket.on('send_private_message', (data) => {
        const insertQuery = 'INSERT INTO private_messages (room_id, sender_id, receiver_id, text, image_url, reply_to_author, reply_to_text) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(insertQuery,[data.room_id, data.sender_id, data.receiver_id, data.text || '', data.image_url || null, data.reply_to_author || null, data.reply_to_text || null], (err, result) => {
            if (!err) { 
                data.id = result.insertId; 
                io.to(data.room_id).emit('receive_private_message', data); 
            }
        });
    });

    socket.on('like_private_message', (data) => {
        db.query('UPDATE private_messages SET liked_by = ? WHERE id = ?', [JSON.stringify(data.liked_by), data.msg_id], (err) => { 
            if (!err) io.to(data.room_id).emit('update_private_likes', data); 
        });
    });

    // --- 🎧 3. LIVE HELPDESK ---
    socket.on('join_helpdesk', (userId) => { 
        socket.join(`helpdesk_${userId}`); 
        socket.join('admin_helpdesk_alerts'); 
    });

    socket.on('send_helpdesk_message', (data) => {
        const insertQuery = 'INSERT INTO helpdesk_messages (user_id, sender_type, text) VALUES (?, ?, ?)';
        db.query(insertQuery, [data.user_id, data.sender_type, data.text], (err, result) => {
            if (!err) {
                data.id = result.insertId; 
                data.created_at = new Date().toISOString();
                io.to(`helpdesk_${data.user_id}`).emit('receive_helpdesk_message', data);
                if (data.sender_type === 'user') io.to('admin_helpdesk_alerts').emit('admin_helpdesk_ping', data);
            }
        });
    });

    // --- 🤝 4. REGIONAL COLLABORATION HUB (NEW) ---
    socket.on('join_regional_room', (region) => {
        const roomName = `region_${region}`;
        socket.join(roomName);
        console.log(`🤝 Seller joined regional room: ${roomName}`);
    });

    socket.on('send_regional_message', (data) => {
        // Broadcast live to everyone in that specific region
        io.to(`region_${data.region}`).emit('receive_regional_message', data);
    });

    socket.on('disconnect', () => console.log('🔴 User disconnected:', socket.id));
});

// =========================================================
// 🚀 START SERVER
// =========================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));