import { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import MalaysianTaxCalculator from '@/utils/malaysian/taxCalculator'

export interface ExtractedItem {
  name: string
  amount: number
  confidence: number
  hasSST: boolean
  hasServiceCharge: boolean
}

export interface ReceiptData {
  items: ExtractedItem[]
  total: number
  subtotal?: number
  tax?: number
  serviceCharge?: number
  merchantName?: string
  date?: string
}

interface ReceiptScannerProps {
  onItemsExtracted: (items: ExtractedItem[]) => void
  onClose: () => void
}

export const ReceiptScanner = ({ onItemsExtracted, onClose }: ReceiptScannerProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)

  const processImage = async (imageFile: File) => {
    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      // Create Tesseract worker
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      // Process the image
      const { data: { text } } = await worker.recognize(imageFile)
      await worker.terminate()

      // Parse the extracted text
      const receiptData = parseReceiptText(text)
      setExtractedData(receiptData)

      if (receiptData.items.length === 0) {
        setError('No items found in the receipt. Please try a clearer image or add items manually.')
      } else {
        toast.success(`Found ${receiptData.items.length} items in the receipt!`)
      }

    } catch (err) {
      console.error('OCR Error:', err)
      setError('Failed to process the receipt. Please try again or add items manually.')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const items: ExtractedItem[] = []
    let total = 0
    let subtotal: number | undefined
    let tax: number | undefined
    let serviceCharge: number | undefined
    let merchantName: string | undefined
    let date: string | undefined

    // Common Malaysian receipt patterns
    const pricePattern = /(\d+\.?\d*)/g
    const itemPattern = /^(.+?)\s+(\d+\.?\d*)$/
    const totalPattern = /(total|jumlah|amount)/i
    const subtotalPattern = /(subtotal|sub total)/i
    const taxPattern = /(sst|gst|tax|cukai)/i
    const serviceChargePattern = /(service charge|svc chg|servis)/i

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Try to extract merchant name (usually first few lines)
      if (i < 3 && !merchantName && line.length > 3 && !pricePattern.test(line)) {
        merchantName = line
      }

      // Try to extract date
      if (!date && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line)) {
        date = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0]
      }

      // Extract totals
      if (totalPattern.test(line)) {
        const matches = line.match(/(\d+\.?\d*)/g)
        if (matches) {
          total = parseFloat(matches[matches.length - 1])
        }
        continue
      }

      if (subtotalPattern.test(line)) {
        const matches = line.match(/(\d+\.?\d*)/g)
        if (matches) {
          subtotal = parseFloat(matches[matches.length - 1])
        }
        continue
      }

      if (taxPattern.test(line)) {
        const matches = line.match(/(\d+\.?\d*)/g)
        if (matches) {
          tax = parseFloat(matches[matches.length - 1])
        }
        continue
      }

      if (serviceChargePattern.test(line)) {
        const matches = line.match(/(\d+\.?\d*)/g)
        if (matches) {
          serviceCharge = parseFloat(matches[matches.length - 1])
        }
        continue
      }

      // Extract items (line with text followed by price)
      const itemMatch = line.match(itemPattern)
      if (itemMatch) {
        const name = itemMatch[1].trim()
        const amount = parseFloat(itemMatch[2])
        
        if (amount > 0 && name.length > 1) {
          // Get tax suggestions based on item name
          const taxSettings = MalaysianTaxCalculator.suggestTaxSettings(name)
          
          items.push({
            name,
            amount,
            confidence: 0.8, // Base confidence
            hasSST: taxSettings.hasSST,
            hasServiceCharge: taxSettings.hasServiceCharge
          })
        }
      }
    }

    return {
      items,
      total,
      subtotal,
      tax,
      serviceCharge,
      merchantName,
      date
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        processImage(file)
      } else {
        setError('Please select an image file (JPG, PNG, etc.)')
      }
    }
  }

  const handleAddItems = () => {
    if (extractedData?.items) {
      onItemsExtracted(extractedData.items)
      onClose()
    }
  }

  const removeItem = (index: number) => {
    if (extractedData) {
      const newItems = extractedData.items.filter((_, i) => i !== index)
      setExtractedData({ ...extractedData, items: newItems })
    }
  }

  const toggleItemTax = (index: number, field: 'hasSST' | 'hasServiceCharge') => {
    if (extractedData) {
      const newItems = [...extractedData.items]
      newItems[index] = { ...newItems[index], [field]: !newItems[index][field] }
      setExtractedData({ ...extractedData, items: newItems })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Receipt Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProcessing && !extractedData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Upload a photo of your receipt to automatically extract bill items
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Receipt Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <Alert>
              <AlertDescription>
                <strong>Tips for better results:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Ensure good lighting and clear text</li>
                  <li>Keep the receipt flat and straight</li>
                  <li>Include the entire receipt in the photo</li>
                  <li>Avoid shadows and reflections</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {isProcessing && (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div>
              <p className="font-medium">Processing receipt...</p>
              <p className="text-sm text-gray-600">Progress: {progress}%</p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {extractedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Extracted Items ({extractedData.items.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleAddItems} disabled={extractedData.items.length === 0}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Items
                </Button>
              </div>
            </div>

            {extractedData.merchantName && (
              <p className="text-sm text-gray-600">
                <strong>Merchant:</strong> {extractedData.merchantName}
              </p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {extractedData.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">RM {item.amount.toFixed(2)}</div>
                    <div className="flex gap-1 mt-1">
                      <Badge 
                        variant={item.hasSST ? "default" : "outline"}
                        className="text-xs cursor-pointer"
                        onClick={() => toggleItemTax(index, 'hasSST')}
                      >
                        SST
                      </Badge>
                      <Badge 
                        variant={item.hasServiceCharge ? "default" : "outline"}
                        className="text-xs cursor-pointer"
                        onClick={() => toggleItemTax(index, 'hasServiceCharge')}
                      >
                        Service
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {extractedData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items extracted. Try uploading a clearer image.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ReceiptScanner
