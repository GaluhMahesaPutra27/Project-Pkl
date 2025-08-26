from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import Numeric

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='am')  # superadmin, admin, am
    name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    pelanggan = db.relationship('Pelanggan', backref='account_manager', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'name': self.name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Pelanggan(db.Model):
    __tablename__ = 'pelanggan'
    
    id = db.Column(db.Integer, primary_key=True)
    no_akun = db.Column(db.String(50), unique=True, nullable=False)
    nama_pelanggan = db.Column(db.String(100), nullable=False)
    am_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    produk = db.Column(db.String(100), nullable=False)
    kategori = db.Column(db.String(20), nullable=False)  # C3mr, CYC, CR
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    jumlah_tagihan = db.Column(Numeric(15, 2), nullable=False)
    status_invoice = db.Column(db.String(20), default='Belum Terkirim')  # Terkirim, Belum Terkirim
    progres_pembayaran = db.Column(Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def status_pembayaran(self):
        if self.progres_pembayaran == 0:
            return 'Belum Bayar'
        elif self.progres_pembayaran >= self.jumlah_tagihan:
            return 'Lunas'
        else:
            return 'Cicil'
    
    def to_dict(self):
        return {
            'id': self.id,
            'no_akun': self.no_akun,
            'nama_pelanggan': self.nama_pelanggan,
            'nama_am': self.account_manager.name if self.account_manager else '',
            'produk': self.produk,
            'kategori': self.kategori,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'jumlah_tagihan': float(self.jumlah_tagihan),
            'status_invoice': self.status_invoice,
            'progres_pembayaran': float(self.progres_pembayaran),
            'status_pembayaran': self.status_pembayaran,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Kontrak(db.Model):
    __tablename__ = 'kontrak'
    
    id = db.Column(db.Integer, primary_key=True)
    no_kontrak = db.Column(db.String(50), unique=True, nullable=False)
    tanggal_kontrak = db.Column(db.Date, nullable=False)
    nilai_kontrak = db.Column(Numeric(15, 2), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    nama_pekerjaan = db.Column(db.String(200), nullable=False)
    nama_customer = db.Column(db.String(100), nullable=False)
    jenis_transaksi = db.Column(db.String(20), nullable=False)  # Own Channel, GTMA, NGTMA
    segmen = db.Column(db.String(20), nullable=False)  # Business, Government, Enterprise
    pic_name = db.Column(db.String(100), nullable=True)  # PIC berdasarkan segmen
    file_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def periode_kontrak(self):
        """Calculate period from start_date and end_date"""
        if not self.start_date or not self.end_date:
            return '-'
        
        if self.start_date > self.end_date:
            return 'Invalid'
        
        diff_time = abs((self.end_date - self.start_date).days)
        diff_months = round(diff_time / 30.44)  # Average days per month
        
        if diff_months < 1:
            return f"{diff_time} hari"
        elif diff_months < 12:
            return f"{diff_months} bulan"
        else:
            years = diff_months // 12
            remaining_months = diff_months % 12
            if remaining_months == 0:
                return f"{years} tahun"
            else:
                return f"{years} tahun {remaining_months} bulan"
    
    def to_dict(self):
        return {
            'id': self.id,
            'no_kontrak': self.no_kontrak,
            'tanggal_kontrak': self.tanggal_kontrak.isoformat() if self.tanggal_kontrak else None,
            'nilai_kontrak': float(self.nilai_kontrak),
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'periode_kontrak': self.periode_kontrak,
            'nama_pekerjaan': self.nama_pekerjaan,
            'nama_customer': self.nama_customer,
            'jenis_transaksi': self.jenis_transaksi,
            'segmen': self.segmen,
            'pic_name': self.pic_name,
            'file_path': self.file_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
