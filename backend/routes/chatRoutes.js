const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db'); 

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'chat_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    res.status(200).json({ image_url: `/uploads/chat/${req.file.filename}` });
});

// GET: Community Chat History
router.get('/', (req, res) => {
    const query = `
        SELECT m.*, u.profile_pic, u.is_verified, u.id as user_id
        FROM messages m
        LEFT JOIN users u ON m.author = u.username
        ORDER BY m.created_at ASC LIMIT 100
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch chat history' });
        res.status(200).json(results);
    });
});

// 🔒 GET: Private Chat History
router.get('/private/:roomId', (req, res) => {
    console.log(`👉 Fetching Private History for room: ${req.params.roomId}`);
    const query = `
        SELECT pm.*, u.username as sender_name, u.profile_pic as sender_pic, u.is_verified
        FROM private_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE pm.room_id = ?
        ORDER BY pm.created_at ASC
    `;
    db.query(query, [req.params.roomId], (err, results) => {
        if (err) {
            console.error("❌ Private History Fetch Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// 📬 GET: User's Inbox
router.get('/inbox/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT DISTINCT 
            u.id as contact_id, 
            u.username as contact_name, 
            u.profile_pic as contact_pic, 
            u.role as contact_role,
            u.is_verified
        FROM private_messages pm
        JOIN users u ON (u.id = pm.sender_id OR u.id = pm.receiver_id) AND u.id != ?
        WHERE pm.sender_id = ? OR pm.receiver_id = ?
    `;
    db.query(query, [userId, userId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

module.exports = router;