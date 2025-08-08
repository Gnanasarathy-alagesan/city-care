import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Clock, CheckCircle, AlertTriangle, MapPin, Search, Filter, Users, Bot, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
  const stats = [
    {
      title: "Total Complaints",
      value: "247",
      change: "+12%",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "In Progress",
      value: "89",
      change: "+5%",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      title: "Resolved Today",
      value: "23",
      change: "+18%",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "High Priority",
      value: "15",
      change: "-8%",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ]

  const complaints = [
    {
      id: 'CC-001',
      title: 'Pothole on Main Street',
      service: 'Roads',
      status: 'In Progress',
      priority: 'High',
      date: '2024-01-15',
      location: 'Main St & Oak Ave',
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
      assignedTo: 'Unassigned'
    },
    {
      id: 'CC-003',
      title: 'Water leak on sidewalk',
      service: 'Water',
      status: 'Resolved',
      priority: 'High',
      date: '2024-01-12',
      location: 'Pine Street',
      assignedTo: 'Team B'
    }
  ]

  const aiSuggestions = [
    {
      type: 'Priority',
      suggestion: 'Complaint CC-045 should be upgraded to High priority due to safety concerns',
      confidence: '92%'
    },
    {
      type: 'Resource',
      suggestion: 'Deploy additional team to Downtown area - 8 complaints in 2-block radius',
      confidence: '87%'
    },
    {
      type: 'Pattern',
      suggestion: 'Water-related complaints increased 40% this week - possible infrastructure issue',
      confidence: '94%'
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
                    <p className="text-sm text-green-600">{stat.change} from last week</p>
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
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="waste">Waste</SelectItem>
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
                        <div className="text-sm text-gray-600">{complaint.assignedTo}</div>
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

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Complaint Locations
                </CardTitle>
                <CardDescription>Interactive map showing complaint locations across the city</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                    <p className="text-sm">Map integration would display complaint locations with clustering and filtering</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>IBM AI recommendations for complaint management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{suggestion.type}</Badge>
                        <span className="text-sm text-gray-600">Confidence: {suggestion.confidence}</span>
                      </div>
                      <p className="text-gray-700">{suggestion.suggestion}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          Apply
                        </Button>
                        <Button size="sm" variant="ghost">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Trends Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Roads complaints</span>
                      <span className="text-sm font-semibold text-red-600">↑ 25%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Water complaints</span>
                      <span className="text-sm font-semibold text-red-600">↑ 40%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Electricity complaints</span>
                      <span className="text-sm font-semibold text-green-600">↓ 12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Resource Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team A (Roads)</span>
                      <span className="text-sm font-semibold">12 active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team B (Water)</span>
                      <span className="text-sm font-semibold">8 active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team C (Electrical)</span>
                      <span className="text-sm font-semibold">5 active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
