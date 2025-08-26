import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import FileUpload from './FileUpload'
import { Upload } from 'lucide-react'

export default function UploadDialog({
  trigger,
  title = "Upload Data",
  description = "Upload CSV, PDF, or Excel files to import customer data",
  onUploadSuccess,
  onUploadError,
  uploadEndpoint = '/api/pelanggan/bulk-upload',
  acceptedFileTypes = '.csv,.pdf,.xlsx,.xls'
}) {
  const [open, setOpen] = useState(false)

  const handleUploadSuccess = (data) => {
    setOpen(false)
    if (onUploadSuccess) {
      onUploadSuccess(data)
    }
  }

  const handleUploadError = (error) => {
    if (onUploadError) {
      onUploadError(error)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <Upload className="h-4 w-4" />
      Upload Data
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <FileUpload
          title=""
          description=""
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          uploadEndpoint={uploadEndpoint}
          acceptedFileTypes={acceptedFileTypes}
        />
      </DialogContent>
    </Dialog>
  )
}

