import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Filter,
  Edit,
  Search,
  Upload,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  CreditCard,
  User as UserIcon,
  RotateCcw,
  FileText
} from 'lucide-react';

export default function Billing() {
  const { user } = useAuth();
  const [pelanggan, setPelanggan] = useState([]);
  const [filteredPelanggan, setFilteredPelanggan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    period: 'all',
    am: 'all',
    paymentStatus: 'all',
    invoiceStatus: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState(null);
  const [amList, setAmList] = useState([]);
  const [pelangganToDelete, setPelangganToDelete] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    no_akun: '',
    nama_pelanggan: '',
    am_id: '',
    produk: '',
    kategori: 'C3mr',
    start_date: '',
    end_date: '',
    jumlah_tagihan: '',
    status_invoice: 'Belum Terkirim',
    progres_pembayaran: '0'
  });

  const filterOptions = {
    categories: [
      { value: 'all', label: 'Semua Kategori' },
      { value: 'C3mr', label: 'C3mr' },
      { value: 'CYC', label: 'CYC' },
      { value: 'CR', label: 'CR' }
    ],
    periods: [
      { value: 'all', label: 'Semua Periode' },
      { value: '1_bulan', label: '1 Bulan' },
      { value: '3_bulan', label: '3 Bulan' },
      { value: '6_bulan', label: '6 Bulan' },
      { value: '12_bulan', label: '12 Bulan' },
      { value: '2_tahun', label: '2 Tahun' },
      { value: '5_tahun', label: '5 Tahun' }
    ],
    paymentStatus: [
      { value: 'all', label: 'Semua Status' },
      { value: 'Belum Bayar', label: 'Belum Bayar' },
      { value: 'Partial', label: 'Partial' },
      { value: 'Lunas', label: 'Lunas' }
    ],
    invoiceStatus: [
      { value: 'all', label: 'Semua Invoice' },
      { value: 'Belum Terkirim', label: 'Belum Terkirim' },
      { value: 'Terkirim', label: 'Terkirim' }
    ],
    itemsPerPage: [
      { value: 5, label: '5' },
      { value: 10, label: '10' },
      { value: 25, label: '25' },
      { value: 50, label: '50' },
      { value: 100, label: '100' }
    ]
  };

  const fetchPelanggan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (user.role !== 'am' && filters.am !== 'all') {
        params.append('am_id', filters.am);
      }
      
      const response = await fetch(`/api/pelanggan?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Gagal memuat data pelanggan' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPelanggan(data.pelanggan || []);
    } catch (error) {
      setError(error.message);
      setPelanggan([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters.am]);

  const fetchAmList = useCallback(async () => {
    if (user?.role === 'am') return;
    try {
      const response = await fetch('/api/am-list', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Gagal memuat daftar AM');
        return;
      }
      const data = await response.json();
      setAmList(data.am_list || []);
    } catch (error) {
      console.error('Error fetching AM list:', error);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user) {
      if (user.role !== 'am') {
        fetchAmList();
      }
      fetchPelanggan();
    }
  }, [user, filters.am, fetchPelanggan, fetchAmList]);

  const applyFilters = useCallback(() => {
    let filtered = [...pelanggan];
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.kategori === filters.category);
    }

    if (filters.period !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.period) {
        case '1_bulan': filterDate.setMonth(now.getMonth() - 1); break;
        case '3_bulan': filterDate.setMonth(now.getMonth() - 3); break;
        case '6_bulan': filterDate.setMonth(now.getMonth() - 6); break;
        case '12_bulan': filterDate.setFullYear(now.getFullYear() - 1); break;
        case '2_tahun': filterDate.setFullYear(now.getFullYear() - 2); break;
        case '5_tahun': filterDate.setFullYear(now.getFullYear() - 5); break;
        default: break;
      }
      
      if (filters.period !== 'all') {
        filtered = filtered.filter(p => new Date(p.start_date) >= filterDate);
      }
    }

    if (filters.paymentStatus !== 'all') {
      const statusToFilter = filters.paymentStatus === 'Partial' ? 'Cicil' : filters.paymentStatus;
      filtered = filtered.filter(p => p.status_pembayaran === statusToFilter);
    }

    if (filters.invoiceStatus !== 'all') {
      filtered = filtered.filter(p => p.status_invoice === filters.invoiceStatus);
    }

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.no_akun?.toLowerCase().includes(searchTerm) ||
        p.nama_pelanggan?.toLowerCase().includes(searchTerm) ||
        p.nama_am?.toLowerCase().includes(searchTerm) ||
        p.produk?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredPelanggan(filtered);
    setCurrentPage(1);
  }, [pelanggan, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      period: 'all',
      am: 'all',
      paymentStatus: 'all',
      invoiceStatus: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== ''
  );

  const totalItems = filteredPelanggan.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredPelanggan.slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(page);
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) { setError('Pilih file untuk diupload'); return; }
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', uploadFile);
    setUploading(true); setError(''); setSuccess('');
    
    try {
      const response = await fetch('/api/pelanggan/bulk-upload', { method: 'POST', credentials: 'include', body: uploadFormData });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || `Berhasil mengupload ${data.imported_count} pelanggan`);
        setShowBulkUpload(false); setUploadFile(null); fetchPelanggan();
      } else {
        const errorMessage = data.error + (data.details ? `: ${data.details.join(', ')}` : '');
        setError(errorMessage || 'Upload gagal');
      }
    } catch (error) { setError('Terjadi kesalahan jaringan saat upload.'); } finally { setUploading(false); }
  };

  const handleExport = () => {
    const headers = ["No Akun", "Nama Pelanggan", "AM", "Produk", "Kategori", "Start Date", "End Date", "Jumlah Tagihan", "Status Invoice", "Progres Pembayaran", "Status Pembayaran"];
    const rows = filteredPelanggan.map(item => [
      item.no_akun, item.nama_pelanggan, item.nama_am, item.produk, item.kategori,
      item.start_date, item.end_date, item.jumlah_tagihan, item.status_invoice,
      item.progres_pembayaran, item.status_pembayaran === 'Cicil' ? 'Partial' : item.status_pembayaran
    ]);
    
    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `data_pelanggan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    
    try {
      const url = editingPelanggan ? `/api/pelanggan/${editingPelanggan.id}` : '/api/pelanggan';
      const method = editingPelanggan ? 'PUT' : 'POST';
      
      let dataToSend = formData;
      if (editingPelanggan) {
        dataToSend = { progres_pembayaran: formData.progres_pembayaran, status_invoice: formData.status_invoice };
      }
      
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dataToSend) });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || (editingPelanggan ? 'Pelanggan berhasil diupdate' : 'Pelanggan berhasil dibuat'));
        setShowAddForm(false); setEditingPelanggan(null); resetForm(); fetchPelanggan();
      } else { setError(data.error || 'Operasi gagal'); }
    } catch (error) { setError('Terjadi kesalahan jaringan'); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!pelangganToDelete) return;
    setLoading(true); setError(''); setSuccess('');
    
    try {
      const response = await fetch(`/api/pelanggan/${pelangganToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      
      if (response.ok) {
        setSuccess(`Pelanggan "${pelangganToDelete.nama_pelanggan}" berhasil dihapus.`);
        fetchPelanggan();
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal menghapus pelanggan.');
      }
    } catch (error) { setError('Terjadi kesalahan jaringan saat mencoba menghapus.'); } finally { setLoading(false); setPelangganToDelete(null); }
  };

  const handleEdit = (pelangganData) => {
    setEditingPelanggan(pelangganData);
    setFormData({ 
      ...pelangganData, 
      start_date: pelangganData.start_date, 
      end_date: pelangganData.end_date, 
      jumlah_tagihan: pelangganData.jumlah_tagihan.toString(), 
      progres_pembayaran: pelangganData.progres_pembayaran.toString() 
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({ 
      no_akun: '', nama_pelanggan: '', am_id: '', produk: '', kategori: 'C3mr', 
      start_date: '', end_date: '', jumlah_tagihan: '', 
      status_invoice: 'Belum Terkirim', progres_pembayaran: '0' 
    });
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const getPaymentStatusBadge = (status) => {
    let label = status;
    let className = 'bg-gray-200 text-gray-800';

    switch (status) {
      case 'Lunas':
        className = 'bg-green-100 text-green-800 hover:bg-green-200';
        break;
      case 'Cicil':
        label = 'Partial';
        className = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        break;
      case 'Belum Bayar':
        className = 'bg-red-100 text-red-800 hover:bg-red-200';
        break;
    }
    return <Badge className={className}>{label}</Badge>;
  };

  const getInvoiceStatusBadge = (status) => {
    const className = status === 'Terkirim' 
      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
      : 'bg-red-100 text-red-800 hover:bg-red-200';
    return <Badge className={className}>{status}</Badge>;
  };
  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-gray-600">Kelola data pelanggan dan tagihan</p>
        </div>

        {user?.role !== 'am' && (
          <div className="flex flex-wrap gap-2">
            {/* --- MODIFIED: Bulk Upload Dialog --- */}
            <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Bulk Pelanggan</DialogTitle>
                  <DialogDescription>
                    Upload file CSV atau Excel untuk import data pelanggan secara massal.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-upload-file">Pilih File (.csv, .xlsx, .xls)</Label>
                    <Input 
                      id="bulk-upload-file"
                      type="file" 
                      // Accept CSV and Excel formats
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                      onChange={(e) => setUploadFile(e.target.files[0])} 
                      required 
                    />
                    {uploadFile && (
                      <p className="text-sm text-gray-600 mt-1">
                        File terpilih: {uploadFile.name}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowBulkUpload(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={uploading || !uploadFile}
                    >
                      {uploading ? 'Mengupload...' : 'Upload'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {/* --- END OF MODIFICATION --- */}

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>

            {/* Add/Edit Manual Dialog */}
            <Dialog open={showAddForm} onOpenChange={(isOpen) => { setShowAddForm(isOpen); if (!isOpen) { setEditingPelanggan(null); resetForm(); } }}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingPelanggan(null); setShowAddForm(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPelanggan ? 'Edit Pelanggan' : 'Tambah Pelanggan Manual'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPelanggan ? 'Hanya progres bayar dan status invoice yang dapat diubah.' : 'Isi detail pelanggan baru di bawah ini.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    {/* Fields disabled during edit */}
                    <div className="space-y-2">
                      <Label htmlFor="no_akun">No. Akun</Label>
                      <Input id="no_akun" value={formData.no_akun} onChange={(e) => setFormData({ ...formData, no_akun: e.target.value })} required={!editingPelanggan} disabled={!!editingPelanggan} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nama_pelanggan">Nama Pelanggan</Label>
                      <Input id="nama_pelanggan" value={formData.nama_pelanggan} onChange={(e) => setFormData({ ...formData, nama_pelanggan: e.target.value })} required={!editingPelanggan} disabled={!!editingPelanggan} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="am_id">Account Manager (AM)</Label>
                      <Select value={formData.am_id} onValueChange={(value) => setFormData({ ...formData, am_id: value })} required={!editingPelanggan} disabled={!!editingPelanggan}>
                        <SelectTrigger id="am_id"><SelectValue placeholder="Pilih AM" /></SelectTrigger>
                        <SelectContent>{amList.map((am) => (<SelectItem key={am.id} value={am.id.toString()}>{am.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="produk">Produk</Label>
                      <Input id="produk" value={formData.produk} onChange={(e) => setFormData({ ...formData, produk: e.target.value })} required={!editingPelanggan} disabled={!!editingPelanggan} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kategori">Kategori</Label>
                      <Select value={formData.kategori} onValueChange={(value) => setFormData({ ...formData, kategori: value })} disabled={!!editingPelanggan}>
                        <SelectTrigger id="kategori"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="C3mr">C3mr</SelectItem><SelectItem value="CYC">CYC</SelectItem><SelectItem value="CR">CR</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Tanggal Mulai</Label>
                      <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required={!editingPelanggan} disabled={!!editingPelanggan} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Tanggal Berakhir</Label>
                      <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required={!editingPelanggan} disabled={!!editingPelanggan} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jumlah_tagihan">Jumlah Tagihan (Rp)</Label>
                      <Input id="jumlah_tagihan" type="number" value={formData.jumlah_tagihan} onChange={(e) => setFormData({ ...formData, jumlah_tagihan: e.target.value })} required={!editingPelanggan} disabled={!!editingPelanggan} />
                    </div>
                    {/* Fields editable */}
                    <div className="space-y-2">
                      <Label htmlFor="status_invoice" className={editingPelanggan ? "text-blue-600 font-semibold" : ""}>Status Invoice</Label>
                      <Select value={formData.status_invoice} onValueChange={(value) => setFormData({ ...formData, status_invoice: value })}>
                        <SelectTrigger id="status_invoice"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Belum Terkirim">Belum Terkirim</SelectItem><SelectItem value="Terkirim">Terkirim</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="progres_pembayaran" className={editingPelanggan ? "text-blue-600 font-semibold" : ""}>Progres Pembayaran (Rp)</Label>
                      <Input id="progres_pembayaran" type="number" value={formData.progres_pembayaran} onChange={(e) => setFormData({ ...formData, progres_pembayaran: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
                    <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : (editingPelanggan ? 'Update' : 'Simpan')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filter & Search Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filter & Pencarian</CardTitle>
            {hasActiveFilters && (<Button variant="outline" size="sm" onClick={resetFilters}><RotateCcw className="h-4 w-4 mr-2" />Reset Filter</Button>)}
          </div>
          <CardDescription>Gunakan filter di bawah untuk menyaring data pelanggan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori</Label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.categories.map((cat) => (<Button key={cat.value} variant={filters.category === cat.value ? 'default' : 'outline'} size="sm" onClick={() => updateFilter('category', cat.value)}>{cat.label}</Button>))}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px] max-w-[300px]">
                <Label htmlFor="search-input" className="block mb-1">Cari Data</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /><Input id="search-input" placeholder="No akun, nama, AM..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} className="pl-10" /></div>
              </div>
              <div className="min-w-[140px]">
                <Label className="block mb-1">Periode</Label>
                <Select value={filters.period} onValueChange={(v) => updateFilter('period', v)}><SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{filterOptions.periods.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>
              </div>
              {user?.role !== 'am' && (
                <div className="min-w-[140px]">
                  <Label className="block mb-1">AM</Label>
                  <Select value={filters.am} onValueChange={(v) => updateFilter('am', v)}><SelectTrigger><UserIcon className="h-4 w-4 mr-2" /><SelectValue placeholder="Pilih AM" /></SelectTrigger><SelectContent><SelectItem value="all">Semua AM</SelectItem>{amList.map((am) => (<SelectItem key={am.id} value={am.id.toString()}>{am.name}</SelectItem>))}</SelectContent></Select>
                </div>
              )}
              <div className="min-w-[140px]">
                <Label className="block mb-1">Status Bayar</Label>
                <Select value={filters.paymentStatus} onValueChange={(v) => updateFilter('paymentStatus', v)}><SelectTrigger><CreditCard className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{filterOptions.paymentStatus.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>
              </div>
              <div className="min-w-[140px]">
                <Label className="block mb-1">Status Invoice</Label>
                <Select value={filters.invoiceStatus} onValueChange={(v) => updateFilter('invoiceStatus', v)}><SelectTrigger><FileText className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{filterOptions.invoiceStatus.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Data Pelanggan</CardTitle>
              <CardDescription>{totalItems > 0 ? `Menampilkan ${totalItems} data pelanggan${hasActiveFilters ? ' (terfilter)' : ''}` : 'Tidak ada data pelanggan'}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Tampilkan:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>{filterOptions.itemsPerPage.map((o) => (<SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
              <span className="text-sm">per halaman</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada data ditemukan. Coba ubah filter Anda.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Akun</TableHead><TableHead>Nama Pelanggan</TableHead><TableHead>AM</TableHead>
                      <TableHead>Produk</TableHead><TableHead>Kategori</TableHead><TableHead>Periode</TableHead>
                      <TableHead>Jumlah Tagihan</TableHead><TableHead>Status Invoice</TableHead><TableHead>Progres</TableHead>
                      <TableHead>Status Bayar</TableHead>
                      {user?.role !== 'am' && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.no_akun}</TableCell>
                        <TableCell>{item.nama_pelanggan}</TableCell><TableCell>{item.nama_am}</TableCell>
                        <TableCell>{item.produk}</TableCell><TableCell><Badge variant="outline">{item.kategori}</Badge></TableCell>
                        <TableCell className="text-sm">{item.start_date} - {item.end_date}</TableCell>
                        <TableCell>{formatCurrency(item.jumlah_tagihan)}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(item.status_invoice)}</TableCell>
                        <TableCell>{formatCurrency(item.progres_pembayaran)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(item.status_pembayaran)}</TableCell>
                        {user?.role !== 'am' && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setPelangganToDelete(item)}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle><AlertDialogDescription>Yakin ingin menghapus pelanggan "{item.nama_pelanggan}"? Tindakan ini permanen.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel onClick={() => setPelangganToDelete(null)}>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <div className="text-sm text-gray-600">Halaman {currentPage} dari {totalPages}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex gap-1">{getPageNumbers().map((p) => (<Button key={p} variant={currentPage === p ? 'default' : 'outline'} size="sm" onClick={() => goToPage(p)} className="w-9">{p}</Button>))}</div>
                    <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
