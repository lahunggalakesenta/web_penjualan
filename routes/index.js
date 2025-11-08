const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    try {
        const [produk] = await db.query(
            'SELECT p.*, IFNULL(s.quantity,0) as quantity FROM produk p LEFT JOIN stock s ON p.id = s.product_id'
        );

        // Ambil successMessage dari session sebelum dihapus
        const successMessage = req.session.successMessage || '';
        delete req.session.successMessage;

        res.render('index', { produk, successMessage });
    } catch (err) {
        console.error(err);
        res.status(500).send('DB error');
    }
});

router.get('/product/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [[p]] = await db.query(
            'SELECT p.*, IFNULL(s.quantity,0) as quantity FROM produk p LEFT JOIN stock s ON p.id = s.product_id WHERE p.id = ?',
            [id]
        );
        if (!p) return res.status(404).send('Produk tidak ditemukan');
        res.render('product_detail', { p });
    } catch (err) {
        console.error(err);
        res.status(500).send('DB error');
    }
});

module.exports = router;
