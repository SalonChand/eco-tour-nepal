const express = require('express');
const db = require('../db'); 

const router = express.Router();

// POST: Toggle Wishlist Item
router.post('/toggle', (req, res) => {
    // 🧠 NEW: We now accept the item_name from React!
    const { user_id, tour_id, product_id, item_name } = req.body;
    
    let checkQuery = 'SELECT * FROM wishlist WHERE user_id = ? AND ';
    let params = [user_id];

    if (tour_id) { 
        checkQuery += 'tour_id = ?'; params.push(tour_id); 
    } else if (product_id) { 
        checkQuery += 'product_id = ?'; params.push(product_id); 
    } else {
        return res.status(400).json({ message: 'Item ID required' });
    }

    db.query(checkQuery, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            // REMOVE IT
            db.query('DELETE FROM wishlist WHERE id = ?', [results[0].id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({ message: 'Removed from wishlist', isHearted: false });
            });
        } else {
            // 🧠 NEW: ADD IT (Now saving the item_name into MySQL)
            let insertQuery = 'INSERT INTO wishlist (user_id, tour_id, product_id, item_name) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [user_id, tour_id || null, product_id || null, item_name], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({ message: 'Added to wishlist', isHearted: true });
            });
        }
    });
});

// GET: Fetch all wishlist items
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT w.id as wishlist_id, w.tour_id, w.product_id, w.item_name,
               t.title as tour_title, t.price as tour_price, t.image_url as tour_image,
               p.title as product_title, p.price as product_price, p.image_url as product_image
        FROM wishlist w
        LEFT JOIN tours t ON w.tour_id = t.id
        LEFT JOIN products p ON w.product_id = p.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

module.exports = router;