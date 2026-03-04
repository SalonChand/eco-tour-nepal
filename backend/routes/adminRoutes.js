const express = require('express');
const db = require('../db'); 

const router = express.Router();

router.get('/stats', (req, res) => {
    const stats = {};
    db.query('SELECT COUNT(*) as totalUsers FROM users', (err, userRes) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalUsers = userRes[0].totalUsers;

        db.query('SELECT COUNT(*) as totalTours FROM tours', (err, tourRes) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.totalTours = tourRes[0].totalTours;

            db.query('SELECT COUNT(*) as totalProducts FROM products', (err, prodRes) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalProducts = prodRes[0].totalProducts;

                db.query('SELECT SUM(amount) as tourRevenue FROM bookings WHERE status = "COMPLETE"', (err, revRes) => {
                    const tourRev = revRes[0].tourRevenue || 0;
                    db.query('SELECT SUM(amount) as shopRevenue FROM orders WHERE status = "COMPLETE"', (err, shopRes) => {
                        const shopRev = shopRes[0].shopRevenue || 0;
                        stats.totalRevenue = parseFloat(tourRev) + parseFloat(shopRev);
                        res.status(200).json(stats);
                    });
                });
            });
        });
    });
});

router.get('/notifications', (req, res) => {
    const query = `
        SELECT 'booking' as type, b.amount, b.created_at, u.username 
        FROM bookings b JOIN users u ON b.user_id = u.id 
        UNION ALL 
        SELECT 'order' as type, o.amount, o.created_at, u.username 
        FROM orders o JOIN users u ON o.buyer_id = u.id 
        ORDER BY created_at DESC LIMIT 5
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 🧠 FIX: Now fetching 'is_verified' from the database!
router.get('/users', (req, res) => {
    db.query('SELECT id, username, email, role, is_verified, created_at FROM users ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

router.get('/tours', (req, res) => {
    db.query('SELECT t.*, u.username as guide_name FROM tours t JOIN users u ON t.guide_id = u.id ORDER BY t.created_at DESC', (err, results) => res.status(200).json(results));
});

router.get('/products', (req, res) => {
    db.query('SELECT p.*, u.username as seller_name FROM products p JOIN users u ON p.seller_id = u.id ORDER BY p.created_at DESC', (err, results) => res.status(200).json(results));
});

router.delete('/:type/:id', (req, res) => {
    const { type, id } = req.params;
    let table = type === 'user' ? 'users' : type === 'tour' ? 'tours' : type === 'product' ? 'products' : '';
    db.query(`DELETE FROM ${table} WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Deleted successfully!" });
    });
});

module.exports = router;