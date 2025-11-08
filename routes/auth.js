// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// show login
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// process login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (!rows.length) return res.render('login', { error: 'User tidak ditemukan' });
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.render('login', { error: 'Password salah' });
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.redirect('/admin/produk');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Terjadi kesalahan' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
