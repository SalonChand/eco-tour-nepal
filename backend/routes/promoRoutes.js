const express = require('express');
const db = require('../db'); 
const router = express.Router();

// 🎟️ POST: Validate a Promo Code
router.post('/validate', (req, res) => {
    const { code } = req.body;

    db.query('SELECT * FROM promo_codes WHERE code = ?', [code], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        
        if (results.length === 0) {
            return res.status(404).json({ message: 'Invalid promo code.' });
        }

        const promo = results[0];

        // 🛡️ SECURITY: Check if the code is maxed out!
        if (promo.current_uses >= promo.max_uses) {
            return res.status(400).json({ message: 'This promo code has reached its usage limit and is expired!' });
        }

        // Send the discount back to React
        res.status(200).json({ 
            discount_percent: promo.discount_percent, 
            message: `${promo.discount_percent}% Discount Applied!` 
        });
    });
});

module.exports = router;