import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Settings, 
  LogOut, 
  ArrowLeft,
  Save,
  History,
  CreditCard,
  Users,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { user, signOut, updateProfile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    preferredCurrency: user?.user_metadata?.preferred_currency || 'MYR',
    preferredLanguage: user?.user_metadata?.preferred_language || 'en',
    timezone: user?.user_metadata?.timezone || 'Asia/Kuala_Lumpur'
  })

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/')
    }
  }

  const handleSaveProfile = async () => {
    const { error } = await updateProfile(formData)
    if (!error) {
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-gray-600 text-sm">Manage your account and preferences</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {user.user_metadata?.full_name || 'User'}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Personal Details</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                      <select
                        id="preferredCurrency"
                        value={formData.preferredCurrency}
                        onChange={(e) => handleInputChange('preferredCurrency', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="MYR">Malaysian Ringgit (MYR)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="SGD">Singapore Dollar (SGD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="preferredLanguage">Language</Label>
                      <select
                        id="preferredLanguage"
                        value={formData.preferredLanguage}
                        onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="ms">Bahasa Malaysia</option>
                        <option value="zh">中文</option>
                        <option value="ta">தமிழ்</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="Asia/Kuala_Lumpur">Malaysia (GMT+8)</option>
                        <option value="Asia/Singapore">Singapore (GMT+8)</option>
                        <option value="Asia/Bangkok">Thailand (GMT+7)</option>
                        <option value="Asia/Jakarta">Indonesia (GMT+7)</option>
                      </select>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Full Name:</span>
                      <span>{user.user_metadata?.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Currency:</span>
                      <span>{user.user_metadata?.preferred_currency || 'MYR'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Language:</span>
                      <span>{user.user_metadata?.preferred_language || 'English'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Timezone:</span>
                      <span>{user.user_metadata?.timezone || 'Asia/Kuala_Lumpur'}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/sessions')}
              >
                <History className="h-4 w-4 mr-2" />
                Session History
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast.info('Feature coming soon!')}
              >
                <Users className="h-4 w-4 mr-2" />
                Saved Participants
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast.info('Feature coming soon!')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Methods
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast.info('Feature coming soon!')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Bill Templates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member since:</span>
                <span className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sessions created:</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total bills split:</span>
                <span className="text-sm font-medium">RM 0.00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

