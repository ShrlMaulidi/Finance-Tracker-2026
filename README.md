# FinanceTrack 📊

FinanceTrack adalah aplikasi manajemen keuangan pribadi modern yang dirancang untuk membantu Anda melacak, mengelola, dan merencanakan keuangan dengan antarmuka yang cantik dan intuitif. 

Aplikasi ini dibangun menggunakan **Laravel** sebagai *backend*, **React.js** (dengan Inertia.js) sebagai *frontend*, dan **Tailwind CSS** untuk desain antarmuka yang responsif dan premium.

## ✨ Fitur Utama

- **Dashboard Keuangan:** Ringkasan visual dari total saldo, pemasukan, pengeluaran, dan tabungan Anda.
- **Pencatatan Transaksi:** Catat pemasukan, pengeluaran, dan alokasi tabungan harian Anda dengan mudah.
- **Pengeluaran Bulanan (Budgeting):** Buat anggaran pengeluaran bulanan dan pantau persentase penggunaannya secara *real-time*.
- **Target & Tabungan:** Buat target menabung (seperti beli gadget, liburan, dll) dan pantau *progress* tabungan Anda.
- **Kelola Kategori:** Kustomisasi kategori pemasukan dan pengeluaran Anda sendiri (Tersinkronisasi ke seluruh aplikasi).
- **Desain Modern:** Antarmuka dengan pendekatan desain *glassmorphism* dan *micro-interactions* yang sangat memanjakan mata.

## 💻 Tech Stack

- **Backend:** Laravel 11.x / PHP 8.4+
- **Frontend:** React.js, Inertia.js
- **Styling:** Tailwind CSS, PostCSS
- **Bundler:** Vite
- **Database:** MySQL / SQLite / PostgreSQL (Default: MySQL)

---

## 🚀 Cara Instalasi & Menjalankan Project

Ikuti langkah-langkah di bawah ini untuk mengunduh dan menjalankan project FinanceTrack di mesin lokal Anda.

### 1. Persyaratan Sistem
Pastikan Anda sudah menginstal aplikasi berikut di komputer Anda:
- [PHP](https://www.php.net/downloads.php) (Versi 8.2 atau lebih baru)
- [Composer](https://getcomposer.org/) (Manajer dependensi PHP)
- [Node.js & npm](https://nodejs.org/) (Untuk mengelola aset frontend)
- [MySQL](https://www.mysql.com/) atau database SQL lainnya (Jika menggunakan MySQL, pastikan layanannya berjalan)

### 2. Kloning Repository
Buka terminal dan jalankan perintah kloning berikut:
```bash
git clone https://github.com/username-anda/FinanceTrack.git
cd FinanceTrack
```

### 3. Instalasi Dependensi
Instal pustaka backend dan frontend:
```bash
# Instal dependensi Laravel (Backend)
composer install

# Instal dependensi React (Frontend)
npm install
```

### 4. Konfigurasi Environment (Lingkungan)
Salin file konfigurasi bawaan dan hasilkan kunci aplikasi (App Key):
```bash
cp .env.example .env
php artisan key:generate
```

Buka file `.env` di *code editor* Anda dan sesuaikan koneksi database Anda. Contoh konfigurasi default untuk MySQL:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=finance_track
DB_USERNAME=root
DB_PASSWORD=
```
*(Catatan: Pastikan Anda sudah membuat database kosong dengan nama `finance_track` di phpMyAdmin / database client Anda sebelum lanjut ke langkah berikutnya).*

### 5. Menjalankan Migrasi Database
Buat struktur tabel database yang dibutuhkan oleh aplikasi:
```bash
php artisan migrate
```

### 6. Menjalankan Server Lokal
Anda harus menjalankan *server backend* dan *server frontend* secara bersamaan. Buka **dua tab terminal** yang berbeda di dalam folder proyek.

**Terminal 1 (Backend - Laravel):**
```bash
php artisan serve
```
*(Server akan berjalan di http://127.0.0.1:8000)*

**Terminal 2 (Frontend - Vite/React):**
```bash
npm run dev
```

### 7. Selesai! 🎉
Sekarang buka browser Anda dan akses:
👉 **[http://localhost:8000](http://localhost:8000)**

Anda bisa mendaftar akun baru (Register) dan mulai menggunakan aplikasinya!

---

## 🤝 Kontribusi

Jika Anda ingin ikut mengembangkan aplikasi ini:
1. *Fork* repository ini.
2. Buat *branch* fitur Anda (`git checkout -b fitur-keren-anda`).
3. *Commit* perubahan Anda (`git commit -m 'Menambahkan fitur keren'`).
4. *Push* ke *branch* (`git push origin fitur-keren-anda`).
5. Buka **Pull Request**.

## 📄 Lisensi

Project ini dibuat untuk keperluan pembelajaran dan penggunaan pribadi. *Open-source* dibawah [MIT license](https://opensource.org/licenses/MIT).
