const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); 
const db = require('../db'); 

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'password'
    }
});

// 🚀 UPGRADED: Register now captures the "referred_by" username!
router.post('/register', async (req, res) => {
    const { username, email, password, referred_by } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Please provide all fields' });

    db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length > 0) return res.status(400).json({ message: 'Email or Username already exists!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save the user along with who referred them
        db.query('INSERT INTO users (username, email, password, referred_by) VALUES (?, ?, ?, ?)',[username, email, hashedPassword, referred_by || null], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.status(201).json({ message: '🎉 User registered successfully!' });
        });
    });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Invalid email or password' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_backup_key', { expiresIn: '1d' });

        delete user.password; delete user.reset_otp; delete user.reset_otp_expiry;
        res.status(200).json({ message: '🎉 Login successful!', token, user });
    });
});

// Forgot Password Flow (Kept exactly as before)
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'No account found with that email.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 15 * 60000); 

        db.query('UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',[otp, expiry, email], (err) => {
            if (err) return res.status(500).json({ message: 'Failed to save OTP' });
            console.log(`\n======================================`);
            console.log(`🔐 OTP for ${email} is: ${otp}`);
            console.log(`======================================\n`);

            const mailOptions = { from: process.env.EMAIL_USER, to: email, subject: 'Eco Tour Nepal - Password Reset', text: `Your password reset code is: ${otp}.` };
            transporter.sendMail(mailOptions, (error) => {
                res.status(200).json({ message: 'If the email exists, an OTP has been sent. (Check VS Code Terminal!)' });
            });
        });
    });
});

router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    db.query('SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expiry > NOW()', [email, otp], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(400).json({ message: 'Invalid or expired OTP.' });
        res.status(200).json({ message: 'OTP Verified! You can now reset your password.' });
    });
});

router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    db.query('SELECT * FROM users WHERE email = ? AND reset_otp = ? AND reset_otp_expiry > NOW()', [email, otp], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Invalid request.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        db.query('UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?',[hashedPassword, email], (err) => {
            if (err) return res.status(500).json({ message: 'Failed to reset password.' });
            res.status(200).json({ message: 'Password reset successfully! You can now log in.' });
        });
    });
});

module.exports = router;