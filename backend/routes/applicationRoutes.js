const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db'); 

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/certificates');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, 'cert_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.post('/submit', upload.single('certificate'), (req, res) => {
    const { user_id, full_name, phone, email, dob, nationality, experience_years, pan_number } = req.body;
    const cert_url = req.file ? `/uploads/certificates/${req.file.filename}` : null;
    if(!cert_url) return res.status(400).json({message: "Certificate/ID upload is mandatory!"});

    const query = `INSERT INTO seller_applications (user_id, full_name, phone, email, dob, nationality, experience_years, pan_number, certificate_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [user_id, full_name, phone, email, dob, nationality, experience_years, pan_number, cert_url], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to submit application' });
        res.status(201).json({ message: 'Application submitted successfully!' });
    });
});

// 👑 GET: Admin fetches pending applications
router.get('/pending', (req, res) => {
    db.query('SELECT * FROM seller_applications WHERE status = "pending" ORDER BY created_at ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 📚 NEW: GET: Admin fetches KYC History (Approved & Rejected)
router.get('/history', (req, res) => {
    db.query('SELECT * FROM seller_applications WHERE status != "pending" ORDER BY updated_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// ✅ POST: Admin Approves the Seller
router.post('/approve/:id', (req, res) => {
    const appId = req.params.id;
    const { user_id } = req.body; 
    db.query('UPDATE seller_applications SET status = "approved" WHERE id = ?', [appId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('UPDATE users SET role = "guide", is_verified = TRUE WHERE id = ?', [user_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Seller approved successfully!' });
        });
    });
});

// ❌ POST: Admin Rejects the Seller
router.post('/reject/:id', (req, res) => {
    db.query('UPDATE seller_applications SET status = "rejected" WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Application rejected.' });
    });
});

module.exports = router;