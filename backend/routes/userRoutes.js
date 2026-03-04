const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db'); 

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'profile_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.get('/guides/list', (req, res) => {
    db.query('SELECT id, username FROM users WHERE role = "guide" OR role = "admin" ORDER BY username ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

router.get('/:id', (req, res) => {
    const userId = req.params.id;
    // 🧠 UPGRADED: Fetch the new region, team_type, and team_size
    db.query('SELECT id, username, email, role, bio, profile_pic, phone, address, is_verified, created_at, region, team_type, team_size FROM users WHERE id = ?', [userId], (err, userRes) => {
        if (err) return res.status(500).json({ error: err.message });
        if (userRes.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const userProfile = userRes[0];
        db.query('SELECT * FROM tours WHERE guide_id = ? ORDER BY created_at DESC', [userId], (err, toursRes) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC', [userId], (err, productsRes) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({ user: userProfile, tours: toursRes, products: productsRes });
            });
        });
    });
});

// 🛠️ UPGRADED: Profile Updater now accepts Region and Team data!
router.put('/update/:id', upload.single('profile_pic'), (req, res) => {
    const userId = req.params.id;
    const { username, bio, phone, address, region, team_type, team_size } = req.body;
    
    let updateQuery = 'UPDATE users SET username = ?, bio = ?, phone = ?, address = ?, region = ?, team_type = ?, team_size = ?';
    let params =[username, bio, phone, address, region || 'Not Specified', team_type || 'solo', team_size || 1];

    if (req.file) {
        updateQuery += ', profile_pic = ?';
        params.push(`/uploads/profiles/${req.file.filename}`);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(userId);

    db.query(updateQuery, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query('SELECT id, username, email, role, bio, profile_pic, phone, address, is_verified, region, team_type, team_size FROM users WHERE id = ?', [userId], (err, userRes) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Profile updated successfully!', user: userRes[0] });
        });
    });
});

// 🤝 NEW: Fetch all Sellers in a specific Region for the Collaboration Directory
router.get('/region/:regionName', (req, res) => {
    const region = req.params.regionName;
    db.query('SELECT id, username, profile_pic, role, team_type, team_size, is_verified, phone, email FROM users WHERE region = ? AND (role = "guide" OR role = "admin")', [region], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

module.exports = router;