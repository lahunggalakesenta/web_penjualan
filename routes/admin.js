const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '..', 'public', 'images') });

// middleware auth
function ensureAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') return next();
    return res.redirect('/auth/login');
}

// ==========================
// DASHBOARD ADMIN
// ==========================
router.get('/', ensureAdmin, (req, res) => {
    res.render('admin/index', {
        pageTitle: 'Admin Dashboard',
        successMessage: req.session.successMessage || ''
    });
    delete req.session.successMessage;
});

// ==========================
// LIST PRODUK
// ==========================
router.get('/produk', ensureAdmin, async (req, res) => {
    const [rows] = await db.query(`
        SELECT p.*, IFNULL(s.quantity,0) as quantity 
        FROM produk p 
        LEFT JOIN stock s ON p.id=s.product_id 
        ORDER BY p.created_at DESC
    `);
    res.render('admin_products', {
        produk: rows,
        successMessage: req.session.successMessage || ''
    });
    delete req.session.successMessage;
});

router.get('/produk/new', ensureAdmin, (req, res) => res.render('product_form', { produk: null }));

router.post('/produk/create', ensureAdmin, upload.single('image'), async (req, res) => {
    try {
        const { nama, description, price, quantity } = req.body;
        let image = req.file ? req.file.filename : (req.body.image_name || null);
        const [r] = await db.query(
            'INSERT INTO produk (nama, description, price, image) VALUES (?,?,?,?)',
            [nama, description, price || 0, image]
        );
        await db.query('INSERT INTO stock (product_id, quantity) VALUES (?,?)', [r.insertId, quantity || 0]);

        req.session.successMessage = `Produk "${nama}" berhasil dibuat.`;
        req.session.save(() => res.redirect('/admin/produk'));
    } catch (err) {
        console.error(err);
        res.status(500).send('DB error');
    }
});

router.post('/produk/delete/:id', ensureAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await db.query('DELETE FROM produk WHERE id=?', [id]);
        req.session.successMessage = `Produk ID ${id} berhasil dihapus.`;
        req.session.save(() => res.redirect('/admin/produk'));
    } catch (err) {
        console.error(err);
        res.status(500).send('DB error');
    }
});

// ==========================
// LIST PEMBELIAN DENGAN PAGINATION
// ==========================
router.get('/pembelian', ensureAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM pembelian');

    const [rows] = await db.query(`
        SELECT b.*, p.nama as product_name
        FROM pembelian b
        LEFT JOIN produk p ON b.product_id = p.id
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
    `, [limit, offset]);

    const totalPages = Math.ceil(total / limit);

    res.render('admin_purchases', {
        purchases: rows,
        currentPage: page,
        totalPages,
        successMessage: req.session.successMessage || ''
    });

    delete req.session.successMessage;
});

// ==========================
// DETAIL PEMBELIAN DENGAN PREV/NEXT
// ==========================
router.get('/pembelian/:id', ensureAdmin, async (req, res) => {
    const id = parseInt(req.params.id);

    const [allPurchases] = await db.query(`
        SELECT b.*, p.nama as product_name
        FROM pembelian b
        LEFT JOIN produk p ON b.product_id = p.id
        ORDER BY b.created_at DESC
    `);

    const currentIndex = allPurchases.findIndex(p => p.id === id);
    if (currentIndex === -1) return res.status(404).send('Pembelian tidak ditemukan');

    const purchase = allPurchases[currentIndex];

    const prevId = allPurchases[currentIndex + 1]?.id || null; // older
    const nextId = allPurchases[currentIndex - 1]?.id || null; // newer

    // Ambil 5 pembelian terbaru untuk tabel ringkas
    const lastFive = allPurchases.slice(0, 5);

    res.render('admin_purchase_detail', {
        purchase,
        prevId,
        nextId,
        purchases: lastFive,
        successMessage: req.session.successMessage || ''
    });

    delete req.session.successMessage;
});

// ==========================
// CANCEL PEMBELIAN
// ==========================
router.post('/pembelian/cancel/:id', ensureAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const [[p]] = await db.query('SELECT * FROM pembelian WHERE id=?', [id]);
        if (!p || p.status === 'cancelled') return res.redirect('/admin/pembelian');

        await db.query('UPDATE pembelian SET status=? WHERE id=?', ['cancelled', id]);
        await db.query('UPDATE stock SET quantity = quantity + ? WHERE product_id=?', [p.quantity, p.product_id]);

        req.session.successMessage = `Pembelian ID ${id} berhasil dibatalkan.`;
        req.session.save(() => res.redirect('/admin/pembelian'));
    } catch (err) {
        console.error(err);
        res.status(500).send('DB error');
    }
});

module.exports = router;
