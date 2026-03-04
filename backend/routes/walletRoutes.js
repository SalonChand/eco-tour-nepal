const express = require('express');
const db = require('../db'); 
const router = express.Router();

const PLATFORM_FEE_PERCENT = 0.10; // 🤑 10% Platform Commission!

// 1. 💰 Fetch Seller's Wallet Balances
router.get('/balance/:userId', (req, res) => {
    db.query('SELECT wallet_pending, wallet_available FROM users WHERE id = ?', [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results[0]);
    });
});

// 2. 🛡️ Fetch items the Buyer has in Escrow (Needs to be released)
router.get('/escrow-purchases/:userId', (req, res) => {
    const query = `
        SELECT 'tour' as type, b.id, b.amount, t.title, b.escrow_status, b.created_at 
        FROM bookings b JOIN tours t ON b.tour_id = t.id 
        WHERE b.user_id = ? AND b.escrow_status = 'held'
        UNION ALL
        SELECT 'product' as type, o.id, o.amount, p.title, o.escrow_status, o.created_at 
        FROM orders o JOIN products p ON o.product_id = p.id 
        WHERE o.buyer_id = ? AND o.escrow_status = 'held'
        ORDER BY created_at DESC
    `;
    db.query(query, [req.params.userId, req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 3. 🔓 Release TOUR Funds to Seller (Minus 10% Commission)
router.post('/release-tour/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    db.query('SELECT b.amount, t.guide_id FROM bookings b JOIN tours t ON b.tour_id = t.id WHERE b.id = ? AND b.escrow_status = "held"', [bookingId], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Booking not found.' });
        
        const amount = parseFloat(results[0].amount);
        const guideId = results[0].guide_id;
        const sellerEarnings = amount - (amount * PLATFORM_FEE_PERCENT); // 90% to seller
        
        db.query('UPDATE bookings SET escrow_status = "released" WHERE id = ?',[bookingId]);
        db.query('UPDATE users SET wallet_pending = wallet_pending - ?, wallet_available = wallet_available + ? WHERE id = ?',[amount, sellerEarnings, guideId]);
        res.status(200).json({ message: 'Funds released to guide!' });
    });
});

// 4. 🔓 Release PRODUCT Funds to Seller (Minus 10% Commission)
router.post('/release-product/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    db.query('SELECT o.amount, p.seller_id FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ? AND o.escrow_status = "held"',[orderId], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Order not found.' });
        
        const amount = parseFloat(results[0].amount);
        const sellerId = results[0].seller_id;
        const sellerEarnings = amount - (amount * PLATFORM_FEE_PERCENT); // 90% to seller
        
        db.query('UPDATE orders SET escrow_status = "released", status = "Delivered" WHERE id = ?',[orderId]);
        db.query('UPDATE users SET wallet_pending = wallet_pending - ?, wallet_available = wallet_available + ? WHERE id = ?',[amount, sellerEarnings, sellerId]);
        res.status(200).json({ message: 'Funds released to seller!' });
    });
});

// 5. 🏦 Seller Requests Payout to Bank
router.post('/payout', (req, res) => {
    const { user_id, amount, bank_details } = req.body;
    db.query('SELECT wallet_available FROM users WHERE id = ?', [user_id], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'User not found.' });
        if (amount > parseFloat(results[0].wallet_available)) return res.status(400).json({ message: 'Insufficient funds.' });
        
        db.query('UPDATE users SET wallet_available = wallet_available - ? WHERE id = ?',[amount, user_id]);
        db.query('INSERT INTO payout_requests (user_id, amount, bank_details) VALUES (?, ?, ?)',[user_id, amount, bank_details]);
        res.status(200).json({ message: 'Payout requested successfully!' });
    });
});

// 6. 👑 Admin Fetches All Payout Requests
router.get('/admin/payouts', (req, res) => {
    db.query('SELECT pr.*, u.username, u.email FROM payout_requests pr JOIN users u ON pr.user_id = u.id ORDER BY pr.created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 7. 👑 Admin Marks Payout as Paid
router.put('/admin/payouts/:id/pay', (req, res) => {
    db.query('UPDATE payout_requests SET status = "paid" WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Marked as paid!' });
    });
});

module.exports = router;