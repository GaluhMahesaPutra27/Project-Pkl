from flask import Blueprint, request, jsonify, session, send_file, current_app
from src.models.user import db, User, Kontrak
from src.routes.auth import login_required, role_required
from datetime import datetime
from decimal import Decimal
import os
import csv
import io
import pandas as pd
from werkzeug.utils import secure_filename

kontrak_bp = Blueprint('kontrak', __name__)

# Segmen PIC mapping
SEGMEN_PIC = {
    'Business': ['Aldi', 'Bayu', 'Dian', 'Fitrah', 'Vivi'],
    'Government': ['Taufik', 'Tommy', 'Noventi', 'Mentari'],
    'Enterprise': ['Cintia', 'Yuda']
}

UPLOAD_FOLDER = 'uploads/kontrak'
ALLOWED_EXTENSIONS = {'pdf'}

def get_upload_folder():
    """Get absolute path for upload folder"""
    if current_app:
        # Use Flask app's instance path as base
        base_path = current_app.instance_path
    else:
        # Fallback to current working directory
        base_path = os.getcwd()
    
    upload_path = os.path.join(base_path, UPLOAD_FOLDER)
    return upload_path

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@kontrak_bp.route('/kontrak', methods=['GET'])
@login_required
def get_kontrak():
    kontrak_list = Kontrak.query.all()
    return jsonify({
        'kontrak': [k.to_dict() for k in kontrak_list]
    }), 200

@kontrak_bp.route('/kontrak', methods=['POST'])
@role_required(['admin', 'superadmin'])
def create_kontrak():
    # Check if request contains file upload
    if 'file' in request.files:
        return create_kontrak_with_file()
    
    # Regular JSON data
    data = request.get_json()
    
    try:
        kontrak = Kontrak(
            no_kontrak=data['no_kontrak'],
            tanggal_kontrak=datetime.strptime(data['tanggal_kontrak'], '%Y-%m-%d').date(),
            nilai_kontrak=Decimal(str(data['nilai_kontrak'])),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            nama_pekerjaan=data['nama_pekerjaan'],
            nama_customer=data['nama_customer'],
            jenis_transaksi=data['jenis_transaksi'],
            segmen=data['segmen'],
            pic_name=data.get('pic_name')
        )
        
        db.session.add(kontrak)
        db.session.commit()
        
        return jsonify({
            'message': 'Kontrak created successfully',
            'kontrak': kontrak.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

def create_kontrak_with_file():
    """Create kontrak with PDF file upload"""
    try:
        # Get form data
        data = {
            'no_kontrak': request.form.get('no_kontrak'),
            'tanggal_kontrak': request.form.get('tanggal_kontrak'),
            'nilai_kontrak': request.form.get('nilai_kontrak'),
            'start_date': request.form.get('start_date'),
            'end_date': request.form.get('end_date'),
            'nama_pekerjaan': request.form.get('nama_pekerjaan'),
            'nama_customer': request.form.get('nama_customer'),
            'jenis_transaksi': request.form.get('jenis_transaksi'),
            'segmen': request.form.get('segmen'),
            'pic_name': request.form.get('pic_name')
        }
        
        # Validate required fields
        required_fields = ['no_kontrak', 'tanggal_kontrak', 'nilai_kontrak', 'start_date', 
                          'end_date', 'nama_pekerjaan', 'nama_customer', 'jenis_transaksi', 'segmen']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Field {field} is required'}), 400
        
        # Create kontrak
        kontrak = Kontrak(
            no_kontrak=data['no_kontrak'],
            tanggal_kontrak=datetime.strptime(data['tanggal_kontrak'], '%Y-%m-%d').date(),
            nilai_kontrak=Decimal(str(data['nilai_kontrak'])),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            nama_pekerjaan=data['nama_pekerjaan'],
            nama_customer=data['nama_customer'],
            jenis_transaksi=data['jenis_transaksi'],
            segmen=data['segmen'],
            pic_name=data.get('pic_name')
        )
        
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename and allowed_file(file.filename):
                # Get absolute upload directory
                upload_dir = get_upload_folder()
                os.makedirs(upload_dir, exist_ok=True)
                
                filename = secure_filename(file.filename)
                # Add timestamp and kontrak number to avoid conflicts
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                filename = f"{timestamp}{data['no_kontrak']}_{filename}"
                file_path = os.path.join(upload_dir, filename)
                
                file.save(file_path)
                # Store absolute path in database
                kontrak.file_path = file_path
        
        db.session.add(kontrak)
        db.session.commit()
        
        return jsonify({
            'message': 'Kontrak created successfully with file',
            'kontrak': kontrak.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@kontrak_bp.route('/kontrak/<int:kontrak_id>', methods=['PUT'])
@role_required(['admin', 'superadmin'])
def update_kontrak(kontrak_id):
    kontrak = Kontrak.query.get_or_404(kontrak_id)
    data = request.get_json()
    
    try:
        if 'no_kontrak' in data:
            kontrak.no_kontrak = data['no_kontrak']
        if 'tanggal_kontrak' in data:
            kontrak.tanggal_kontrak = datetime.strptime(data['tanggal_kontrak'], '%Y-%m-%d').date()
        if 'nilai_kontrak' in data:
            kontrak.nilai_kontrak = Decimal(str(data['nilai_kontrak']))
        if 'start_date' in data:
            kontrak.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            kontrak.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        if 'nama_pekerjaan' in data:
            kontrak.nama_pekerjaan = data['nama_pekerjaan']
        if 'nama_customer' in data:
            kontrak.nama_customer = data['nama_customer']
        if 'jenis_transaksi' in data:
            kontrak.jenis_transaksi = data['jenis_transaksi']
        if 'segmen' in data:
            kontrak.segmen = data['segmen']
        if 'pic_name' in data:
            kontrak.pic_name = data['pic_name']
        
        kontrak.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Kontrak updated successfully',
            'kontrak': kontrak.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@kontrak_bp.route('/kontrak/<int:kontrak_id>', methods=['DELETE'])
@role_required(['admin', 'superadmin'])
def delete_kontrak(kontrak_id):
    kontrak = Kontrak.query.get_or_404(kontrak_id)
    
    try:
        # Delete file if exists
        if kontrak.file_path and os.path.exists(kontrak.file_path):
            os.remove(kontrak.file_path)
        
        db.session.delete(kontrak)
        db.session.commit()
        return jsonify({'message': 'Kontrak deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@kontrak_bp.route('/kontrak/bulk-delete', methods=['DELETE'])
@role_required(['admin', 'superadmin'])
def bulk_delete_kontrak():
    """Bulk delete multiple kontrak"""
    data = request.get_json()
    
    if not data or 'kontrak_ids' not in data:
        return jsonify({'error': 'kontrak_ids is required'}), 400
    
    kontrak_ids = data['kontrak_ids']
    
    if not isinstance(kontrak_ids, list) or len(kontrak_ids) == 0:
        return jsonify({'error': 'kontrak_ids must be a non-empty list'}), 400
    
    try:
        deleted_count = 0
        errors = []
        
        for kontrak_id in kontrak_ids:
            try:
                kontrak = Kontrak.query.get(kontrak_id)
                if not kontrak:
                    errors.append(f"Kontrak with ID {kontrak_id} not found")
                    continue
                
                # Delete file if exists
                if kontrak.file_path and os.path.exists(kontrak.file_path):
                    try:
                        os.remove(kontrak.file_path)
                    except Exception as e:
                        # Log error but continue with deletion
                        print(f"Error deleting file {kontrak.file_path}: {str(e)}")
                
                db.session.delete(kontrak)
                deleted_count += 1
                
            except Exception as e:
                errors.append(f"Error deleting kontrak ID {kontrak_id}: {str(e)}")
        
        if deleted_count > 0:
            db.session.commit()
        
        response_data = {
            'message': f'Successfully deleted {deleted_count} kontrak(s)',
            'deleted_count': deleted_count,
            'errors': errors
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete kontrak: {str(e)}'}), 400

@kontrak_bp.route('/kontrak/<int:kontrak_id>/upload', methods=['POST'])
@role_required(['admin', 'superadmin'])
def upload_kontrak_file(kontrak_id):
    kontrak = Kontrak.query.get_or_404(kontrak_id)
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        # Get absolute upload directory
        upload_dir = get_upload_folder()
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = secure_filename(file.filename)
        # Add timestamp and kontrak number to avoid conflicts
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = f"{timestamp}{kontrak.no_kontrak}_{filename}"
        file_path = os.path.join(upload_dir, filename)
        
        try:
            file.save(file_path)
            
            # Delete old file if exists
            if kontrak.file_path and os.path.exists(kontrak.file_path):
                os.remove(kontrak.file_path)
            
            # Store absolute path in database
            kontrak.file_path = file_path
            kontrak.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'File uploaded successfully',
                'file_path': file_path,
                'kontrak': kontrak.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
    
    return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

@kontrak_bp.route('/kontrak/<int:kontrak_id>/download', methods=['GET'])
@login_required
def download_kontrak_file(kontrak_id):
    kontrak = Kontrak.query.get_or_404(kontrak_id)
    
    if not kontrak.file_path:
        return jsonify({'error': 'No file associated with this kontrak'}), 404
    
    # Handle both absolute and relative paths
    if os.path.isabs(kontrak.file_path):
        file_path = kontrak.file_path
    else:
        # Convert relative path to absolute
        upload_dir = get_upload_folder()
        file_path = os.path.join(upload_dir, os.path.basename(kontrak.file_path))
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found on server'}), 404
    
    try:
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': f'Error sending file: {str(e)}'}), 500

@kontrak_bp.route('/kontrak/<int:kontrak_id>/view', methods=['GET'])
@login_required
def view_kontrak_file(kontrak_id):
    """View PDF file in browser"""
    kontrak = Kontrak.query.get_or_404(kontrak_id)
    
    if not kontrak.file_path:
        return jsonify({'error': 'No file associated with this kontrak'}), 404
    
    # Handle both absolute and relative paths
    if os.path.isabs(kontrak.file_path):
        file_path = kontrak.file_path
    else:
        # Convert relative path to absolute
        upload_dir = get_upload_folder()
        file_path = os.path.join(upload_dir, os.path.basename(kontrak.file_path))
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found on server'}), 404
    
    try:
        return send_file(file_path, mimetype='application/pdf')
    except Exception as e:
        return jsonify({'error': f'Error sending file: {str(e)}'}), 500

@kontrak_bp.route('/kontrak/pdf-list', methods=['GET'])
@login_required
def get_pdf_list():
    """Get list of all kontrak with PDF files"""
    kontrak_with_pdf = Kontrak.query.filter(Kontrak.file_path.isnot(None)).all()
    
    pdf_list = []
    for kontrak in kontrak_with_pdf:
        if kontrak.file_path:
            # Handle both absolute and relative paths
            if os.path.isabs(kontrak.file_path):
                file_path = kontrak.file_path
            else:
                # Convert relative path to absolute
                upload_dir = get_upload_folder()
                file_path = os.path.join(upload_dir, os.path.basename(kontrak.file_path))
            
            if os.path.exists(file_path):
                try:
                    file_stats = os.stat(file_path)
                    file_size = file_stats.st_size
                    
                    # Convert bytes to MB
                    file_size_mb = round(file_size / (1024 * 1024), 2)
                    
                    pdf_info = {
                        'id': kontrak.id,
                        'no_kontrak': kontrak.no_kontrak,
                        'nama_pekerjaan': kontrak.nama_pekerjaan,
                        'nama_customer': kontrak.nama_customer,
                        'filename': os.path.basename(file_path),
                        'file_size': f"{file_size_mb} MB",
                        'upload_date': kontrak.updated_at.strftime('%Y-%m-%d') if kontrak.updated_at else kontrak.created_at.strftime('%Y-%m-%d'),
                        'view_url': f"/api/kontrak/{kontrak.id}/view",
                        'download_url': f"/api/kontrak/{kontrak.id}/download"
                    }
                    pdf_list.append(pdf_info)
                except Exception as e:
                    # Skip files that can't be accessed
                    print(f"Error accessing file {file_path}: {str(e)}")
                    continue
    
    return jsonify({
        'pdf_list': pdf_list,
        'total': len(pdf_list)
    }), 200

@kontrak_bp.route('/kontrak/bulk-upload', methods=['POST'])
@role_required(['admin', 'superadmin'])
def bulk_upload_kontrak():
    """Bulk upload kontrak from CSV or Excel file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check file extension
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        return jsonify({'error': 'Only CSV and Excel files (.csv, .xlsx, .xls) are allowed'}), 400
    
    try:
        # Read file based on extension
        if filename.endswith('.csv'):
            # Read CSV file
            stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
            df = pd.read_csv(stream)
        else:
            # Read Excel file
            df = pd.read_excel(file)
        
        # Convert DataFrame to list of dictionaries
        data_rows = df.to_dict('records')
        
        imported_count = 0
        errors = []
        
        for row_num, row in enumerate(data_rows, start=2):  # Start from 2 because row 1 is header
            try:
                # Validate required fields
                required_fields = ['no_kontrak', 'tanggal_kontrak', 'nilai_kontrak', 'start_date', 
                                 'end_date', 'nama_pekerjaan', 'nama_customer', 'jenis_transaksi', 'segmen']
                
                for field in required_fields:
                    if pd.isna(row.get(field)) or str(row.get(field, '')).strip() == '':
                        raise ValueError(f"Field '{field}' is required")
                
                # Check if kontrak already exists
                existing = Kontrak.query.filter_by(no_kontrak=str(row['no_kontrak']).strip()).first()
                if existing:
                    errors.append(f"Row {row_num}: Kontrak {row['no_kontrak']} already exists")
                    continue
                
                # Handle date conversion
                def parse_date(date_value):
                    if pd.isna(date_value):
                        raise ValueError("Date cannot be empty")
                    if isinstance(date_value, str):
                        return datetime.strptime(date_value.strip(), '%Y-%m-%d').date()
                    elif hasattr(date_value, 'date'):  # pandas Timestamp
                        return date_value.date()
                    else:
                        return datetime.strptime(str(date_value), '%Y-%m-%d').date()
                
                kontrak = Kontrak(
                    no_kontrak=str(row['no_kontrak']).strip(),
                    tanggal_kontrak=parse_date(row['tanggal_kontrak']),
                    nilai_kontrak=Decimal(str(row['nilai_kontrak']).strip()),
                    start_date=parse_date(row['start_date']),
                    end_date=parse_date(row['end_date']),
                    nama_pekerjaan=str(row['nama_pekerjaan']).strip(),
                    nama_customer=str(row['nama_customer']).strip(),
                    jenis_transaksi=str(row['jenis_transaksi']).strip(),
                    segmen=str(row['segmen']).strip(),
                    pic_name=str(row.get('pic_name', '')).strip() or None
                )
                
                db.session.add(kontrak)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        if imported_count > 0:
            db.session.commit()
        
        response_data = {
            'message': f'Import completed. {imported_count} records imported.',
            'imported_count': imported_count,
            'errors': errors
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process file: {str(e)}'}), 400

@kontrak_bp.route('/segmen-pic/<segmen>', methods=['GET'])
@login_required
def get_segmen_pic(segmen):
    if segmen in SEGMEN_PIC:
        return jsonify({
            'segmen': segmen,
            'pic_list': SEGMEN_PIC[segmen]
        }), 200
    
    return jsonify({'error': 'Invalid segmen'}), 400

@kontrak_bp.route('/segmen-list', methods=['GET'])
@login_required
def get_segmen_list():
    return jsonify({
        'segmen_list': list(SEGMEN_PIC.keys())
    }), 200

# Utility function to fix existing file paths in database
@kontrak_bp.route('/kontrak/fix-file-paths', methods=['POST'])
@role_required(['admin', 'superadmin'])
def fix_file_paths():
    """Fix existing relative file paths to absolute paths"""
    try:
        upload_dir = get_upload_folder()
        kontrak_list = Kontrak.query.filter(Kontrak.file_path.isnot(None)).all()
        
        fixed_count = 0
        errors = []
        
        for kontrak in kontrak_list:
            if kontrak.file_path and not os.path.isabs(kontrak.file_path):
                # Convert relative path to absolute
                old_path = kontrak.file_path
                filename = os.path.basename(old_path)
                new_path = os.path.join(upload_dir, filename)
                
                if os.path.exists(new_path):
                    kontrak.file_path = new_path
                    fixed_count += 1
                else:
                    errors.append(f"File not found for kontrak {kontrak.no_kontrak}: {filename}")
        
        if fixed_count > 0:
            db.session.commit()
        
        return jsonify({
            'message': f'Fixed {fixed_count} file paths',
            'fixed_count': fixed_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

