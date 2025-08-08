import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default function ComplaintsPage() {
  const complaints = [
    {
      id: 'CC-001',
      title: 'Pothole on Main Street',
      service: 'Roads & Infrastructure',
      status: 'In Progress',
      priority: 'High',
      date: '2024-01-15',
      description: 'Large pothole causing traffic issues'
    },
    {
      id: 'CC-002',
      title: 'Street light not working',
      service: 'Electricity',
      status: 'Open',
      priority: 'Medium',
      date: '2024-01-14',
      description: 'Street light on Oak Avenue has been out for 3 days'
    },
    {
      id: 'CC-003',
      title: 'Water leak on sidewalk',
      service: 'Water Supply',
      status: 'Resolved',
      priority: 'High',
      date: '2024-01-12',
      description: 'Water leak causing flooding on sidewalk'
    },
    {
      id: 'CC-004',
      title: 'Garbage not collected',
      service: 'Waste Management',
      status: 'Open',
      priority: 'Low',
      date: '2024-01-10',
      description: 'Garbage bins not collected for 2 weeks'
    },
    {
      id: 'CC-005',
      title: 'Broken playground equipment',
      service: 'Parks & Recreation',
      status: 'In Progress',
      priority: 'Medium',
      date: '2024-01-08',
      description: 'Swing set broken at Central Park'
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
            <p className="text-gray-600">Track the status of your reported issues</p>
          </div>
          <Link href="/complaints/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              New Complaint
            </Button>
          </Link>
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

        {/* Complaints List */}
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {complaint.title}
                      </h3>
                      <span className="text-sm text-gray-500">#{complaint.id}</span>
                    </div>
                    <p className="text-gray-600 mb-3">{complaint.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>{complaint.service}</span>
                      <span>•</span>
                      <span>{complaint.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-3">
                    <div className="flex gap-2">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                    <Link href={`/complaints/${complaint.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {complaints.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Filter className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any complaints yet.
              </p>
              <Link href="/complaints/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Submit Your First Complaint
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
