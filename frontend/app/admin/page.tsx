'use client'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Clock, CheckCircle, AlertTriangle, MapPin, Search, Bot, TrendingUp, Users } from 'lucide-react'
import { adminService, AdminStats } from '@/services/admin.service'

export default function AdminDashboardPage() {
  const [statsinfo, setStatsinfo] = useState<AdminStats>()
  const [complaints, setComplaints] = useState<any[]>([])

  // Filters
  const [searchText, setSearchText] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const fetchStats = async () => {
    try {
      const res = await adminService.getDashboardStats()
      setStatsinfo(res || [])
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchComplaints = async () => {
    try {
      const res = await adminService.getComplaints({
        page: 1,
        limit: 10,
        service: serviceFilter !== 'all' ? serviceFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchText || undefined
      })
      setComplaints(res.complaints || [])
    } catch (err) {
      console.error('Error fetching complaints:', err)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchComplaints()
  }, [serviceFilter, statusFilter, priorityFilter, searchText])

  const stats = [
    {
      title: "Total Complaints",
      value: statsinfo?.totalComplaints,
      change: statsinfo?.totalComplaintsChange,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "In Progress",
      value: statsinfo?.inProgress,
      change: statsinfo?.inProgressChange,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      title: "Resolved Today",
      value: statsinfo?.resolved,
      change: statsinfo?.resolvedChange,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "High Priority",
      value: statsinfo?.highPriority,
      change: statsinfo?.highPriorityChange,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage citizen complaints across the city</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change !== undefined && stat.change !== null && (
                      <p className="text-sm text-green-600">{stat.change} from last week</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="complaints" className="space-y-6">
          <TabsList>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="ai">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        placeholder="Search complaints..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="waste">Waste</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Complaints Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Complaints</CardTitle>
                <CardDescription>Manage and assign complaints to teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{complaint.title}</p>
                          <p className="text-sm text-gray-500">#{complaint.id}</p>
                        </div>
                        <div className="text-sm text-gray-600">{complaint.service}</div>
                        <div>{getStatusBadge(complaint.status)}</div>
                        <div>{getPriorityBadge(complaint.priority)}</div>
                        <div className="text-sm text-gray-600">{complaint.location}</div>
                        <div className="text-sm text-gray-600">{complaint?.assignedTo ?? 'NA'}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Assign
                        </Button>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
