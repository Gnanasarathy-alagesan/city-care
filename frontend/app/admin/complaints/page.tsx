import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Search, Filter, MapPin, Calendar, User } from 'lucide-react'
import Link from 'next/link'

export default function AdminComplaintsPage() {
  const complaints = [
    {
      id: 'CC-001',
      title: 'Pothole on Main Street',
      service: 'Roads & Infrastructure',
      status: 'In Progress',
      priority: 'High',
      date: '2024-01-15',
      location: 'Main St & Oak Ave',
      reporter: 'John Doe',
      assignedTo: 'Team A'
    },
    {
      id: 'CC-002',
      title: 'Street light not working',
      service: 'Electricity',
      status: 'Open',
      priority: 'Medium',
      date: '2024-01-14',
      location: 'Oak Avenue',
      reporter: 'Jane Smith',
      assignedTo: 'Unassigned'
    },
    {
      id: 'CC-003',
      title: 'Water leak on sidewalk',
      service: 'Water Supply',
      status: 'Resolved',
      priority: 'High',
      date: '2024-01-12',
      location: 'Pine Street',
      reporter: 'Mike Johnson',
      assignedTo: 'Team B'
    },
    {
      id: 'CC-004',
      title: 'Garbage not collected',
      service: 'Waste Management',
      status: 'Open',
      priority: 'Low',
      date: '2024-01-10',
      location: 'Elm Street',
      reporter: 'Sarah Wilson',
      assignedTo: 'Unassigned'
    },
    {
      id: 'CC-005',
      title: 'Broken playground equipment',
      service: 'Parks & Recreation',
      status: 'In Progress',
      priority: 'Medium',
      date: '2024-01-08',
      location: 'Central Park',
      reporter: 'David Brown',
      assignedTo: 'Team C'
    },
    {
      id: 'CC-006',
      title: 'Traffic signal malfunction',
      service: 'Roads & Infrastructure',
      status: 'Open',
      priority: 'High',
      date: '2024-01-07',
      location: 'Main St & 5th Ave',
      reporter: 'Lisa Davis',
      assignedTo: 'Unassigned'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <Badge className="status-open">Open</Badge>
      case 'In Progress':
        return <Badge className="status-in-progress">In Progress</Badge>
      case 'Resolved':
        return <Badge className="status-resolved">Resolved</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Low':
        return <Badge className="priority-low">Low</Badge>
      case 'Medium':
        return <Badge className="priority-medium">Medium</Badge>
      case 'High':
        return <Badge className="priority-high">High</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Complaints</h1>
          <p className="text-gray-600">Manage all citizen complaints across the city</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search complaints..."
                    className="pl-10"
                  />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="roads">Roads & Infrastructure</SelectItem>
                  <SelectItem value="water">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="waste">Waste Management</SelectItem>
                  <SelectItem value="parks">Parks & Recreation</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Complaints ({complaints.length})</CardTitle>
            <CardDescription>Complete list of citizen complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {complaint.title}
                        </h3>
                        <span className="text-sm text-gray-500">#{complaint.id}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4" />
                          <span>{complaint.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{complaint.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Reporter: {complaint.reporter}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{complaint.date}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Assigned to:</span> {complaint.assignedTo}
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:items-end gap-3">
                      <div className="flex gap-2">
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Assign Team
                        </Button>
                        <Link href={`/complaints/${complaint.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {complaints.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Filter className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-600">
                No complaints match your current filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
