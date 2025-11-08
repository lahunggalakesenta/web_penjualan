CREATE DATABASE IF NOT EXISTS xionco_db;
USE xionco_db;

-- users (admin)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- produk
CREATE TABLE IF NOT EXISTS produk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- stock (one-to-one product -> stock)
CREATE TABLE IF NOT EXISTS stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES produk(id) ON DELETE CASCADE
);

-- purchases
CREATE TABLE IF NOT EXISTS pembelian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  quantity INT NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  customer_name VARCHAR(255),
  status ENUM('pending','completed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES produk(id) ON DELETE SET NULL
);

-- seed 10 produk
INSERT INTO produk (nama, description, price, image) VALUES
('Kursi Retro', 'Kursi nyaman model retro', 250000.00, 'kursi.jpg'),
('Kursi Kantor', 'Kursi ergonomis kantor', 450000.00, 'kursi_kantor.jpg'),
('Meja Kayu', 'Meja kayu solid', 350000.00, 'meja.jpg'),
('Lemari 2 Pintu', 'Lemari pakaian 2 pintu', 650000.00, 'lemari.jpg'),
('Rak Buku', 'Rak buku 4 tingkat', 200000.00, 'rak.jpg'),
('Lampu Meja', 'Lampu belajar LED', 75000.00, 'lampu.jpg'),
('Sofa 2-seater', 'Sofa empuk 2 tempat duduk', 900000.00, 'sofa.jpg'),
('Kursi Makan', 'Set kursi makan', 300000.00, 'kursi_makan.jpg'),
('Meja Kopi', 'Meja kopi minimalis', 180000.00, 'meja_kopi.jpg'),
('Karpet Ruang', 'Karpet motif modern', 220000.00, 'karpet.jpg');

-- seed stock: 10 each
INSERT INTO stock (product_id, quantity)
SELECT id, 10 FROM produk;

-- sample admin user (password: admin123) -> hashed value will be created below via Node or you can replace with bcrypt hash
-- To create hashed password use node snippet: bcrypt.hash('admin123',10).then(h => console.log(h));
-- Example placeholder (replace with actual bcrypt hash)
INSERT INTO users (username, password, role) VALUES ('admin', '$2b$10$REPLACE_WITH_HASH', 'admin');
