const express = require('express');
const db = require('../db'); 

const router = express.Router();

// GET: Fetch chat history for a specific user's support ticket
router.get('/:userId', (req, res) => {
    db.query('SELECT * FROM helpdesk_messages WHERE user_id = ? ORDER BY created_at ASC', [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 👑 ADMIN GET: Fetch a list of all users who have contacted support
router.get('/admin/active-chats', (req, res) => {
    const query = `
        SELECT DISTINCT u.id as user_id, u.username, u.profile_pic, 
        (SELECT text FROM helpdesk_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM helpdesk_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_time
        FROM helpdesk_messages hm
        JOIN users u ON hm.user_id = u.id
        ORDER BY last_time DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

module.exports = router;