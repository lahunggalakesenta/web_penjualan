const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/buy', async (req, res) => {
    try {
        const { product_id, quantity = 1, customer_name = 'Anon' } = req.body;
        const q = parseInt(quantity);

        if (!product_id || q <= 0) return res.status(400).send('Data kurang');

        const [[prod]] = await db.query('SELECT * FROM produk WHERE id=?', [product_id]);
        if (!prod) return res.status(404).send('Produk tidak ditemukan');

        const [[stock]] = await db.query('SELECT * FROM stock WHERE product_id=?', [product_id]);
        const current = stock ? stock.quantity : 0;
        if (current < q) return res.status(400).send('Stok tidak cukup');

        const total = Number(prod.price) * q;

        await db.query(
            'INSERT INTO pembelian (product_id, quantity, total, customer_name, status) VALUES (?,?,?,?,?)',
            [product_id, q, total, customer_name, 'completed']
        );
        await db.query('UPDATE stock SET quantity = quantity - ? WHERE product_id=?', [q, product_id]);

        // simpan pesan sukses di session
        req.session.successMessage = `Pembelian berhasil! Terima kasih, ${customer_name || "Pembeli"}.`;

        // Pastikan session tersimpan sebelum redirect
        req.session.save(err => {
            if (err) {
                console.error('Gagal menyimpan session:', err);
            }
            res.redirect('/');
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('DB error');
    }
});

module.exports = router;
