# MonitorPelangganKu - Dashboard Admin

Sistem monitoring pelanggan internet WiFi dengan dashboard admin yang lengkap dan modern.

## 🚀 Fitur Utama

### 🔐 Sistem Authentication
- Login dengan role-based access control
- 3 level akses: Superadmin, Admin, Account Manager
- Session management yang aman
- Demo accounts tersedia untuk testing

### 📊 Dashboard Analytics
- Statistik real-time pelanggan aktif
- Ringkasan kontrak dan tagihan
- Monitoring pembayaran pelanggan
- Aktivitas sistem terbaru

### 💰 Manajemen Billing
- Tracking tagihan pelanggan
- Status pembayaran (Belum Bayar, Cicil, Lunas)
- Kategori produk (C3mr, CYC, CR)
- Progress pembayaran real-time

### 📋 Manajemen Kontrak
- Database kontrak lengkap
- Tracking periode kontrak
- Nilai kontrak dan status
- Informasi customer detail

### 👥 Management Akun (Superadmin Only)
- CRUD operations untuk user
- Role assignment dan management
- User activity monitoring
- Bulk user operations

## 🛠️ Teknologi Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **Flask-CORS** - Cross-origin resource sharing
- **SQLite** - Database (development)
- **Werkzeug** - Password hashing

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS
- **Shadcn/ui** - Modern component library
- **Lucide React** - Beautiful icons

## 📦 Instalasi dan Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- pnpm (recommended) atau npm

### 1. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate     # Windows

pip install -r requirements.txt
python src/main.py
```

Backend akan berjalan di `http://localhost:5000`

### 2. Setup Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 🔑 Demo Accounts

Aplikasi sudah dilengkapi dengan demo accounts untuk testing:

### Superadmin
- **Username:** `inas_fatin`
- **Password:** `password123`
- **Akses:** Full access ke semua fitur

### Superadmin 2
- **Username:** `ulfa_adzkia`
- **Password:** `password123`
- **Akses:** Full access ke semua fitur

### Account Manager
- **Username:** `aldi`
- **Password:** `password123`
- **Akses:** View-only access

## 🏗️ Struktur Project

```
MonitorPelangganKu/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── user.py          # Database models
│   │   ├── routes/
│   │   │   ├── auth.py          # Authentication routes
│   │   │   ├── billing.py       # Billing management
│   │   │   ├── kontrak.py       # Contract management
│   │   │   └── user.py          # User management
│   │   └── main.py              # Flask application
│   ├── venv/                    # Python virtual environment
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn/ui components
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── Billing.jsx      # Billing management
│   │   │   ├── Kontrak.jsx      # Contract management
│   │   │   ├── ManagementAkun.jsx # User management
│   │   │   ├── Login.jsx        # Login form
│   │   │   └── Layout.jsx       # App layout
│   │   ├── hooks/
│   │   │   └── useAuth.jsx      # Authentication hook
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # App entry point
│   ├── package.json             # Node dependencies
│   └── vite.config.js           # Vite configuration
└── README.md                    # Documentation
```

## 🎯 Cara Penggunaan

### 1. Login
- Buka `http://localhost:5173`
- Gunakan salah satu demo account
- Sistem akan redirect ke dashboard sesuai role

### 2. Dashboard
- Lihat statistik real-time
- Monitor aktivitas terbaru
- Akses quick actions

### 3. Billing Management
- Tambah/edit data pelanggan
- Update status pembayaran
- Track progress tagihan

### 4. Contract Management
- Kelola database kontrak
- Monitor periode kontrak
- Update status kontrak

### 5. User Management (Superadmin)
- Tambah user baru
- Edit role dan permissions
- Deactivate/activate users

## 🔧 Konfigurasi

### Database
- Default menggunakan SQLite untuk development
- Database file: `backend/instance/database.db`
- Auto-create tables saat first run

### CORS Configuration
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Proxy configuration di `vite.config.js`

### Environment Variables
Buat file `.env` di folder backend jika diperlukan:
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///database.db
```

## 🚀 Production Deployment

### Backend
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

### Frontend
```bash
pnpm run build
# Deploy dist/ folder ke web server
```

## 🐛 Troubleshooting

### Backend tidak bisa diakses
- Pastikan virtual environment aktif
- Check port 5000 tidak digunakan aplikasi lain
- Periksa firewall settings

### Frontend tidak bisa connect ke backend
- Pastikan proxy configuration di `vite.config.js` benar
- Check CORS settings di backend
- Pastikan kedua service berjalan

### Database errors
- Delete `backend/instance/database.db` untuk reset
- Restart backend untuk auto-create tables
- Check file permissions

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/check-session` - Check session
- `POST /api/auth/logout` - User logout

### Billing
- `GET /api/pelanggan` - Get all customers
- `POST /api/pelanggan` - Create customer
- `PUT /api/pelanggan/<id>` - Update customer
- `DELETE /api/pelanggan/<id>` - Delete customer

### Contracts
- `GET /api/kontrak` - Get all contracts
- `POST /api/kontrak` - Create contract
- `PUT /api/kontrak/<id>` - Update contract
- `DELETE /api/kontrak/<id>` - Delete contract

### User Management
- `GET /api/users` - Get all users (superadmin only)
- `POST /api/users` - Create user (superadmin only)
- `PUT /api/users/<id>` - Update user (superadmin only)
- `DELETE /api/users/<id>` - Delete user (superadmin only)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Developer

Developed with ❤️ for efficient customer monitoring and management.

---

**MonitorPelangganKu** - Solusi monitoring pelanggan internet WiFi yang modern dan efisien.

