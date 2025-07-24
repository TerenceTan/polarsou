import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Building2,
  Copy,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import MalaysianPaymentService, { type PaymentMethod, type PaymentLink } from '@/utils/payment/malaysianPayments'
import { toast } from 'sonner'

interface PaymentMethodSelectorProps {
  amount: number
  recipientName: string
  description: string
  onPaymentSelected?: (method: PaymentMethod, link: PaymentLink) => void
  className?: string
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  recipientName,
  description,
  onPaymentSelected,
  className = ''
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const paymentMethods = MalaysianPaymentService.getPaymentMethods()
  const ewalletMethods = MalaysianPaymentService.getPaymentMethodsByType('ewallet')
  const qrMethods = MalaysianPaymentService.getPaymentMethodsByType('qr')
  const bankMethods = MalaysianPaymentService.getPaymentMethodsByType('bank_transfer')

  const handleMethodSelect = (method: PaymentMethod) => {
    try {
      const link = MalaysianPaymentService.generatePaymentLink(method.id, {
        amount,
        currency: 'MYR',
        description,
        recipientName,
        reference: `PAY-${Date.now()}`
      })

      setSelectedMethod(method.id)
      setPaymentLink(link)
      onPaymentSelected?.(method, link)
    } catch (error) {
      console.error('Error generating payment link:', error)
      toast.error('Failed to generate payment link')
    }
  }

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      toast.success(`${label} copied to clipboard!`)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'ewallet':
        return <CreditCard className="h-5 w-5" />
      case 'qr':
        return <QrCode className="h-5 w-5" />
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />
      default:
        return <Smartphone className="h-5 w-5" />
    }
  }

  const renderPaymentMethods = (methods: PaymentMethod[], title: string) => (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
        {getMethodIcon(methods[0]?.type)}
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {methods.map((method) => (
          <Button
            key={method.id}
            variant={selectedMethod === method.id ? "default" : "outline"}
            className={`justify-start h-auto p-3 ${selectedMethod === method.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleMethodSelect(method)}
          >
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">{method.icon}</span>
              <div className="text-left">
                <div className="font-medium text-sm">{method.name}</div>
                <div className="text-xs text-gray-500 capitalize">{method.type.replace('_', ' ')}</div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <div className="text-sm text-gray-600">
          Pay <span className="font-bold text-lg text-green-600">
            {MalaysianPaymentService.formatCurrency(amount)}
          </span> to {recipientName}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* E-Wallets */}
        {ewalletMethods.length > 0 && renderPaymentMethods(ewalletMethods, 'E-Wallets')}
        
        {/* QR Payments */}
        {qrMethods.length > 0 && (
          <>
            <Separator />
            {renderPaymentMethods(qrMethods, 'QR Payments')}
          </>
        )}
        
        {/* Bank Transfers */}
        {bankMethods.length > 0 && (
          <>
            <Separator />
            {renderPaymentMethods(bankMethods, 'Bank Transfers')}
          </>
        )}

        {/* Payment Instructions */}
        {paymentLink && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Payment Instructions</h3>
                <Badge variant="secondary">{paymentLink.method}</Badge>
              </div>

              {/* QR Code for QR payments */}
              {paymentLink.qrCode && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <img 
                      src={paymentLink.qrCode} 
                      alt="Payment QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Payment Link */}
              {paymentLink.url && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Link:</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start text-left"
                      onClick={() => handleCopyText(paymentLink.url, 'Payment link')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedText === 'Payment link' ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentLink.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructions:</label>
                <ol className="space-y-1">
                  {paymentLink.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-600 flex gap-2">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Copy all instructions */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleCopyText(
                  `Payment Instructions for ${paymentLink.method}\n\n` +
                  paymentLink.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n') +
                  (paymentLink.url ? `\n\nPayment Link: ${paymentLink.url}` : ''),
                  'All instructions'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedText === 'All instructions' ? 'Copied!' : 'Copy All Instructions'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentMethodSelector

