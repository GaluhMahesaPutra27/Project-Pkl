# MonitorPelangganKu/backend/src/routes/billing.py

from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, Pelanggan
from src.routes.auth import login_required, role_required
from datetime import datetime
from decimal import Decimal, InvalidOperation
import pandas as pd
import io

billing_bp = Blueprint('billing', __name__)

# Fungsi ini tidak berubah
@billing_bp.route('/pelanggan', methods=['GET'])
@login_required
def get_pelanggan():
    user = User.query.get(session['user_id'])
    am_id_filter = request.args.get('am_id')
    query = Pelanggan.query.join(User, Pelanggan.am_id == User.id)

    if user.role == 'am':
        query = query.filter(Pelanggan.am_id == user.id)
    elif user.role in ['admin', 'superadmin']:
        if am_id_filter and am_id_filter != 'all':
            try:
                query = query.filter(Pelanggan.am_id == int(am_id_filter))
            except ValueError:
                pass
    
    pelanggan_list = query.order_by(Pelanggan.created_at.desc()).all()
    data = []
    for p in pelanggan_list:
        p_dict = p.to_dict()
        p_dict['nama_am'] = p.account_manager.name if p.account_manager else 'N/A'
        data.append(p_dict)
        
    return jsonify({'pelanggan': data}), 200

# Fungsi ini tidak berubah
@billing_bp.route('/pelanggan', methods=['POST'])
@login_required
@role_required(['admin', 'superadmin'])
def create_pelanggan():
    data = request.get_json()
    required_fields = ['no_akun', 'nama_pelanggan', 'am_id', 'produk', 'kategori', 'start_date', 'end_date', 'jumlah_tagihan']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Data input tidak lengkap'}), 400

    try:
        pelanggan = Pelanggan(
            no_akun=data['no_akun'],
            nama_pelanggan=data['nama_pelanggan'],
            am_id=int(data['am_id']),
            produk=data['produk'],
            kategori=data['kategori'],
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            jumlah_tagihan=Decimal(str(data['jumlah_tagihan'])),
            status_invoice=data.get('status_invoice', 'Belum Terkirim'),
            progres_pembayaran=Decimal(str(data.get('progres_pembayaran', 0)))
        )
        db.session.add(pelanggan)
        db.session.commit()
        return jsonify({'message': 'Pelanggan berhasil dibuat', 'pelanggan': pelanggan.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal membuat pelanggan: {str(e)}'}), 400

# Fungsi ini tidak berubah
@billing_bp.route('/pelanggan/<int:pelanggan_id>', methods=['PUT'])
@login_required
@role_required(['admin', 'superadmin'])
def update_pelanggan(pelanggan_id):
    pelanggan = Pelanggan.query.get_or_404(pelanggan_id)
    data = request.get_json()
    try:
        if 'status_invoice' in data:
            pelanggan.status_invoice = data['status_invoice']
        if 'progres_pembayaran' in data:
            pelanggan.progres_pembayaran = Decimal(str(data['progres_pembayaran']))
                
        pelanggan.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Pelanggan berhasil diupdate', 'pelanggan': pelanggan.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal mengupdate: {str(e)}'}), 400

# Fungsi ini tidak berubah
@billing_bp.route('/pelanggan/<int:pelanggan_id>', methods=['DELETE'])
@login_required
@role_required(['admin', 'superadmin'])
def delete_pelanggan(pelanggan_id):
    pelanggan = Pelanggan.query.get_or_404(pelanggan_id)
    try:
        db.session.delete(pelanggan)
        db.session.commit()
        return jsonify({'message': 'Pelanggan berhasil dihapus'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Gagal menghapus: {str(e)}'}), 400
# Lanjutan dari Bagian 1

@billing_bp.route('/pelanggan/bulk-upload', methods=['POST'])
@login_required
@role_required(['admin', 'superadmin'])
def bulk_upload_pelanggan():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file yang diunggah'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nama file kosong'}), 400

    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        return jsonify({'error': 'Format file tidak didukung. Harap gunakan file .csv, .xlsx, atau .xls'}), 400

    try:
        # Menggunakan pandas untuk membaca file, baik CSV maupun Excel
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else: # .xlsx atau .xls
            df = pd.read_excel(file)

        # Ganti nama kolom untuk konsistensi (jika ada spasi atau huruf besar/kecil)
        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        
    except Exception as e:
        return jsonify({'error': f'Gagal membaca file: {str(e)}'}), 400

    imported_count = 0
    errors = []
    
    # Iterasi melalui setiap baris DataFrame
    for index, row in df.iterrows():
        row_num = index + 2  # Nomor baris untuk pesan error (mulai dari 2)
        try:
            # Validasi kolom yang wajib ada
            required_fields = ['no_akun', 'nama_pelanggan', 'am_id', 'produk', 'kategori', 'start_date', 'end_date', 'jumlah_tagihan']
            if not all(field in df.columns for field in required_fields):
                missing = [f for f in required_fields if f not in df.columns]
                return jsonify({'error': f'File tidak memiliki kolom wajib: {", ".join(missing)}'}), 400

            # Validasi data per baris
            if pd.isna(row['no_akun']) or pd.isna(row['nama_pelanggan']) or pd.isna(row['am_id']):
                errors.append(f"Baris {row_num}: no_akun, nama_pelanggan, dan am_id tidak boleh kosong.")
                continue

            no_akun_str = str(row['no_akun']).split('.')[0] # Konversi ke string dan hapus .0 jika ada
            if Pelanggan.query.filter_by(no_akun=no_akun_str).first():
                errors.append(f"Baris {row_num}: No Akun '{no_akun_str}' sudah ada di database.")
                continue

            # Konversi tanggal (pandas sering membacanya sebagai timestamp)
            start_date = pd.to_datetime(row['start_date']).date()
            end_date = pd.to_datetime(row['end_date']).date()

            pelanggan = Pelanggan(
                no_akun=no_akun_str,
                nama_pelanggan=str(row['nama_pelanggan']),
                am_id=int(row['am_id']),
                produk=str(row['produk']),
                kategori=str(row['kategori']),
                start_date=start_date,
                end_date=end_date,
                jumlah_tagihan=Decimal(str(row['jumlah_tagihan'])),
                status_invoice=str(row.get('status_invoice', 'Belum Terkirim')),
                progres_pembayaran=Decimal(str(row.get('progres_pembayaran', 0)))
            )
            db.session.add(pelanggan)
            imported_count += 1

        except (ValueError, TypeError, KeyError, InvalidOperation) as e:
            errors.append(f"Baris {row_num}: Gagal diproses - {str(e)}. Data: {row.to_dict()}")
            continue
        except Exception as e:
            errors.append(f"Baris {row_num}: Terjadi error tak terduga - {str(e)}")
            continue

    if errors:
        db.session.rollback()
        return jsonify({
            'error': 'Terjadi kesalahan pada beberapa data. Tidak ada data yang diimpor.',
            'details': errors
        }), 400
    else:
        db.session.commit()
        return jsonify({
            'message': f'Berhasil mengimpor {imported_count} data pelanggan.',
            'imported_count': imported_count
        }), 200

# Fungsi ini tidak berubah
@billing_bp.route('/am-list', methods=['GET'])
@login_required
def get_am_list():
    am_users = User.query.filter(
        User.role == 'am',
        User.is_active == True
    ).order_by(User.name).all()
    am_list = [{'id': u.id, 'name': u.name} for u in am_users]
    return jsonify({'am_list': am_list}), 200


# Endpoint baru untuk mendapatkan total progres pembayaran
@billing_bp.route('/progres-pembayaran', methods=['GET'])
@login_required
def get_progres_pembayaran():
    user = User.query.get(session['user_id'])
    am_id_filter = request.args.get('am_id')
    query = Pelanggan.query.join(User, Pelanggan.am_id == User.id)

    # Filter berdasarkan role user
    if user.role == 'am':
        query = query.filter(Pelanggan.am_id == user.id)
    elif user.role in ['admin', 'superadmin']:
        # Admin dan superadmin bisa melihat semua data atau filter berdasarkan AM
        if am_id_filter and am_id_filter != 'all':
            try:
                query = query.filter(Pelanggan.am_id == int(am_id_filter))
            except ValueError:
                pass
    
    pelanggan_list = query.all()
    
    # Hitung total progres pembayaran dan total tagihan
    total_progres_pembayaran = sum(p.progres_pembayaran for p in pelanggan_list)
    total_tagihan = sum(p.jumlah_tagihan for p in pelanggan_list)
    
    return jsonify({
        'total_progres_pembayaran': float(total_progres_pembayaran),
        'total_tagihan': float(total_tagihan),
        'jumlah_pelanggan': len(pelanggan_list),
        'am_id': am_id_filter if am_id_filter and am_id_filter != 'all' else None
    }), 200

# Endpoint untuk mendapatkan progres pembayaran per AM
@billing_bp.route('/progres-pembayaran-per-am', methods=['GET'])
@login_required
@role_required(['admin', 'superadmin'])
def get_progres_pembayaran_per_am():
    # Query untuk mendapatkan data progres pembayaran per AM
    query = db.session.query(
        User.id,
        User.name,
        db.func.sum(Pelanggan.progres_pembayaran).label('total_progres'),
        db.func.sum(Pelanggan.jumlah_tagihan).label('total_tagihan'),
        db.func.count(Pelanggan.id).label('jumlah_pelanggan')
    ).join(
        Pelanggan, User.id == Pelanggan.am_id
    ).filter(
        User.role == 'am',
        User.is_active == True
    ).group_by(User.id, User.name).all()
    
    am_progress = []
    for am_data in query:
        progress_percentage = 0
        if am_data.total_tagihan > 0:
            progress_percentage = round((am_data.total_progres / am_data.total_tagihan) * 100, 2)
        
        # Query terpisah untuk menghitung pelanggan lunas per AM
        pelanggan_lunas_count = db.session.query(
            db.func.count(Pelanggan.id)
        ).filter(
            Pelanggan.am_id == am_data.id,
            Pelanggan.progres_pembayaran >= Pelanggan.jumlah_tagihan
        ).scalar() or 0
        
        am_progress.append({
            'am_id': am_data.id,
            'nama_am': am_data.name,
            'total_progres_pembayaran': float(am_data.total_progres or 0),
            'total_tagihan': float(am_data.total_tagihan or 0),
            'sisa_tagihan': float((am_data.total_tagihan or 0) - (am_data.total_progres or 0)),
            'progress_percentage': progress_percentage,
            'jumlah_pelanggan': am_data.jumlah_pelanggan,
            'pelanggan_lunas': pelanggan_lunas_count
        })
    
    return jsonify({'am_progress': am_progress}), 200


# Endpoint untuk mendapatkan timestamp terakhir update data billing
@billing_bp.route('/last-update', methods=['GET'])
@login_required
def get_last_update():
    user = User.query.get(session['user_id'])
    
    # Query untuk mendapatkan timestamp terakhir update
    if user.role == 'am':
        # AM hanya melihat data pelanggan mereka
        last_update = db.session.query(
            db.func.max(Pelanggan.updated_at)
        ).filter(Pelanggan.am_id == user.id).scalar()
    else:
        # Admin dan superadmin melihat semua data
        last_update = db.session.query(
            db.func.max(Pelanggan.updated_at)
        ).scalar()
    
    # Jika tidak ada data, gunakan waktu sekarang
    if last_update is None:
        last_update = datetime.utcnow()
    
    return jsonify({
        'last_update': last_update.isoformat() if last_update else None,
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# Endpoint untuk debug - melihat data pelanggan lunas per AM
@billing_bp.route('/debug/pelanggan-lunas', methods=['GET'])
@login_required
@role_required(['admin', 'superadmin'])
def debug_pelanggan_lunas():
    # Query untuk melihat detail pelanggan lunas per AM
    query = db.session.query(
        User.id,
        User.name,
        Pelanggan.nama_pelanggan,
        Pelanggan.progres_pembayaran,
        Pelanggan.jumlah_tagihan
    ).join(
        Pelanggan, User.id == Pelanggan.am_id
    ).filter(
        User.role == 'am',
        User.is_active == True
    ).order_by(User.name, Pelanggan.nama_pelanggan).all()
    
    debug_data = []
    for data in query:
        is_lunas = data.progres_pembayaran >= data.jumlah_tagihan
        debug_data.append({
            'am_id': data.id,
            'nama_am': data.name,
            'nama_pelanggan': data.nama_pelanggan,
            'progres_pembayaran': float(data.progres_pembayaran),
            'jumlah_tagihan': float(data.jumlah_tagihan),
            'is_lunas': is_lunas,
            'status_calculated': 'Lunas' if is_lunas else ('Cicil' if data.progres_pembayaran > 0 else 'Belum Bayar')
        })
    
    return jsonify({'debug_data': debug_data}), 200

