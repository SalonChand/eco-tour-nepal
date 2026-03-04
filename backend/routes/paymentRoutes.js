const express = require('express');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const db = require('../db'); 

const router = express.Router();
const ESEWA_SECRET_KEY = '8gBm/:&EnhH.1/q'; 
const ESEWA_PRODUCT_CODE = 'EPAYTEST';

const addPendingFunds = (userId, amount) => {
    db.query('UPDATE users SET wallet_pending = wallet_pending + ? WHERE id = ?', [amount, userId], (err) => {
        if(err) console.error("Failed to update wallet:", err);
    });
};

// 🎟️ HELPER: Burn a promo code usage when an order is completed!
const burnPromoCode = (promoCode) => {
    if (promoCode && promoCode.trim() !== '') {
        db.query('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = ?', [promoCode.toUpperCase()], (err) => {
            if(err) console.error("Failed to burn promo code:", err);
            else console.log(`🔥 Promo code ${promoCode} burned successfully!`);
        });
    }
};

// ========================================
// 🏔️ TOUR PAYMENT ROUTES
// ========================================
router.post('/esewa', (req, res) => {
    const amount = String(req.body.amount); 
    const transaction_uuid = `${req.body.productId}-${uuidv4()}`; 
    const signatureString = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const hash = CryptoJS.HmacSHA256(signatureString, ESEWA_SECRET_KEY);
    res.status(200).json({
        signature: CryptoJS.enc.Base64.stringify(hash), signed_field_names: 'total_amount,transaction_uuid,product_code', transaction_uuid, product_code: ESEWA_PRODUCT_CODE, amount, tax_amount: 0, total_amount: amount, product_service_charge: 0, product_delivery_charge: 0, success_url: 'http://localhost:5173/payment-success', failure_url: 'http://localhost:5173/payment-failure',
    });
});

router.post('/save-booking', (req, res) => {
    // 🧠 NOTICE: We now accept `promo_code` from React!
    const { user_id, transaction_uuid, amount_paid, total_amount, payment_type, status, full_name, phone, address, travelers, booking_date, looking_for_buddy, promo_code } = req.body;
    if (status !== 'COMPLETE') return res.status(400).json({ message: 'Payment not completed' });
    const tour_id = transaction_uuid.split('-')[0];
    const insertQuery = `INSERT INTO bookings (user_id, tour_id, amount, amount_paid, payment_type, transaction_id, status, full_name, phone, address, travelers, booking_date, looking_for_buddy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(insertQuery,[user_id, tour_id, total_amount, amount_paid, payment_type, transaction_uuid, status, full_name || 'N/A', phone || 'N/A', address || 'N/A', travelers || 1, booking_date || null, looking_for_buddy || false], (err) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        db.query('SELECT guide_id FROM tours WHERE id = ?', [tour_id], (err, results) => {
            if (!err && results.length > 0) addPendingFunds(results[0].guide_id, parseFloat(amount_paid));
            
            db.query('SELECT referred_by FROM users WHERE id = ?', [user_id], (err, userRes) => {
                if (!err && userRes.length > 0 && userRes[0].referred_by) {
                    const referrerUsername = userRes[0].referred_by;
                    const affiliateBonus = parseFloat(amount_paid) * 0.05; 
                    db.query('UPDATE users SET wallet_available = wallet_available + ? WHERE username = ?', [affiliateBonus, referrerUsername]);
                }
            });
        });
        
        // 🔥 BURN THE PROMO CODE NOW THAT PAYMENT IS SUCCESSFUL!
        burnPromoCode(promo_code);

        res.status(201).json({ message: '🎟️ Booking saved!' });
    });
});

// ========================================
// 💳 BNPL BALANCE PAYMENT
// ========================================
router.post('/esewa-balance', (req, res) => {
    const amount = String(req.body.amount); 
    const transaction_uuid = `BAL-${req.body.bookingId}-${uuidv4()}`; 
    const signatureString = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const hash = CryptoJS.HmacSHA256(signatureString, ESEWA_SECRET_KEY);
    res.status(200).json({
        signature: CryptoJS.enc.Base64.stringify(hash), signed_field_names: 'total_amount,transaction_uuid,product_code', transaction_uuid, product_code: ESEWA_PRODUCT_CODE, amount, tax_amount: 0, total_amount: amount, product_service_charge: 0, product_delivery_charge: 0, success_url: 'http://localhost:5173/payment-success', failure_url: 'http://localhost:5173/payment-failure',
    });
});

router.post('/pay-balance', (req, res) => {
    const { transaction_uuid, amount_paid, status, user_id } = req.body;
    if (status !== 'COMPLETE') return res.status(400).json({ message: 'Payment not completed' });
    const booking_id = transaction_uuid.split('-')[1]; 
    
    db.query('UPDATE bookings SET amount_paid = amount_paid + ?, payment_type = "full" WHERE id = ? AND user_id = ?',[amount_paid, booking_id, user_id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        db.query('SELECT t.guide_id FROM bookings b JOIN tours t ON b.tour_id = t.id WHERE b.id = ?',[booking_id], (err, results) => {
            if (!err && results.length > 0) addPendingFunds(results[0].guide_id, parseFloat(amount_paid));
        });
        res.status(200).json({ message: 'Balance paid successfully!' });
    });
});

// ========================================
// 🛍️ SHOP & CART ROUTES
// ========================================
router.post('/esewa-product', (req, res) => {
    const amount = String(req.body.amount); 
    const transaction_uuid = `PROD-${req.body.productId}-${uuidv4()}`; 
    const signatureString = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const hash = CryptoJS.HmacSHA256(signatureString, ESEWA_SECRET_KEY);
    res.status(200).json({
        signature: CryptoJS.enc.Base64.stringify(hash), signed_field_names: 'total_amount,transaction_uuid,product_code', transaction_uuid, product_code: ESEWA_PRODUCT_CODE, amount, tax_amount: 0, total_amount: amount, product_service_charge: 0, product_delivery_charge: 0, success_url: 'http://localhost:5173/payment-success', failure_url: 'http://localhost:5173/payment-failure',
    });
});

router.post('/save-order', (req, res) => {
    const { user_id, transaction_uuid, amount, status, full_name, phone, address, promo_code } = req.body;
    if (status !== 'COMPLETE') return res.status(400).json({ message: 'Payment not completed' });
    const product_id = transaction_uuid.split('-')[1];
    db.query(`INSERT INTO orders (buyer_id, product_id, amount, transaction_id, status, full_name, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[user_id, product_id, amount, transaction_uuid, status, full_name||'N/A', phone||'N/A', address||'N/A'], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        db.query('SELECT seller_id FROM products WHERE id = ?',[product_id], (err, results) => {
            if (!err && results.length > 0) addPendingFunds(results[0].seller_id, parseFloat(amount));
        });
        
        // 🔥 BURN PROMO CODE
        burnPromoCode(promo_code);

        res.status(201).json({ message: '🛍️ Order saved!' });
    });
});

router.post('/esewa-cart', (req, res) => {
    const amount = String(req.body.amount); 
    const transaction_uuid = `CART-${uuidv4()}`; 
    const signatureString = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const hash = CryptoJS.HmacSHA256(signatureString, ESEWA_SECRET_KEY);
    res.status(200).json({
        signature: CryptoJS.enc.Base64.stringify(hash), signed_field_names: 'total_amount,transaction_uuid,product_code', transaction_uuid, product_code: ESEWA_PRODUCT_CODE, amount, tax_amount: 0, total_amount: amount, product_service_charge: 0, product_delivery_charge: 0, success_url: 'http://localhost:5173/payment-success', failure_url: 'http://localhost:5173/payment-failure',
    });
});

router.post('/save-cart', (req, res) => {
    const { user_id, transaction_uuid, status, full_name, phone, address, cart_items, promo_code } = req.body;
    if (status !== 'COMPLETE') return res.status(400).json({ message: 'Payment not completed' });
    const values = cart_items.map(item =>[user_id, item.id, item.price * item.quantity, transaction_uuid, status, full_name||'N/A', phone||'N/A', address||'N/A']);
    db.query(`INSERT INTO orders (buyer_id, product_id, amount, transaction_id, status, full_name, phone, address) VALUES ?`,[values], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        cart_items.forEach(item => addPendingFunds(item.seller_id, parseFloat(item.price * item.quantity)));
        
        // 🔥 BURN PROMO CODE
        burnPromoCode(promo_code);

        res.status(201).json({ message: '🛒 Bulk Cart saved!' });
    });
});

module.exports = router;