import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Users, CreditCard, FileText, TrendingUp, Wifi, DollarSign, Target, CheckCircle, AlertCircle, MousePointer, Eye } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPelanggan: 0,
    totalKontrak: 0,
    totalTagihan: 0,
    pelangganLunas: 0,
    progresPembayaran: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedAm, setSelectedAm] = useState('all')
  const [amList, setAmList] = useState([])
  const [amProgressData, setAmProgressData] = useState([])
  const [filteredStats, setFilteredStats] = useState({
    totalTagihan: 0,
    progresPembayaran: 0
  })
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
    if (user?.role !== 'am') {
      fetchAmList()
      fetchAmProgressData()
    }
    // Start polling for updates
    startPolling()
    
    // Cleanup polling on unmount
    return () => {
      setIsPolling(false)
    }
  }, [])

  useEffect(() => {
    fetchFilteredStats()
  }, [selectedAm])

  // Polling untuk real-time updates
  useEffect(() => {
    let intervalId
    
    if (isPolling) {
      intervalId = setInterval(async () => {
        await checkForUpdates()
      }, 3000) // Check every 3 seconds untuk testing
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isPolling, lastUpdate])

  const fetchDashboardStats = async () => {
    try {
      // Fetch pelanggan data
      const pelangganResponse = await fetch('/api/pelanggan', {
        credentials: 'include'
      })
      const pelangganData = await pelangganResponse.json()
      
      // Fetch kontrak data
      const kontrakResponse = await fetch('/api/kontrak', {
        credentials: 'include'
      })
      const kontrakData = await kontrakResponse.json()

      // Fetch progres pembayaran data
      const progresResponse = await fetch('/api/progres-pembayaran', {
        credentials: 'include'
      })
      const progresData = await progresResponse.json()

      if (pelangganResponse.ok && kontrakResponse.ok && progresResponse.ok) {
        const pelanggan = pelangganData.pelanggan || []
        const kontrak = kontrakData.kontrak || []
        
        const totalTagihan = pelanggan.reduce((sum, p) => sum + p.jumlah_tagihan, 0)
        const pelangganLunas = pelanggan.filter(p => p.status_pembayaran === 'Lunas').length

        setStats({
          totalPelanggan: pelanggan.length,
          totalKontrak: kontrak.length,
          totalTagihan,
          pelangganLunas,
          progresPembayaran: progresData.total_progres_pembayaran || 0
        })

        // Set initial filtered stats
        setFilteredStats({
          totalTagihan: progresData.total_tagihan || totalTagihan,
          progresPembayaran: progresData.total_progres_pembayaran || 0
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAmList = async () => {
    try {
      const response = await fetch('/api/am-list', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAmList(data.am_list || [])
      }
    } catch (error) {
      console.error('Error fetching AM list:', error)
    }
  }

  const fetchAmProgressData = async () => {
    try {
      console.log('Fetching AM progress data...')
      const response = await fetch('/api/progres-pembayaran-per-am', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('AM progress data received:', data.am_progress)
        setAmProgressData(data.am_progress || [])
      } else {
        console.error('Failed to fetch AM progress data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching AM progress data:', error)
    }
  }

  const fetchFilteredStats = async () => {
    if (selectedAm === 'all') {
      setFilteredStats({
        totalTagihan: stats.totalTagihan,
        progresPembayaran: stats.progresPembayaran
      })
      return
    }

    try {
      const response = await fetch(`/api/progres-pembayaran?am_id=${selectedAm}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setFilteredStats({
          totalTagihan: data.total_tagihan || 0,
          progresPembayaran: data.total_progres_pembayaran || 0
        })
      }
    } catch (error) {
      console.error('Error fetching filtered stats:', error)
    }
  }

  const startPolling = () => {
    setIsPolling(true)
  }

  const stopPolling = () => {
    setIsPolling(false)
  }

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/last-update', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const newLastUpdate = data.last_update
        
        // Jika ada update baru, refresh data
        if (lastUpdate && newLastUpdate && new Date(newLastUpdate) > new Date(lastUpdate)) {
          console.log('Data updated, refreshing...', {
            oldUpdate: lastUpdate,
            newUpdate: newLastUpdate
          })
          await refreshAllData()
        } else if (!lastUpdate) {
          // Jika ini adalah check pertama, set lastUpdate tanpa refresh
          console.log('Initial last update set:', newLastUpdate)
        }
        
        setLastUpdate(newLastUpdate)
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
    }
  }

  const refreshAllData = async () => {
    console.log('Refreshing all data...')
    
    try {
      // Refresh dashboard stats
      await fetchDashboardStats()
      
      // Refresh AM progress data if user is admin/superadmin
      if (user?.role !== 'am') {
        await fetchAmProgressData()
      }
      
      // Refresh filtered stats
      await fetchFilteredStats()
      
      console.log('All data refreshed successfully')
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateProgressPercentage = () => {
    if (filteredStats.totalTagihan === 0) return 0
    return Math.round((filteredStats.progresPembayaran / filteredStats.totalTagihan) * 100)
  }

  const statCards = [
    {
      title: 'Total Pelanggan',
      value: stats.totalPelanggan,
      description: 'Pelanggan aktif',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Kontrak',
      value: stats.totalKontrak,
      description: 'Kontrak aktif',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Tagihan',
      value: formatCurrency(stats.totalTagihan),
      description: 'Nilai total tagihan',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      clickable: true
    },
    {
      title: 'Pelanggan Lunas',
      value: stats.pelangganLunas,
      description: 'Pembayaran selesai',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Wifi className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Selamat datang, {user?.name}!
            </h1>
            <p className="text-blue-100">
              Dashboard Monitoring Pelanggan Internet WiFi
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          
          if (stat.clickable) {
            return (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card className="relative hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:border-blue-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-full ${stat.bgColor} group-hover:bg-blue-100 transition-colors`}>
                        <Icon className={`h-4 w-4 ${stat.color} group-hover:text-blue-600 transition-colors`} />
                        <Eye className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 absolute top-1 right-1" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {stat.value}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-500 transition-colors">
                        {stat.description}
                      </p>
                      <p className="text-xs text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        💡 Klik untuk detail progres pembayaran
                      </p>
                    </CardContent>
                    {/* Indicator visual di pojok kanan atas */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xl">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                        <span>Detail Progres Pembayaran</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={refreshAllData}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        >
                          Refresh
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/debug/pelanggan-lunas', { credentials: 'include' })
                              if (response.ok) {
                                const data = await response.json()
                                console.log('Debug data pelanggan lunas:', data.debug_data)
                              }
                            } catch (error) {
                              console.error('Error fetching debug data:', error)
                            }
                          }}
                          className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200 transition-colors"
                        >
                          Debug
                        </button>
                        <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-500">
                          {isPolling ? 'Live Update' : 'Offline'}
                        </span>
                      </div>
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Ringkasan dan analisis pembayaran dari total tagihan
                      {lastUpdate && (
                        <span className="block text-xs text-gray-400 mt-1">
                          Terakhir diperbarui: {new Date(lastUpdate).toLocaleString('id-ID')}
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Filter AM - hanya untuk admin/superadmin */}
                    {user?.role !== 'am' && (
                      <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-blue-800 flex items-center space-x-2">
                            <Target className="h-4 w-4" />
                            <span>Filter Account Manager</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Select value={selectedAm} onValueChange={setSelectedAm}>
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Pilih Account Manager" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4" />
                                  <span>Semua Account Manager</span>
                                </div>
                              </SelectItem>
                              {amList.map((am) => (
                                <SelectItem key={am.id} value={am.id.toString()}>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>{am.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    )}

                    {/* Ringkasan Pembayaran */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-gray-200 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span>Total Tagihan</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(filteredStats.totalTagihan)}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Nilai keseluruhan</p>
                        </CardContent>
                      </Card>

                      <Card className="border-emerald-200 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-emerald-700 flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span>Pembayaran Diterima</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(filteredStats.progresPembayaran)}
                          </div>
                          <p className="text-xs text-emerald-600 mt-1">Sudah terbayar</p>
                        </CardContent>
                      </Card>

                      <Card className="border-red-200 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-red-700 flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span>Sisa Tagihan</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(filteredStats.totalTagihan - filteredStats.progresPembayaran)}
                          </div>
                          <p className="text-xs text-red-600 mt-1">Belum terbayar</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Progress Section */}
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-blue-900 flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <span>Progres Pembayaran</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-blue-800">Persentase Tercapai</span>
                          <Badge variant="outline" className="text-lg font-bold text-blue-700 border-blue-300">
                            {calculateProgressPercentage()}%
                          </Badge>
                        </div>
                        <Progress 
                          value={calculateProgressPercentage()} 
                          className="h-4 bg-blue-100" 
                        />
                        <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-900 mb-1">
                              {calculateProgressPercentage()}%
                            </div>
                            <div className="text-sm text-blue-700">
                              dari total tagihan telah dibayar
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tabel Progres per AM - hanya untuk admin/superadmin */}
                    {user?.role !== 'am' && selectedAm === 'all' && (
                      <Card className="border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                            <Users className="h-5 w-5 text-gray-600" />
                            <span>Progres Pembayaran per Account Manager</span>
                          </CardTitle>
                          <CardDescription>
                            Analisis performa pembayaran untuk setiap Account Manager
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader className="bg-gray-50">
                                <TableRow>
                                  <TableHead className="font-semibold text-gray-700">Account Manager</TableHead>
                                  <TableHead className="text-right font-semibold text-gray-700">Total Tagihan</TableHead>
                                  <TableHead className="text-right font-semibold text-gray-700">Pembayaran Diterima</TableHead>
                                  <TableHead className="text-right font-semibold text-gray-700">Sisa Tagihan</TableHead>
                                  <TableHead className="text-center font-semibold text-gray-700">Progress</TableHead>
                                  <TableHead className="text-center font-semibold text-gray-700">Total Pelanggan</TableHead>
                                  <TableHead className="text-center font-semibold text-gray-700">Pelanggan Lunas</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {amProgressData.map((amData, index) => (
                                  <TableRow key={amData.am_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                    <TableCell className="font-medium text-gray-900">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>{amData.nama_am}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-gray-900">
                                      {formatCurrency(amData.total_tagihan)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-emerald-600">
                                      {formatCurrency(amData.total_progres_pembayaran)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-red-600">
                                      {formatCurrency(amData.sisa_tagihan)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center space-x-3">
                                        <Progress value={amData.progress_percentage} className="h-2 flex-1" />
                                        <Badge 
                                          variant={amData.progress_percentage >= 80 ? "default" : amData.progress_percentage >= 50 ? "secondary" : "destructive"} 
                                          className="text-xs font-semibold min-w-[50px]"
                                        >
                                          {amData.progress_percentage}%
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className="font-medium">
                                        {amData.jumlah_pelanggan}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex flex-col items-center space-y-1">
                                        <Badge 
                                          variant={amData.pelanggan_lunas === amData.jumlah_pelanggan ? "default" : "secondary"} 
                                          className="font-medium"
                                        >
                                          {amData.pelanggan_lunas} / {amData.jumlah_pelanggan}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {amData.jumlah_pelanggan > 0 ? Math.round((amData.pelanggan_lunas / amData.jumlah_pelanggan) * 100) : 0}% lunas
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )
          }
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span>Ringkasan Billing</span>
            </CardTitle>
            <CardDescription>
              Status pembayaran pelanggan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Belum Bayar</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.totalPelanggan - stats.pelangganLunas - Math.floor(stats.totalPelanggan * 0.2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cicil</span>
                <span className="text-sm font-medium text-yellow-600">
                  {Math.floor(stats.totalPelanggan * 0.2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lunas</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.pelangganLunas}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Aktivitas Terbaru</span>
            </CardTitle>
            <CardDescription>
              Aktivitas sistem terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Dashboard diakses</p>
                  <p className="text-xs text-gray-500">Baru saja</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Sistem aktif</p>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Data tersinkronisasi</p>
                  <p className="text-xs text-gray-500">5 menit yang lalu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      {user?.role === 'am' && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Account Manager</CardTitle>
            <CardDescription>
              Anda dapat melihat data pelanggan yang menjadi tanggung jawab Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Sebagai Account Manager, Anda memiliki akses untuk melihat data pelanggan 
              yang ditugaskan kepada Anda. Gunakan menu Billing untuk mengelola data pelanggan.
            </p>
          </CardContent>
        </Card>
      )}

      {user?.role === 'superadmin' && (
        <Card>
          <CardHeader>
            <CardTitle>Panel Superadmin</CardTitle>
            <CardDescription>
              Akses penuh ke semua fitur sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Sebagai Superadmin, Anda memiliki akses penuh ke semua fitur termasuk 
              Management Akun untuk mengelola user Admin dan Account Manager.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

