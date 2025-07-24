import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Users, 
  Receipt, 
  Search, 
  ExternalLink,
  Clock,
  DollarSign,
  Filter
} from 'lucide-react'
import { sessionService } from '@/services'
import { formatCurrency } from '@/utils'
import { toast } from 'sonner'
import type { Session } from '@/types'

interface SessionHistoryProps {
  userId: string
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ userId }) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadSessionHistory()
  }, [userId])

  const loadSessionHistory = async () => {
    try {
      setLoading(true)
      const userSessions = await sessionService.getByUser(userId)
      setSessions(userSessions)
    } catch (error) {
      console.error('Error loading session history:', error)
      toast.error('Failed to load session history')
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && session.isActive) ||
      (filterStatus === 'completed' && !session.isActive)
    
    return matchesSearch && matchesFilter
  })

  const getSessionTotal = (session: Session) => {
    return session.items.reduce((total, item) => {
      const itemTotal = item.totalAmount + (item.sstAmount || 0)
      return total + itemTotal
    }, 0)
  }

  const getSessionStatus = (session: Session) => {
    if (!session.isActive) return 'completed'
    if (session.items.length === 0) return 'draft'
    return 'active'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Session History
        </CardTitle>
        <CardDescription>
          View and manage your bill splitting sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Session List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            {sessions.length === 0 ? (
              <>
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first bill splitting session to get started
                </p>
                <Button onClick={() => navigate('/')}>
                  Create Session
                </Button>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const status = getSessionStatus(session)
              const total = getSessionTotal(session)
              
              return (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {session.name}
                        </h3>
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {session.participants.length} participants
                        </div>
                        <div className="flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          {session.items.length} items
                        </div>
                      </div>

                      {session.participants.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Participants:</span>{' '}
                          {session.participants.slice(0, 3).map(p => p.name).join(', ')}
                          {session.participants.length > 3 && ` +${session.participants.length - 3} more`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total Amount
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/session/${session.id}`)
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {sessions.length > 0 && (
          <div className="border-t pt-4 mt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {sessions.length}
                </div>
                <div className="text-sm text-gray-500">Total Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {sessions.reduce((sum, s) => sum + s.participants.length, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Participants</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sessions.reduce((sum, s) => sum + getSessionTotal(s), 0))}
                </div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SessionHistory

