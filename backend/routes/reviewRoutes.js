const express = require('express');
const db = require('../db'); 
const router = express.Router();

// ==========================================
// 🏔️ TOUR REVIEWS (Hype Meter)
// ==========================================
router.post('/tour', (req, res) => {
    const { tour_id, user_id, hype_level, comment } = req.body;
    const query = `INSERT INTO tour_reviews (tour_id, user_id, hype_level, comment) VALUES (?, ?, ?, ?)`;
    db.query(query,[tour_id, user_id, hype_level, comment], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Tour review published successfully!' });
    });
});

router.get('/tour/:tourId', (req, res) => {
    const tourId = req.params.tourId;
    const query = `SELECT r.*, u.username, u.profile_pic, u.is_verified FROM tour_reviews r JOIN users u ON r.user_id = u.id WHERE r.tour_id = ? ORDER BY r.created_at DESC`;

    db.query(query, [tourId], (err, reviews) => {
        if (err) return res.status(500).json({ error: err.message });

        let underrated = 0, worthIt = 0, overrated = 0;
        reviews.forEach(r => {
            if (r.hype_level === 'underrated') underrated++;
            if (r.hype_level === 'worth_it') worthIt++;
            if (r.hype_level === 'overrated') overrated++;
        });

        const totalVotes = reviews.length;
        let consensus = 'New Tour';
        if (totalVotes > 0) {
            const maxVotes = Math.max(underrated, worthIt, overrated);
            if (maxVotes === underrated) consensus = 'Underrated';
            else if (maxVotes === overrated) consensus = 'Overrated';
            else consensus = 'Worth It';
        }

        res.status(200).json({ consensus, totalVotes, counts: { underrated, worthIt, overrated }, reviews });
    });
});

// ==========================================
// 🛍️ PRODUCT REVIEWS (Hype Meter)
// ==========================================
router.post('/product', (req, res) => {
    const { product_id, user_id, hype_level, comment } = req.body;
    const query = `INSERT INTO product_reviews (product_id, user_id, hype_level, comment) VALUES (?, ?, ?, ?)`;
    db.query(query,[product_id, user_id, hype_level, comment], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product review published successfully!' });
    });
});

router.get('/product/:productId', (req, res) => {
    const productId = req.params.productId;
    const query = `SELECT r.*, u.username, u.profile_pic, u.is_verified FROM product_reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`;

    db.query(query, [productId], (err, reviews) => {
        if (err) return res.status(500).json({ error: err.message });

        let underrated = 0, worthIt = 0, overrated = 0;
        reviews.forEach(r => {
            if (r.hype_level === 'underrated') underrated++;
            if (r.hype_level === 'worth_it') worthIt++;
            if (r.hype_level === 'overrated') overrated++;
        });

        const totalVotes = reviews.length;
        let consensus = 'New Product';
        if (totalVotes > 0) {
            const maxVotes = Math.max(underrated, worthIt, overrated);
            if (maxVotes === underrated) consensus = 'Underrated';
            else if (maxVotes === overrated) consensus = 'Overrated';
            else consensus = 'Worth It';
        }

        res.status(200).json({ consensus, totalVotes, counts: { underrated, worthIt, overrated }, reviews });
    });
});

// ==========================================
// 🧑‍🌾 SELLER REVIEWS (5-Star Rating)
// ==========================================
router.post('/seller', (req, res) => {
    const { seller_id, reviewer_id, rating, comment } = req.body;
    
    // 1. Insert the review
    const insertQuery = `INSERT INTO seller_reviews (seller_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)`;
    db.query(insertQuery,[seller_id, reviewer_id, rating, comment], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // 2. Automatically recalculate the Seller's Average Rating!
        const calcQuery = `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews FROM seller_reviews WHERE seller_id = ?`;
        db.query(calcQuery, [seller_id], (err, calcRes) => {
            if (!err && calcRes.length > 0) {
                const newAvg = calcRes[0].avgRating || 0;
                const newTotal = calcRes[0].totalReviews || 0;
                
                // 3. Save the new average directly to the users table
                db.query('UPDATE users SET avg_rating = ?, total_reviews = ? WHERE id = ?', [newAvg, newTotal, seller_id]);
            }
        });

        res.status(201).json({ message: 'Seller review published! Thank you.' });
    });
});

router.get('/seller/:sellerId', (req, res) => {
    const sellerId = req.params.sellerId;
    const query = `
        SELECT sr.*, u.username as reviewer_name, u.profile_pic, u.is_verified 
        FROM seller_reviews sr 
        JOIN users u ON sr.reviewer_id = u.id 
        WHERE sr.seller_id = ? 
        ORDER BY sr.created_at DESC
    `;
    db.query(query, [sellerId], (err, reviews) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(reviews);
    });
});

module.exports = router;