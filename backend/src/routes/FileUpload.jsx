import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
  acceptedFileTypes = '.csv,.pdf,.xlsx,.xls',
  maxFileSize = 16 * 1024 * 1024, // 16MB
  uploadEndpoint = '/api/pelanggan/bulk-upload',
  title = 'Upload File',
  description = 'Upload CSV, PDF, or Excel files to import data'
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState(null) // 'success', 'error', null
  const [uploadMessage, setUploadMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef(null)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file) => {
    if (!file) return 'No file selected'
    
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`
    }
    
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    const allowedTypes = acceptedFileTypes.split(',').map(type => type.trim())
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not supported. Allowed types: ${acceptedFileTypes}`
    }
    
    return null
  }

  const handleFileSelect = (file) => {
    const error = validateFile(file)
    if (error) {
      setUploadStatus('error')
      setUploadMessage(error)
      return
    }
    
    setSelectedFile(file)
    setUploadStatus(null)
    setUploadMessage('')
    setUploadProgress(0)
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('error')
      setUploadMessage('Please select a file first')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadStatus(null)
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (response.ok) {
        setUploadStatus('success')
        setUploadMessage(data.message || `Successfully uploaded ${data.imported_count || 0} records`)
        setSelectedFile(null)
        
        if (onUploadSuccess) {
          onUploadSuccess(data)
        }
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      setUploadStatus('error')
      setUploadMessage(error.message || 'Network error during upload')
      
      if (onUploadError) {
        onUploadError(error)
      }
    } finally {
      setUploading(false)
      setTimeout(() => {
        setUploadProgress(0)
      }, 2000)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus(null)
    setUploadMessage('')
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/upload/template', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_pelanggan.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to download template')
      }
    } catch (error) {
      setUploadStatus('error')
      setUploadMessage('Failed to download template')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Template Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium">
                Drag and drop your file here, or{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: {acceptedFileTypes} (max {formatFileSize(maxFileSize)})
              </p>
            </div>
          </div>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Selected File Display */}
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Status Messages */}
        {uploadStatus && uploadMessage && (
          <Alert variant={uploadStatus === 'error' ? 'destructive' : 'default'}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{uploadMessage}</AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

