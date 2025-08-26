from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
import csv
import pandas as pd
import PyPDF2
from io import StringIO
import tempfile
from datetime import datetime
import re

upload_bp = Blueprint('upload', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'pdf', 'xlsx', 'xls'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        current_app.logger.error(f"Error extracting PDF text: {str(e)}")
        return None

def parse_csv_data(file_path):
    """Parse CSV file and return list of customer data"""
    try:
        customers = []
        with open(file_path, 'r', encoding='utf-8') as file:
            # Try to detect delimiter
            sample = file.read(1024)
            file.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(file, delimiter=delimiter)
            
            for row in reader:
                # Map CSV columns to database fields
                customer_data = {
                    'no_akun': row.get('no_akun', '').strip(),
                    'nama_pelanggan': row.get('nama_pelanggan', '').strip(),
                    'am_id': row.get('am_id', '').strip(),
                    'produk': row.get('produk', '').strip(),
                    'kategori': row.get('kategori', 'C3mr').strip(),
                    'start_date': row.get('start_date', '').strip(),
                    'end_date': row.get('end_date', '').strip(),
                    'jumlah_tagihan': row.get('jumlah_tagihan', '0').strip(),
                    'status_invoice': row.get('status_invoice', 'Belum Terkirim').strip(),
                    'progres_pembayaran': row.get('progres_pembayaran', '0').strip()
                }
                
                # Validate required fields
                if customer_data['no_akun'] and customer_data['nama_pelanggan']:
                    customers.append(customer_data)
                    
        return customers
    except Exception as e:
        current_app.logger.error(f"Error parsing CSV: {str(e)}")
        return None

def parse_excel_data(file_path):
    """Parse Excel file and return list of customer data"""
    try:
        df = pd.read_excel(file_path)
        customers = []
        
        for _, row in df.iterrows():
            customer_data = {
                'no_akun': str(row.get('no_akun', '')).strip(),
                'nama_pelanggan': str(row.get('nama_pelanggan', '')).strip(),
                'am_id': str(row.get('am_id', '')).strip(),
                'produk': str(row.get('produk', '')).strip(),
                'kategori': str(row.get('kategori', 'C3mr')).strip(),
                'start_date': str(row.get('start_date', '')).strip(),
                'end_date': str(row.get('end_date', '')).strip(),
                'jumlah_tagihan': str(row.get('jumlah_tagihan', '0')).strip(),
                'status_invoice': str(row.get('status_invoice', 'Belum Terkirim')).strip(),
                'progres_pembayaran': str(row.get('progres_pembayaran', '0')).strip()
            }
            
            # Validate required fields
            if customer_data['no_akun'] and customer_data['nama_pelanggan']:
                customers.append(customer_data)
                
        return customers
    except Exception as e:
        current_app.logger.error(f"Error parsing Excel: {str(e)}")
        return None

def parse_pdf_data(file_path):
    """Parse PDF file and extract customer data using pattern matching"""
    try:
        text = extract_text_from_pdf(file_path)
        if not text:
            return None
            
        customers = []
        lines = text.split('\n')
        
        # Simple pattern matching for customer data
        # This is a basic implementation - you may need to adjust based on your PDF format
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Try to extract customer information using regex patterns
            # Adjust these patterns based on your PDF format
            patterns = {
                'no_akun': r'(?:No\.?\s*Akun|Account\s*No\.?)[:\s]+([A-Z0-9\-]+)',
                'nama_pelanggan': r'(?:Nama|Name)[:\s]+([A-Za-z\s]+)',
                'produk': r'(?:Produk|Product)[:\s]+([A-Za-z0-9\s]+)',
                'jumlah_tagihan': r'(?:Tagihan|Bill|Amount)[:\s]+(?:Rp\.?\s*)?([0-9,\.]+)'
            }
            
            customer_data = {}
            for field, pattern in patterns.items():
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    customer_data[field] = match.group(1).strip()
            
            if len(customer_data) >= 2:  # At least 2 fields found
                # Set default values for missing fields
                customer_data.setdefault('kategori', 'C3mr')
                customer_data.setdefault('status_invoice', 'Belum Terkirim')
                customer_data.setdefault('progres_pembayaran', '0')
                customer_data.setdefault('am_id', '')
                customer_data.setdefault('start_date', '')
                customer_data.setdefault('end_date', '')
                
                customers.append(customer_data)
        
        return customers if customers else None
    except Exception as e:
        current_app.logger.error(f"Error parsing PDF: {str(e)}")
        return None

@upload_bp.route('/api/pelanggan/bulk-upload', methods=['POST'])
def bulk_upload():
    """Handle bulk upload of customer data"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file size
        if request.content_length > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Maximum size is 16MB'}), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Please use CSV, PDF, or Excel files'}), 400
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        try:
            # Parse file based on extension
            file_ext = filename.rsplit('.', 1)[1].lower()
            customers_data = None
            
            if file_ext == 'csv':
                customers_data = parse_csv_data(file_path)
            elif file_ext in ['xlsx', 'xls']:
                customers_data = parse_excel_data(file_path)
            elif file_ext == 'pdf':
                customers_data = parse_pdf_data(file_path)
            
            if customers_data is None:
                return jsonify({'error': 'Failed to parse file or no valid data found'}), 400
            
            if not customers_data:
                return jsonify({'error': 'No customer data found in file'}), 400
            
            # Here you would typically save the data to your database
            # For now, we'll just return the count of imported records
            imported_count = len(customers_data)
            
            # Log the successful import
            current_app.logger.info(f"Successfully imported {imported_count} customers from {filename}")
            
            return jsonify({
                'message': 'File uploaded and processed successfully',
                'imported_count': imported_count,
                'filename': filename
            }), 200
            
        finally:
            # Clean up temporary file
            try:
                os.remove(file_path)
            except OSError:
                pass
                
    except Exception as e:
        current_app.logger.error(f"Error in bulk upload: {str(e)}")
        return jsonify({'error': 'Internal server error during file upload'}), 500

@upload_bp.route('/api/upload/template', methods=['GET'])
def download_template():
    """Download CSV template for bulk upload"""
    try:
        # Create CSV template
        template_data = [
            {
                'no_akun': 'EXAMPLE001',
                'nama_pelanggan': 'PT Example Company',
                'am_id': '1',
                'produk': 'Product Example',
                'kategori': 'C3mr',
                'start_date': '2024-01-01',
                'end_date': '2024-12-31',
                'jumlah_tagihan': '1000000',
                'status_invoice': 'Belum Terkirim',
                'progres_pembayaran': '0'
            }
        ]
        
        # Create temporary CSV file
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=template_data[0].keys())
        writer.writeheader()
        writer.writerows(template_data)
        
        csv_content = output.getvalue()
        output.close()
        
        return current_app.response_class(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=template_pelanggan.csv'}
        )
        
    except Exception as e:
        current_app.logger.error(f"Error generating template: {str(e)}")
        return jsonify({'error': 'Failed to generate template'}), 500

