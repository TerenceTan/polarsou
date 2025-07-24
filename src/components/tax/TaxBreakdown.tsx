import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calculator, Info } from 'lucide-react'
import { formatCurrency } from '@/utils'
import MalaysianTaxCalculator, { type TaxBreakdown as TaxBreakdownType } from '@/utils/malaysian/taxCalculator'

interface TaxBreakdownProps {
  breakdown: TaxBreakdownType
  showDetails?: boolean
}

export const TaxBreakdown = ({ breakdown, showDetails = true }: TaxBreakdownProps) => {
  const hasServiceCharge = breakdown.serviceCharge > 0
  const hasSST = breakdown.sstAmount > 0
  const hasRounding = Math.abs(breakdown.roundingAdjustment) > 0.001

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Tax Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(breakdown.subtotal)}</span>
        </div>

        {/* Service Charge */}
        {hasServiceCharge && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Service Charge</span>
              <Badge variant="secondary" className="text-xs">10%</Badge>
            </div>
            <span className="font-medium">{formatCurrency(breakdown.serviceCharge)}</span>
          </div>
        )}

        {/* SST */}
        {hasSST && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">SST</span>
              <Badge variant="secondary" className="text-xs">6%</Badge>
            </div>
            <span className="font-medium">{formatCurrency(breakdown.sstAmount)}</span>
          </div>
        )}

        {/* Rounding Adjustment */}
        {hasRounding && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Rounding</span>
              <Badge variant="outline" className="text-xs">
                <Info className="h-3 w-3 mr-1" />
                5 sen
              </Badge>
            </div>
            <span className={`font-medium ${breakdown.roundingAdjustment >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {breakdown.roundingAdjustment >= 0 ? '+' : ''}{formatCurrency(breakdown.roundingAdjustment)}
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(breakdown.total)}</span>
        </div>

        {/* Details */}
        {showDetails && (hasServiceCharge || hasSST || hasRounding) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Malaysian Tax Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              {hasServiceCharge && (
                <p>• Service charge (10%) is applied before SST calculation</p>
              )}
              {hasSST && (
                <p>• SST (6%) applies to applicable items and service charges</p>
              )}
              {hasRounding && (
                <p>• Final amount rounded to nearest 5 sen (Malaysian standard)</p>
              )}
              <p>• Tax-exempt items: Local food, beverages, basic necessities</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TaxBreakdown
