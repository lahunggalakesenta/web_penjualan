const express = require("express");

module.exports = (db) => {
    const router = express.Router();

    // ====== Proses Checkout ======
    router.post("/checkout", (req, res) => {
        const { produk_id, user_id, jumlah, metode } = req.body;

        db.query("SELECT harga FROM produk WHERE id = ?", [produk_id], (err, results) => {
            if (err || results.length === 0) return res.status(500).send("Produk tidak ditemukan");

            const harga = results[0].harga;
            const total = harga * jumlah;
            const batasWaktu = new Date(Date.now() + 30 * 60 * 1000); // +30 menit

            const data = {
                produk_id,
                user_id,
                jumlah,
                total,
                metode,
                batas_waktu: batasWaktu,
                status: "pending",
            };

            db.query("INSERT INTO transaksi SET ?", data, (err, result) => {
                if (err) throw err;
                res.redirect(`/pembayaran/${result.insertId}`);
            });
        });
    });

    // ====== Halaman Pembayaran ======
    router.get("/:id", (req, res) => {
        const id = req.params.id;
        db.query(
            "SELECT t.*, p.nama AS nama_produk FROM transaksi t JOIN produk p ON t.produk_id = p.id WHERE t.id = ?",
            [id],
            (err, results) => {
                if (err || results.length === 0) return res.status(404).send("Transaksi tidak ditemukan");

                const transaksi = results[0];
                const sisaWaktu = new Date(transaksi.batas_waktu) - new Date();

                if (sisaWaktu <= 0 && transaksi.status === "pending") {
                    db.query("UPDATE transaksi SET status='expired' WHERE id=?", [id]);
                    transaksi.status = "expired";
                }

                res.render("pembayaran", { transaksi });
            }
        );
    });

    // ====== Konfirmasi Pembayaran ======
    router.post("/konfirmasi/:id", (req, res) => {
        const id = req.params.id;
        db.query("UPDATE transaksi SET status='berhasil' WHERE id=?", [id], (err) => {
            if (err) throw err;
            // Kurangi stok produk
            db.query(
                "UPDATE produk p JOIN transaksi t ON p.id = t.produk_id SET p.stok = p.stok - t.jumlah WHERE t.id = ?",
                [id]
            );
            res.redirect(`/pembayaran/${id}`);
        });
    });

    return router;
};
