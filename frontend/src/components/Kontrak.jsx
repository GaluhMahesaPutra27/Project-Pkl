import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  Building,
  Calendar,
  Filter,
  Search,
  Download,
  X,
  ChevronDown,
  Eye,
  Paperclip
} from 'lucide-react'

export default function Kontrak() {
  const { user } = useAuth()
  const [kontrak, setKontrak] = useState([])
  const [filteredKontrak, setFilteredKontrak] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [segmenFilter, setSegmenFilter] = useState('all')
  const [transactionFilter, setTransactionFilter] = useState('all')

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingKontrak, setEditingKontrak] = useState(null)
  const [segmenPic, setSegmenPic] = useState({})

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)

  // PDF states
  const [pdfFiles, setPdfFiles] = useState([])
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // File upload state for form
  const [selectedFile, setSelectedFile] = useState(null)

  // Bulk delete states
  const [selectedKontrak, setSelectedKontrak] = useState([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const handlePdfSelect = (pdf) => {
    setSelectedPdf(pdf)
    setDropdownOpen(false)
    setShowPdfModal(true)
  }

  const closePdfModal = () => {
    setShowPdfModal(false)
    setSelectedPdf(null)
  }

  const formDataInitialState = {
    no_kontrak: '',
    tanggal_kontrak: '',
    nilai_kontrak: '',
    start_date: '',
    end_date: '',
    nama_pekerjaan: '',
    nama_customer: '',
    jenis_transaksi: 'Own Channel',
    segmen: 'Business',
    pic_name: ''
  }
  const [formData, setFormData] = useState(formDataInitialState)

  const fetchKontrak = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/kontrak', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok) {
        setKontrak(data.kontrak || [])
      } else {
        setError(data.error || 'Failed to fetch data')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPdfFiles = useCallback(async () => {
    setPdfLoading(true)
    try {
      const response = await fetch('/api/kontrak/pdf-list', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok) {
        setPdfFiles(data.pdf_list || [])
      } else {
        console.error('Failed to fetch PDF files:', data.error)
      }
    } catch (error) {
      console.error('Error fetching PDF files:', error)
    } finally {
      setPdfLoading(false)
    }
  }, [])

  const fetchSegmenPic = useCallback(async () => {
    try {
      const segments = ['Business', 'Government', 'Enterprise']
      const picData = {}
      for (const segment of segments) {
        const response = await fetch(`/api/segmen-pic/${segment}`, {
          credentials: 'include'
        })
        const data = await response.json()
        if (response.ok) {
          picData[segment] = data.pic_list
        }
      }
      setSegmenPic(picData)
    } catch (error) {
      console.error('Error fetching segmen PIC:', error)
    }
  }, [])

  useEffect(() => {
    fetchKontrak()
    fetchSegmenPic()
    fetchPdfFiles()
  }, [fetchKontrak, fetchSegmenPic, fetchPdfFiles])

  const applyFilters = useCallback(() => {
    let filtered = [...kontrak]

    if (startDateFilter) {
      filtered = filtered.filter(k => new Date(k.tanggal_kontrak) >= new Date(startDateFilter))
    }
    if (endDateFilter) {
      filtered = filtered.filter(k => new Date(k.tanggal_kontrak) <= new Date(endDateFilter))
    }

    if (segmenFilter !== 'all') {
      filtered = filtered.filter(k => k.segmen === segmenFilter)
    }

    if (transactionFilter !== 'all') {
      filtered = filtered.filter(k => k.jenis_transaksi === transactionFilter)
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(k =>
        k.no_kontrak?.toLowerCase().includes(lowercasedTerm) ||
        k.nama_pekerjaan?.toLowerCase().includes(lowercasedTerm) ||
        k.nama_customer?.toLowerCase().includes(lowercasedTerm) ||
        k.pic_name?.toLowerCase().includes(lowercasedTerm)
      )
    }

    setFilteredKontrak(filtered)
  }, [kontrak, searchTerm, startDateFilter, endDateFilter, segmenFilter, transactionFilter])

  useEffect(() => {
    applyFilters()
  }, [kontrak, searchTerm, startDateFilter, endDateFilter, segmenFilter, transactionFilter, applyFilters])

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      setError('Pilih file untuk diupload')
      return
    }
    const uploadFormData = new FormData()
    uploadFormData.append('file', uploadFile)
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/kontrak/bulk-upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      })
      const data = await response.json()
      if (response.ok) {
        setSuccess(`Berhasil mengupload ${data.imported_count} kontrak`)
        setShowBulkUpload(false)
        setUploadFile(null)
        fetchKontrak()
      } else {
        setError(data.error || 'Upload gagal')
      }
    } catch (error) {
      setError('Network error saat upload')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // If there's a file, use FormData, otherwise use JSON
      if (selectedFile && !editingKontrak) {
        const formDataToSend = new FormData()
        
        // Add all form fields
        Object.keys(formData).forEach(key => {
          if (formData[key]) {
            formDataToSend.append(key, formData[key])
          }
        })
        
        // Add file
        formDataToSend.append('file', selectedFile)
        
        const response = await fetch('/api/kontrak', {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        })
        
        const data = await response.json()
        if (response.ok) {
          setSuccess('Kontrak berhasil dibuat dengan file PDF')
          setShowAddForm(false)
          resetForm()
          fetchKontrak()
          fetchPdfFiles() // Refresh PDF list
        } else {
          setError(data.error || 'Operasi gagal')
        }
      } else {
        // Regular JSON submission for edit or no file
        const url = editingKontrak ? `/api/kontrak/${editingKontrak.id}` : '/api/kontrak'
        const method = editingKontrak ? 'PUT' : 'POST'
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        })
        const data = await response.json()
        if (response.ok) {
          setSuccess(editingKontrak ? 'Kontrak berhasil diupdate' : 'Kontrak berhasil dibuat')
          setShowAddForm(false)
          setEditingKontrak(null)
          resetForm()
          fetchKontrak()
        } else {
          setError(data.error || 'Operasi gagal')
        }
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (kontrakData) => {
    setEditingKontrak(kontrakData)
    setFormData({
      ...kontrakData,
      tanggal_kontrak: kontrakData.tanggal_kontrak,
      nilai_kontrak: kontrakData.nilai_kontrak.toString(),
      start_date: kontrakData.start_date || '',
      end_date: kontrakData.end_date || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (kontrakId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kontrak ini?')) return
    try {
      const response = await fetch(`/api/kontrak/${kontrakId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setSuccess('Kontrak berhasil dihapus')
        fetchKontrak()
        fetchPdfFiles() // Refresh PDF list
      } else {
        const data = await response.json()
        setError(data.error || 'Gagal menghapus')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleFileUpload = async (kontrakId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(`/api/kontrak/${kontrakId}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      
      const data = await response.json()
      if (response.ok) {
        setSuccess('File PDF berhasil diupload')
        fetchKontrak()
        fetchPdfFiles()
      } else {
        setError(data.error || 'Upload gagal')
      }
    } catch (error) {
      setError('Network error saat upload')
    }
  }

  const resetForm = () => {
    setFormData(formDataInitialState)
    setSelectedFile(null)
  }

  // Bulk delete functions
  const handleSelectKontrak = (kontrakId) => {
    setSelectedKontrak(prev => {
      if (prev.includes(kontrakId)) {
        return prev.filter(id => id !== kontrakId)
      } else {
        return [...prev, kontrakId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedKontrak.length === filteredKontrak.length) {
      setSelectedKontrak([])
    } else {
      setSelectedKontrak(filteredKontrak.map(k => k.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedKontrak.length === 0) {
      setError('Pilih kontrak yang ingin dihapus')
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedKontrak.length} kontrak yang dipilih?`)) {
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/kontrak/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ kontrak_ids: selectedKontrak }),
      })

      const data = await response.json()
      if (response.ok) {
        setSuccess(`Berhasil menghapus ${data.deleted_count} kontrak`)
        setSelectedKontrak([])
        fetchKontrak()
        fetchPdfFiles()
      } else {
        setError(data.error || 'Gagal menghapus kontrak')
      }
    } catch (error) {
      setError('Network error saat menghapus')
    } finally {
      setLoading(false)
    }
  }

  const calculatePeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return '-'
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) return 'Invalid'
    
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.round(diffDays / 30.44) // Average days per month
    
    if (diffMonths < 1) {
      return `${diffDays} hari`
    } else if (diffMonths < 12) {
      return `${diffMonths} bulan`
    } else {
      const years = Math.floor(diffMonths / 12)
      const remainingMonths = diffMonths % 12
      if (remainingMonths === 0) {
        return `${years} tahun`
      } else {
        return `${years} tahun ${remainingMonths} bulan`
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getSegmenBadge = (segmen) => {
    const colors = {
      'Business': 'bg-blue-100 text-blue-800',
      'Government': 'bg-green-100 text-green-800',
      'Enterprise': 'bg-purple-100 text-purple-800'
    }
    return <Badge className={colors[segmen] || 'bg-gray-100 text-gray-800'}>{segmen}</Badge>
  }

  const segmenOptions = [
    { value: 'all', label: 'Semua Segmen' },
    { value: 'Business', label: 'Business' },
    { value: 'Government', label: 'Government' },
    { value: 'Enterprise', label: 'Enterprise' },
  ]

  const transactionOptions = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'Own Channel', label: 'Own Channel' },
    { value: 'GTMA', label: 'GTMA' },
    { value: 'NGTMA', label: 'NGTMA' },
  ]

  if (loading && kontrak.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kontrak Management</h1>
          <p className="text-gray-600">Kelola data kontrak dan dokumen</p>
        </div>
        
        {user?.role !== 'am' && (
          <div className="flex gap-2">
            {selectedKontrak.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus ({selectedKontrak.length})
              </Button>
            )}
            
            <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Upload Excel/CSV</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Bulk Kontrak</DialogTitle>
                  <DialogDescription>Upload file CSV atau Excel untuk import data kontrak secara massal.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Pilih File (CSV/Excel)</label>
                    <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setUploadFile(e.target.files[0])} required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowBulkUpload(false)}>Batal</Button>
                    <Button type="submit" disabled={loading || !uploadFile}>{loading ? 'Mengupload...' : 'Upload'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingKontrak(null) }}><Plus className="h-4 w-4 mr-2" />Tambah Kontrak</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingKontrak ? 'Edit Kontrak' : 'Tambah Kontrak Baru'}</DialogTitle>
                  <DialogDescription>{editingKontrak ? 'Update data kontrak' : 'Masukkan data kontrak baru'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* No Kontrak */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">No Kontrak</label>
                      <Input 
                        value={formData.no_kontrak} 
                        onChange={(e) => setFormData({...formData, no_kontrak: e.target.value})} 
                        placeholder="Masukkan nomor kontrak"
                        required 
                      />
                    </div>

                    {/* Tanggal Kontrak */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tanggal Kontrak</label>
                      <Input 
                        type="date" 
                        value={formData.tanggal_kontrak} 
                        onChange={(e) => setFormData({...formData, tanggal_kontrak: e.target.value})} 
                        required 
                      />
                    </div>

                    {/* Nilai Kontrak */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nilai Kontrak</label>
                      <Input 
                        type="number" 
                        value={formData.nilai_kontrak} 
                        onChange={(e) => setFormData({...formData, nilai_kontrak: e.target.value})} 
                        placeholder="Masukkan nilai kontrak"
                        required 
                      />
                    </div>

                    {/* Tanggal Mulai */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                      <Input 
                        type="date" 
                        value={formData.start_date} 
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                        required 
                      />
                    </div>

                    {/* Tanggal Selesai */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tanggal Selesai</label>
                      <Input 
                        type="date" 
                        value={formData.end_date} 
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Nama Pekerjaan - Full Width */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nama Pekerjaan</label>
                    <Input 
                      value={formData.nama_pekerjaan} 
                      onChange={(e) => setFormData({...formData, nama_pekerjaan: e.target.value})} 
                      placeholder="Masukkan nama pekerjaan"
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Customer */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nama Customer</label>
                      <Input 
                        value={formData.nama_customer} 
                        onChange={(e) => setFormData({...formData, nama_customer: e.target.value})} 
                        placeholder="Masukkan nama customer"
                        required 
                      />
                    </div>

                    {/* Jenis Transaksi */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Jenis Transaksi</label>
                      <Select 
                        value={formData.jenis_transaksi} 
                        onValueChange={(value) => setFormData({...formData, jenis_transaksi: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis transaksi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Own Channel">Own Channel</SelectItem>
                          <SelectItem value="GTMA">GTMA</SelectItem>
                          <SelectItem value="NGTMA">NGTMA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Segmen */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Segmen</label>
                      <Select 
                        value={formData.segmen} 
                        onValueChange={(value) => { setFormData({...formData, segmen: value, pic_name: ''}) }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih segmen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Government">Government</SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* AM */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">AM</label>
                      <Select 
                        value={formData.pic_name} 
                        onValueChange={(value) => setFormData({...formData, pic_name: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih AM" />
                        </SelectTrigger>
                        <SelectContent>
                          {(segmenPic[formData.segmen] || []).map((pic) => (
                            <SelectItem key={pic} value={pic}>{pic}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                    
                  {/* File Upload Field - Only show for new kontrak */}
                  {!editingKontrak && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Upload File PDF (Opsional)</label>
                      <div className="space-y-2">
                        <Input 
                          type="file" 
                          accept=".pdf" 
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {selectedFile && (
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                            <Paperclip className="h-4 w-4 mr-2" />
                            <span>{selectedFile.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : (editingKontrak ? 'Update' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-40">
              <label className="text-sm font-medium mb-1 block">Tanggal Mulai</label>
              <Input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
            </div>
            <div className="w-full md:w-40">
              <label className="text-sm font-medium mb-1 block">Tanggal Akhir</label>
              <Input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
            </div>
            <div className="w-full md:w-40">
              <label className="text-sm font-medium mb-1 block">Segmen</label>
              <Select value={segmenFilter} onValueChange={setSegmenFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {segmenOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40">
              <label className="text-sm font-medium mb-1 block">Jenis Transaksi</label>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {transactionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:flex-1">
              <label className="text-sm font-medium mb-1 block">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Cari kontrak..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> 
            Lihat PDF Kontrak
          </CardTitle>
          <CardDescription>Pilih kontrak untuk melihat file PDF yang sudah diupload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full justify-between"
              disabled={pdfLoading}
            >
              {selectedPdf ? selectedPdf.filename : pdfLoading ? 'Memuat...' : 'Pilih PDF Kontrak'}
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {pdfFiles.length > 0 ? (
                  pdfFiles.map((pdf) => (
                    <button
                      key={pdf.id}
                      onClick={() => handlePdfSelect(pdf)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-sm">{pdf.no_kontrak}</div>
                        <div className="text-xs text-gray-500">{pdf.nama_pekerjaan}</div>
                        <div className="text-xs text-gray-400">{pdf.nama_customer}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{pdf.file_size}</div>
                        <div className="text-xs text-gray-400">{pdf.upload_date}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                    Belum ada file PDF yang diupload
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kontrak Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kontrak</CardTitle>
          <CardDescription>Total {filteredKontrak.length} kontrak ditemukan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {user?.role !== 'am' && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedKontrak.length === filteredKontrak.length && filteredKontrak.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                  )}
                  <TableHead>No. Kontrak</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Pekerjaan</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Jenis Transaksi</TableHead>
                  <TableHead>Segmen</TableHead>
                  <TableHead>AM</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKontrak.length > 0 ? (
                  filteredKontrak.map((k) => (
                    <TableRow key={k.id}>
                      {user?.role !== 'am' && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedKontrak.includes(k.id)}
                            onChange={() => handleSelectKontrak(k.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{k.no_kontrak}</TableCell>
                      <TableCell>{k.tanggal_kontrak}</TableCell>
                      <TableCell>{formatCurrency(k.nilai_kontrak)}</TableCell>
                      <TableCell>{calculatePeriod(k.start_date, k.end_date)}</TableCell>
                      <TableCell>{k.nama_pekerjaan}</TableCell>
                      <TableCell>{k.nama_customer}</TableCell>
                      <TableCell>{k.jenis_transaksi}</TableCell>
                      <TableCell>{getSegmenBadge(k.segmen)}</TableCell>
                      <TableCell>{k.pic_name}</TableCell>
                      <TableCell>
                        {k.file_path ? (
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/api/kontrak/${k.id}/view`, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`/api/kontrak/${k.id}/download`, '_blank')}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          user?.role !== 'am' && (
                            <div>
                              <Input 
                                type="file" 
                                accept=".pdf" 
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleFileUpload(k.id, e.target.files[0])
                                  }
                                }}
                                className="hidden"
                                id={`file-${k.id}`}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => document.getElementById(`file-${k.id}`).click()}
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user?.role !== 'am' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(k)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(k.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Tidak ada data kontrak ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PDF Modal Viewer */}
      {showPdfModal && selectedPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPdf.no_kontrak}</h3>
                  <p className="text-sm text-gray-500">{selectedPdf.nama_pekerjaan}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(selectedPdf.download_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="ghost" onClick={closePdfModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 p-4">
              <div className="w-full h-full bg-gray-100 rounded-lg">
                <iframe
                  src={selectedPdf.view_url}
                  className="w-full h-full rounded-lg"
                  title={`PDF Viewer - ${selectedPdf.no_kontrak}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

