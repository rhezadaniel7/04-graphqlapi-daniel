CREATE TABLE IF NOT EXISTS kategori (
    id   SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL
);

-- Kolom relasi (foreign key) di produk
ALTER TABLE produk ADD COLUMN IF NOT EXISTS kategori_id INTEGER REFERENCES kategori(id);

-- Data kategori (id: Minuman=1, Makanan=2)
INSERT INTO kategori (nama) VALUES ('Minuman'), ('Makanan');

-- Hubungkan produk yang sudah ada ke sebuah kategori (sesuaikan sesukamu)
UPDATE produk SET kategori_id = 1 WHERE kategori_id IS NULL;

-- Cek hasil
SELECT p.id, p.nama, p.kategori_id, k.nama AS kategori
FROM produk p LEFT JOIN kategori k ON k.id = p.kategori_id
ORDER BY p.id;