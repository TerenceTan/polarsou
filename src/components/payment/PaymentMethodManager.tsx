import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, QrCode, CreditCard, Building2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { paymentService } from '@/services'
import { PaymentMethod, PaymentMethodForm } from '@/types'

interface PaymentMethodManagerProps {
  sessionId?: string
  userId?: string
  onPaymentMethodsChange?: (methods: PaymentMethod[]) => void
}

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  sessionId,
  userId,
  onPaymentMethodsChange
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PaymentMethodForm>({
    type: 'duitnow',
    displayName: '',
    duitnowId: '',
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })

  useEffect(() => {
    loadPaymentMethods()
  }, [sessionId, userId])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      let methods: PaymentMethod[] = []
      
      if (sessionId) {
        methods = await paymentService.getBySession(sessionId)
      } else if (userId) {
        methods = await paymentService.getByUser(userId)
      }
      
      setPaymentMethods(methods)
      onPaymentMethodsChange?.(methods)
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    if (!formData.displayName.trim()) {
      toast.error('Please enter a display name')
      return
    }

    if (formData.type === 'duitnow' && !formData.duitnowId?.trim()) {
      toast.error('Please enter DuitNow ID')
      return
    }

    if (formData.type === 'bank_transfer' && (!formData.bankName?.trim() || !formData.accountNumber?.trim())) {
      toast.error('Please enter bank details')
      return
    }

    try {
      setLoading(true)
      const newMethod = await paymentService.add({
        ...formData,
        sessionId,
        userId
      })

      setPaymentMethods(prev => [...prev, newMethod])
      onPaymentMethodsChange?.([...paymentMethods, newMethod])
      
      // Reset form
      setFormData({
        type: 'duitnow',
        displayName: '',
        duitnowId: '',
        bankName: '',
        accountNumber: '',
        accountHolder: ''
      })
      setShowAddForm(false)
      toast.success('Payment method added successfully!')
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Failed to add payment method')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePaymentMethod = async (methodId: string) => {
    try {
      await paymentService.remove(methodId)
      const updatedMethods = paymentMethods.filter(m => m.id !== methodId)
      setPaymentMethods(updatedMethods)
      onPaymentMethodsChange?.(updatedMethods)
      toast.success('Payment method removed')
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'qr_code':
        return <QrCode className="h-4 w-4" />
      case 'duitnow':
        return <Smartphone className="h-4 w-4" />
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'qr_code':
        return 'QR Code'
      case 'duitnow':
        return 'DuitNow'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return 'Payment Method'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Add payment methods for easy collection from participants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getPaymentMethodIcon(method.type)}
                  <div>
                    <div className="font-medium">{method.displayName}</div>
                    <div className="text-sm text-gray-500">
                      {getPaymentMethodLabel(method.type)}
                      {method.details.duitnowId && ` • ${method.details.duitnowId}`}
                      {method.details.bankName && ` • ${method.details.bankName}`}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePaymentMethod(method.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Payment Method Form */}
        {showAddForm ? (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duitnow">DuitNow</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., My DuitNow, Main Bank Account"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>

            {formData.type === 'duitnow' && (
              <div className="space-y-2">
                <Label htmlFor="duitnowId">DuitNow ID</Label>
                <Input
                  id="duitnowId"
                  placeholder="Phone number or email"
                  value={formData.duitnowId}
                  onChange={(e) => setFormData(prev => ({ ...prev, duitnowId: e.target.value }))}
                />
              </div>
            )}

            {formData.type === 'bank_transfer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., Maybank, CIMB Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Account number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name</Label>
                  <Input
                    id="accountHolder"
                    placeholder="Full name as per bank account"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountHolder: e.target.value }))}
                  />
                </div>
              </>
            )}

            {formData.type === 'qr_code' && (
              <div className="space-y-2">
                <Label>QR Code Upload</Label>
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-gray-500">
                  QR Code upload functionality coming soon
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddPaymentMethod} disabled={loading}>
                {loading ? 'Adding...' : 'Add Payment Method'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        )}

        {paymentMethods.length === 0 && !showAddForm && (
          <div className="text-center py-6 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No payment methods added yet</p>
            <p className="text-sm">Add payment methods to make it easier for participants to pay</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentMethodManager

