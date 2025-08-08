import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Mail, Phone, MapPin, Calendar, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function AdminUsersPage() {
  const users = [
    {
      id: 'U-001',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'Downtown District',
      joinDate: '2024-01-10',
      status: 'Active',
      complaintsCount: 5,
      lastActive: '2 hours ago',
      avatar: '/diverse-user-avatars.png'
    },
    {
      id: 'U-002',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 (555) 234-5678',
      location: 'Midtown District',
      joinDate: '2024-01-08',
      status: 'Active',
      complaintsCount: 3,
      lastActive: '1 day ago',
      avatar: '/diverse-user-avatars.png'
    },
    {
      id: 'U-003',
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1 (555) 345-6789',
      location: 'Uptown District',
      joinDate: '2024-01-05',
      status: 'Active',
      complaintsCount: 8,
      lastActive: '3 hours ago',
      avatar: '/diverse-user-avatars.png'
    },
    {
      id: 'U-004',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+1 (555) 456-7890',
      location: 'East District',
      joinDate: '2024-01-03',
      status: 'Inactive',
      complaintsCount: 2,
      lastActive: '1 week ago',
      avatar: '/diverse-user-avatars.png'
    },
    {
      id: 'U-005',
      name: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+1 (555) 567-8901',
      location: 'West District',
      joinDate: '2023-12-28',
      status: 'Active',
      complaintsCount: 12,
      lastActive: '30 minutes ago',
      avatar: '/diverse-user-avatars.png'
    },
    {
      id: 'U-006',
      name: 'Lisa Davis',
      email: 'lisa.davis@email.com',
      phone: '+1 (555) 678-9012',
      location: 'South District',
      joinDate: '2023-12-25',
      status: 'Active',
      complaintsCount: 6,
      lastActive: '5 hours ago',
      avatar: '/diverse-user-avatars.png'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'Inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">Manage registered citizens and their accounts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'Active').length}
                </p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {users.reduce((sum, user) => sum + user.complaintsCount, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Complaints</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">3</p>
                <p className="text-sm text-gray-600">New This Week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  <SelectItem value="downtown">Downtown</SelectItem>
                  <SelectItem value="midtown">Midtown</SelectItem>
                  <SelectItem value="uptown">Uptown</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Users ({users.length})</CardTitle>
            <CardDescription>Complete list of registered citizens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <span className="text-sm text-gray-500">#{user.id}</span>
                          {getStatusBadge(user.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Joined: {user.joinDate}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex gap-4 text-sm text-gray-600">
                          <span><strong>{user.complaintsCount}</strong> complaints</span>
                          <span>Last active: {user.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem>View Complaints</DropdownMenuItem>
                          <DropdownMenuItem>Suspend Account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
