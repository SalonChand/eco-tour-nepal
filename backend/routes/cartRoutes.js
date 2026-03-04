const express = require('express');
const db = require('../db'); 
const router = express.Router();

// 🛒 POST: Sync the cart to the database silently
router.post('/sync', (req, res) => {
    const { user_id, cart_data } = req.body;
    
    // Convert cart array to JSON string
    const cartString = JSON.stringify(cart_data);

    // If cart is empty, delete it from DB so we don't email them!
    if (!cart_data || cart_data.length === 0) {
        db.query('DELETE FROM saved_carts WHERE user_id = ?', [user_id]);
        return res.status(200).json({ message: 'Cart cleared from DB' });
    }

    // Insert or Update the user's saved cart, and reset email_sent to FALSE
    const query = `
        INSERT INTO saved_carts (user_id, cart_data, email_sent) 
        VALUES (?, ?, FALSE) 
        ON DUPLICATE KEY UPDATE cart_data = ?, email_sent = FALSE, last_updated = CURRENT_TIMESTAMP
    `;
    
    db.query(query, [user_id, cartString, cartString], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Cart synced to database successfully!' });
    });
});

module.exports = router;