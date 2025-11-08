require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const mysql = require("mysql2");
const app = express();
const port = process.env.PORT || 3000;

// =====================
// Koneksi Database
// =====================
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "xionco_db",
});
db.connect((err) => {
    if (err) throw err;
    console.log("✅ Koneksi database berhasil");
});

// =====================
// View Engine Setup
// =====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =====================
// Middleware
// =====================
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret123",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 },
    })
);

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// =====================
// ROUTE: Halaman Pembayaran
// =====================
app.get("/pembayaran/:id", (req, res) => {
    const productId = req.params.id;

    db.query("SELECT * FROM produk WHERE id = ?", [productId], (err, results) => {
        if (err) return res.status(500).send("Terjadi kesalahan server.");
        const produk = results[0];
        if (!produk) return res.status(404).send("Produk tidak ditemukan.");

        res.render("pembayaran", { produk });
    });
});

// =====================
// ROUTE: Buat Transaksi
// =====================
app.post("/buat-transaksi", (req, res) => {
    const { produk_id, metode } = req.body;

    db.query("SELECT * FROM produk WHERE id = ?", [produk_id], (err, results) => {
        if (err || results.length === 0) return res.status(400).send("Produk tidak ditemukan.");

        const produk = results[0];
        const total = produk.price;
        const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 menit dari sekarang

        const sql = `
            INSERT INTO pembelian (product_id, quantity, total, status, expired_at)
            VALUES (?, ?, ?, 'pending', ?)
        `;
        db.query(sql, [produk.id, 1, total, expiredAt], (err2, result) => {
            if (err2) {
                console.error(err2);
                return res.status(500).send("Gagal membuat transaksi.");
            }

            const transaksiId = result.insertId;
            res.redirect(`/status-pembayaran/${transaksiId}`);
        });
    });
});

// =====================
// ROUTE: Status Pembayaran
// =====================
app.get("/status-pembayaran/:id", (req, res) => {
    const transaksiId = req.params.id;

    db.query("SELECT p.*, pr.nama, pr.price FROM pembelian p JOIN produk pr ON p.product_id = pr.id WHERE p.id = ?", [transaksiId], (err, results) => {
        if (err) return res.status(500).send("Kesalahan server.");
        if (results.length === 0) return res.status(404).send("Transaksi tidak ditemukan.");

        const transaksi = results[0];
        const now = new Date();

        if (transaksi.status === "pending" && transaksi.expired_at && new Date(transaksi.expired_at) < now) {
            // Ubah status ke expired jika waktu lewat
            db.query("UPDATE pembelian SET status = 'cancelled' WHERE id = ?", [transaksiId]);
            transaksi.status = "cancelled";
        }

        res.render("status-pembayaran", { transaksi });
    });
});

// =====================
// ROUTE: Konfirmasi Pembayaran
// =====================
app.post("/konfirmasi-pembayaran", (req, res) => {
    const { transaksi_id } = req.body;

    db.query("SELECT * FROM pembelian WHERE id = ?", [transaksi_id], (err, results) => {
        if (err || results.length === 0) return res.status(400).send("Transaksi tidak ditemukan.");

        const transaksi = results[0];
        if (transaksi.status !== "pending") {
            return res.send("Pembayaran sudah tidak dapat dikonfirmasi.");
        }

        // Update status transaksi dan kurangi stok
        db.query("UPDATE pembelian SET status = 'completed' WHERE id = ?", [transaksi_id]);
        db.query("UPDATE stock SET quantity = quantity - 1 WHERE product_id = ?", [transaksi.product_id]);

        res.redirect(`/status-pembayaran/${transaksi_id}`);
    });
});

// =====================
// ROUTES LAINNYA
// =====================
app.use("/", require("./routes/index"));
app.use("/produk", require("./routes/produk"));
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/chatbot", require("./routes/chatbot"));

// =====================
// Jalankan Server
// =====================
app.listen(port, () => {
    console.log(`🚀 Xionco berjalan di: http://localhost:${port}`);
});
