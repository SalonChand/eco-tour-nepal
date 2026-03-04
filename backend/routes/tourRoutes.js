const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db'); 

const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    db.query('SELECT * FROM tours ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch tours' });
        return res.status(200).json(results);
    });
});

router.get('/:id', (req, res) => {
    const query = `
        SELECT t.*, maker.username as maker_name, maker.bio as maker_bio, guide.username as assigned_guide_name, guide.bio as assigned_guide_bio
        FROM tours t 
        JOIN users maker ON t.guide_id = maker.id 
        LEFT JOIN users guide ON t.assigned_guide_id = guide.id
        WHERE t.id = ?
    `;
    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch tour' });
        if (results.length === 0) return res.status(404).json({ message: 'Tour not found!' });
        return res.status(200).json(results[0]);
    });
});

// 📍 UPGRADED: Now accepts 'region'
router.post('/add', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'guide_photo', maxCount: 1 }]), (req, res) => {
    const { guide_id, assigned_guide_id, title, description, price, duration_days, difficulty, location, region, guide_name, guide_email, guide_contact, latitude, longitude } = req.body;
    
    const image_url = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
    const guide_photo_url = req.files && req.files['guide_photo'] ? `/uploads/${req.files['guide_photo'][0].filename}` : null;
    
    const insertQuery = `INSERT INTO tours (guide_id, assigned_guide_id, title, description, price, duration_days, difficulty, location, region, image_url, guide_name, guide_email, guide_contact, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(insertQuery,[guide_id, assigned_guide_id || null, title, description, price, duration_days, difficulty || 'Moderate', location, region || 'Kathmandu Valley', image_url, guide_name || null, guide_email || null, guide_contact || null, latitude || 28.3949, longitude || 84.1240], (err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        return res.status(201).json({ message: '🏔️ Tour created successfully!' });
    });
});

router.get('/user/:id', (req, res) => {
    db.query('SELECT * FROM tours WHERE guide_id = ? ORDER BY created_at DESC',[req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.status(200).json(results);
    });
});

router.get('/booked/:userId', (req, res) => {
    const query = `SELECT b.id as booking_id, b.amount, b.amount_paid, b.payment_type, b.transaction_id, b.trek_status, b.full_name, b.travelers, b.booking_date, b.created_at, t.id as tour_id, t.title, t.location, t.image_url FROM bookings b JOIN tours t ON b.tour_id = t.id WHERE b.user_id = ? ORDER BY b.created_at DESC`;
    db.query(query, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.status(200).json(results);
    });
});

router.get('/sales/:guideId', (req, res) => {
    const query = `SELECT b.id, b.amount, b.transaction_id, b.created_at, b.full_name, b.phone, b.booking_date, b.trek_status, b.payment_type, t.title, u.username as buyer_name, u.email as buyer_email FROM bookings b JOIN tours t ON b.tour_id = t.id JOIN users u ON b.user_id = u.id WHERE t.guide_id = ? ORDER BY b.created_at DESC`;
    db.query(query, [req.params.guideId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.status(200).json(results);
    });
});

router.get('/buddies/:tourId/:date', (req, res) => {
    const query = `SELECT u.id as user_id, u.username, u.profile_pic, u.is_verified FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.tour_id = ? AND b.booking_date = ? AND b.looking_for_buddy = TRUE AND b.status = 'COMPLETE'`;
    db.query(query,[req.params.tourId, req.params.date], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.status(200).json(results);
    });
});

router.get('/booked-dates/:tourId', (req, res) => {
    db.query('SELECT booking_date FROM bookings WHERE tour_id = ? AND status = "COMPLETE"', [req.params.tourId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const dates = results.map(r => r.booking_date ? new Date(r.booking_date).toISOString().split('T')[0] : null).filter(d => d);
        return res.status(200).json(dates);
    });
});

router.post('/check-in', (req, res) => {
    const { transaction_uuid, guide_id } = req.body;
    const query = `SELECT b.id, b.trek_status, t.title FROM bookings b JOIN tours t ON b.tour_id = t.id WHERE b.transaction_id = ? AND t.guide_id = ?`;
    db.query(query,[transaction_uuid, guide_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Invalid Ticket or Unauthorized Guide!' });
        if (results[0].trek_status !== 'pending') return res.status(400).json({ message: `Trek is already marked as ${results[0].trek_status}.` });
        db.query('UPDATE bookings SET trek_status = "in_progress" WHERE transaction_id = ?',[transaction_uuid], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: `✅ Check-in successful! Enjoy the ${results[0].title} trek!` });
        });
    });
});

module.exports = router;