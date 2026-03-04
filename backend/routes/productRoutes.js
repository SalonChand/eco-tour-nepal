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
    filename: (req, file, cb) => cb(null, 'prod_' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    const query = `SELECT p.*, u.username as seller_name FROM products p JOIN users u ON p.seller_id = u.id ORDER BY p.created_at DESC`; 
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch products' });
        res.status(200).json(results);
    });
});

// 📍 UPGRADED: Now accepts 'region'
router.post('/add', upload.single('image'), (req, res) => {
    const { seller_id, title, description, price, category, region, stock_quantity } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const insertQuery = `INSERT INTO products (seller_id, title, description, price, category, region, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(insertQuery,[seller_id, title, description, price, category || 'Local Craft', region || 'Kathmandu Valley', stock_quantity || 1, image_url], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '🛍️ Local product added successfully!' });
    });
});

router.get('/:id', (req, res) => {
    db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => res.status(200).json(results.length ? results[0] : {}));
});

router.get('/user/:userId', (req, res) => {
    db.query('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC', [req.params.userId], (err, results) => res.status(200).json(results));
});

router.get('/ordered/:userId', (req, res) => {
    const query = `SELECT o.id as order_id, o.amount, o.transaction_id, o.status, p.id as product_id, p.title, p.category, p.image_url FROM orders o JOIN products p ON o.product_id = p.id WHERE o.buyer_id = ? ORDER BY o.created_at DESC`;
    db.query(query, [req.params.userId], (err, results) => res.status(200).json(results));
});

router.get('/sales/:sellerId', (req, res) => {
    const query = `SELECT o.id, o.amount, o.transaction_id, o.created_at, o.status, o.full_name as shipping_name, o.phone, o.address, p.title, u.username as buyer_name, u.email as buyer_email FROM orders o JOIN products p ON o.product_id = p.id JOIN users u ON o.buyer_id = u.id WHERE p.seller_id = ? ORDER BY o.created_at DESC`;
    db.query(query, [req.params.sellerId], (err, results) => res.status(200).json(results));
});

router.put('/update-status/:orderId', (req, res) => {
    const { status } = req.body;
    const orderId = req.params.orderId;

    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        
        db.query('SELECT o.buyer_id, p.title FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?',[orderId], (err, results) => {
            if (!err && results.length > 0) {
                const msg = `Your order for "${results[0].title}" is now: ${status}`;
                db.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [results[0].buyer_id, '🚚 Shipping Update', msg]);
            }
        });
        res.status(200).json({ message: 'Status updated successfully!' });
    });
});

module.exports = router;