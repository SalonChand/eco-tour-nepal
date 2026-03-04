const express = require('express');
const db = require('../db'); 
const router = express.Router();

// GET: Fetch user notifications
router.get('/:userId', (req, res) => {
    db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// PUT: Mark all notifications as read
router.put('/read/:userId', (req, res) => {
    db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.params.userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Marked as read' });
    });
});

module.exports = router;