import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Plus, 
  Trash2, 
  Calculator, 
  Share2, 
  Receipt,
  ArrowLeft,
  AlertCircle,
  Camera,
  CreditCard,
  Smartphone
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  sessionService, 
  participantService, 
  itemService, 
} from '@/services'
import { toast } from 'sonner'
import type { Session, Participant, BillItem, CalculationResult } from '@/types'
import { formatCurrency } from '@/utils'
import ReceiptScanner, { type ExtractedItem } from '@/components/ocr/ReceiptScanner'
import TaxBreakdown from '@/components/tax/TaxBreakdown'
import MalaysianTaxCalculator from '@/utils/malaysian/taxCalculator'
import PaymentInstructions from '@/components/payment/PaymentInstructions'
import MalaysianPaymentService from '@/utils/payment/malaysianPayments'

const SessionPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [newParticipantName, setNewParticipantName] = useState('')
  const [addingParticipant, setAddingParticipant] = useState(false)
  
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [newItemPaidBy, setNewItemPaidBy] = useState('')
  const [newItemSharedBy, setNewItemSharedBy] = useState<string[]>([])
  const [newItemHasSst, setNewItemHasSst] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  // Receipt scanner state
  const [showReceiptScanner, setShowReceiptScanner] = useState(false)

  // Payment view state
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false)

  // Load session data
  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required')
      setLoading(false)
      return
    }

    const loadSession = async () => {
      try {
        const sessionData = await sessionService.getById(sessionId)
        setSession(sessionData)
        
        // Calculate balances
        if (sessionData.items.length > 0) {
        }
      } catch (err) {
        console.error('Error loading session:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [sessionId])

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim() || !sessionId) {
      toast.error('Please enter a participant name')
      return
    }

    setAddingParticipant(true)
    try {
      const participant = await participantService.add(sessionId, {
        name: newParticipantName.trim()
      })

      setSession(prev => prev ? {
        ...prev,
        participants: [...prev.participants, participant]
      } : null)

      setNewParticipantName('')
      toast.success('Participant added successfully!')
    } catch (err) {
      console.error('Error adding participant:', err)
      toast.error('Failed to add participant')
    } finally {
      setAddingParticipant(false)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await participantService.remove(participantId)
      
      setSession(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(p => p.id !== participantId)
      } : null)

      toast.success('Participant removed')
    } catch (err) {
      console.error('Error removing participant:', err)
      toast.error('Failed to remove participant')
    }
  }

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemAmount || !newItemPaidBy || newItemSharedBy.length === 0 || !sessionId) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(newItemAmount.replace(/[^\d.-]/g, '')) // Clean input
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setAddingItem(true)
    try {
      const item = await itemService.add(sessionId, {
        name: newItemName.trim(),
        amount: Number(amount.toFixed(2)), // Ensure proper number format
        paidBy: newItemPaidBy,
        sharedBy: newItemSharedBy,
        hasSst: newItemHasSst
      })

      setSession(prev => prev ? {
        ...prev,
        items: [...prev.items, item]
      } : null)

      // Reset form
      setNewItemName('')
      setNewItemAmount('')
      setNewItemPaidBy('')
      setNewItemSharedBy([])
      setNewItemHasSst(false)

      toast.success('Item added successfully!')
    } catch (err) {
      console.error('Error adding item:', err)
      toast.error('Failed to add item')
    } finally {
      setAddingItem(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await itemService.remove(itemId)
      
      setSession(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId)
      } : null)

      toast.success('Item removed')
    } catch (err) {
      console.error('Error removing item:', err)
      toast.error('Failed to remove item')
    }
  }

  const handleShareSession = () => {
    const shareUrl = `${window.location.origin}/view/${sessionId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied to clipboard!')
  }

  const toggleParticipantSelection = (participantId: string) => {
    setNewItemSharedBy(prev => 
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  const handleReceiptItems = async (extractedItems: ExtractedItem[]) => {
    if (!sessionId) return

    setAddingItem(true)
    try {
      // Add each extracted item to the session
      for (const extractedItem of extractedItems) {
        const item = await itemService.add(sessionId, {
          name: extractedItem.name,
          amount: extractedItem.amount,
          paidBy: session?.participants[0]?.id || '', // Default to first participant
          sharedBy: session?.participants.map(p => p.id) || [], // Default to all participants
          hasSst: extractedItem.hasSST
        })

        setSession(prev => prev ? {
          ...prev,
          items: [...prev.items, item]
        } : null)
      }

      toast.success(`Added ${extractedItems.length} items from receipt!`)
    } catch (err) {
      console.error('Error adding receipt items:', err)
      toast.error('Failed to add some items from receipt')
    } finally {
      setAddingItem(false)
    }
  }

  // Calculate enhanced tax breakdown
  const getEnhancedTaxBreakdown = () => {
    if (!session?.items.length) return null

    const taxableItems = session.items.map(item => ({
      amount: item.amount,
      hasSST: item.hasSst,
      hasServiceCharge: false, // Can be enhanced later
      isExempt: false
    }))

    return MalaysianTaxCalculator.calculateTaxes(taxableItems)
  }

  // Calculate participant balances for payment instructions
  const getParticipantBalances = () => {
    if (!session?.participants.length || !session?.items.length) return []

    return session.participants.map(participant => {
      const paid = session.items
        .filter(item => item.paidBy === participant.id)
        .reduce((sum, item) => {
          const amount = Number(item.amount) || 0
          const itemTotal = item.hasSst ? amount * 1.06 : amount
          return sum + itemTotal
        }, 0)
      
      const owes = session.items
        .filter(item => item.sharedBy.includes(participant.id))
        .reduce((sum, item) => {
          const amount = Number(item.amount) || 0
          const itemTotal = item.hasSst ? amount * 1.06 : amount
          const shareCount = item.sharedBy.length || 1
          return sum + (itemTotal / shareCount)
        }, 0)
      
      const balance = paid - owes

      return {
        id: participant.id,
        name: participant.name,
        paid: Number(paid.toFixed(2)),
        owes: Number(owes.toFixed(2)),
        balance: Number(balance.toFixed(2))
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Session not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const enhancedTaxBreakdown = getEnhancedTaxBreakdown()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Receipt Scanner Modal */}
      {showReceiptScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ReceiptScanner
            onItemsExtracted={handleReceiptItems}
            onClose={() => setShowReceiptScanner(false)}
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{session.name}</h1>
              <p className="text-gray-600 text-sm">Session ID: {session.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {session.items.length > 0 && (
              <Button 
                variant="outline"
                onClick={() => setShowPaymentInstructions(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Payment Instructions</span>
                <span className="sm:hidden">Pay</span>
              </Button>
            )}
            <Button onClick={handleShareSession}>
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({session.participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter participant name"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                  />
                  <Button 
                    onClick={handleAddParticipant}
                    disabled={addingParticipant}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {session.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{participant.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Add Bill Item */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Add Bill Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowReceiptScanner(true)}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Scan Receipt
                  </Button>
                  <span className="text-sm text-gray-500">or add items manually below</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input
                      id="itemName"
                      placeholder="e.g., Nasi Lemak"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemAmount">Amount (RM) *</Label>
                    <Input
                      id="itemAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paidBy">Paid By *</Label>
                  <select
                    id="paidBy"
                    className="w-full p-2 border rounded"
                    value={newItemPaidBy}
                    onChange={(e) => setNewItemPaidBy(e.target.value)}
                  >
                    <option value="">Select who paid</option>
                    {session.participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Shared By * (Select participants)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {session.participants.map((participant) => (
                      <Button
                        key={participant.id}
                        variant={newItemSharedBy.includes(participant.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleParticipantSelection(participant.id)}
                      >
                        {participant.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasSst"
                    checked={newItemHasSst}
                    onChange={(e) => setNewItemHasSst(e.target.checked)}
                  />
                  <Label htmlFor="hasSst">Subject to SST (6%)</Label>
                </div>

                <Button 
                  onClick={handleAddItem}
                  disabled={addingItem}
                  className="w-full"
                >
                  Add Item
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Bill Items */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Items ({session.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {session.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items added yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {session.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(item.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Paid by: {session.participants.find(p => p.id === item.paidBy)?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Shared by: {item.sharedBy.map(id => 
                              session.participants.find(p => p.id === id)?.name
                            ).join(', ')}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Tax Breakdown */}
            {enhancedTaxBreakdown && (
              <TaxBreakdown breakdown={enhancedTaxBreakdown} />
            )}

            {/* Bill Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(session.items.reduce((sum, item) => sum + item.amount, 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total with Taxes</div>
                    <div className="text-lg font-bold">
                      {enhancedTaxBreakdown ? formatCurrency(enhancedTaxBreakdown.total) : formatCurrency(session.items.reduce((sum, item) => sum + (item.hasSst ? item.amount * 1.06 : item.amount), 0))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">Individual Balances</h3>
                  <div className="space-y-2">
                    {session.participants.map((participant) => {
                      const paid = session.items
                        .filter(item => item.paidBy === participant.id)
                        .reduce((sum, item) => sum + (item.hasSst ? item.amount * 1.06 : item.amount), 0)
                      
                      const owes = session.items
                        .filter(item => item.sharedBy.includes(participant.id))
                        .reduce((sum, item) => sum + (item.hasSst ? item.amount * 1.06 : item.amount) / item.sharedBy.length, 0)
                      
                      const balance = paid - owes

                      return (
                        <div key={participant.id} className="flex justify-between items-center">
                          <span>{participant.name}</span>
                          <div className="text-right">
                            <div className={`font-medium ${balance === 0 ? 'text-green-600' : balance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {balance === 0 ? 'Even' : balance > 0 ? 'Gets back' : 'Owes'}: {formatCurrency(Math.abs(balance))}
                            </div>
                            <div className="text-xs text-gray-500">
                              Paid: {formatCurrency(paid)} | Owes: {formatCurrency(owes)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Payment Methods */}
                <div>
                  <h3 className="font-medium mb-3">Payment Methods</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-blue-50 rounded border">
                      <div className="font-medium text-blue-800">TouchNGo</div>
                      <div className="text-blue-600">QR Payment</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded border">
                      <div className="font-medium text-green-800">GrabPay</div>
                      <div className="text-green-600">QR Payment</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded border">
                      <div className="font-medium text-purple-800">DuitNow QR</div>
                      <div className="text-purple-600">Bank Transfer</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded border">
                      <div className="font-medium text-orange-800">Bank Transfer</div>
                      <div className="text-orange-600">Manual</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Instructions Modal */}
        {showPaymentInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Instructions
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPaymentInstructions(false)}
                  >
                    ✕
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Malaysian payment methods for {session.name}
                </p>
              </div>
              <div className="p-4">
                <PaymentInstructions
                  participants={getParticipantBalances()}
                  sessionName={session.name}
                  organizerName={session.organizer || session.participants[0]?.name || 'Organizer'}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionPage
