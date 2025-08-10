"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Users, Wrench, Truck, Clock, MapPin, Phone, CheckCircle, AlertCircle } from "lucide-react"
import { adminService, type Resource, type ResourceAssignment } from "@/services/admin.service"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Complaint {
  id: string
  title: string
  service: string
  status: string
  priority: string
  location?: {
    address: string
  }
  resources: Array<{
    id: string
    name: string
    type: string
    status: string
  }>
}

export default function AssignResourcesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [estimatedHours, setEstimatedHours] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchComplaints()
    fetchResources()
  }, [])

  useEffect(() => {
    if (selectedComplaint) {
      fetchComplaintAssignments(selectedComplaint.id)
    }
  }, [selectedComplaint])

  const fetchComplaints = async () => {
    try {
      const response = await adminService.getComplaints({
        status: "Open,In Progress",
        limit: 100,
      })
      setComplaints(response.complaints)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      })
    }
  }

  const fetchResources = async () => {
    try {
      const response = await adminService.getResources({
        availability_status: "Available",
        limit: 100,
      })
      setResources(response.resources)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      })
    }
  }

  const fetchComplaintAssignments = async (complaintId: string) => {
    try {
      const response = await adminService.getComplaintResources(complaintId)
      setAssignments(response.assignments)
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
    }
  }

  const handleComplaintSelect = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setSelectedResources([])
    setAssignmentNotes("")
    setEstimatedHours("")
  }

  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId) ? prev.filter((id) => id !== resourceId) : [...prev, resourceId],
    )
  }

  const handleAssignResources = async () => {
    if (!selectedComplaint || selectedResources.length === 0) {
      toast({
        title: "Error",
        description: "Please select a complaint and at least one resource",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      await adminService.assignResourcesToComplaint(selectedComplaint.id, {
        resource_ids: selectedResources,
        notes: assignmentNotes || undefined,
        estimated_hours: estimatedHours ? Number.parseFloat(estimatedHours) : undefined,
      })

      toast({
        title: "Success",
        description: `Successfully assigned ${selectedResources.length} resources to complaint`,
      })

      // Refresh data
      fetchComplaints()
      fetchResources()
      fetchComplaintAssignments(selectedComplaint.id)
      setSelectedResources([])
      setAssignmentNotes("")
      setEstimatedHours("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign resources",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async (complaintId: string, resourceId: string) => {
    try {
      await adminService.removeResourceFromComplaint(complaintId, resourceId)
      toast({
        title: "Success",
        description: "Resource removed from complaint",
      })
      fetchComplaintAssignments(complaintId)
      fetchResources()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove resource",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Open: "bg-blue-100 text-blue-800",
      "In Progress": "bg-yellow-100 text-yellow-800",
      Resolved: "bg-green-100 text-green-800",
      Available: "bg-green-100 text-green-800",
      Busy: "bg-yellow-100 text-yellow-800",
      Assigned: "bg-blue-100 text-blue-800",
    }
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      High: "bg-red-100 text-red-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-green-100 text-green-800",
    }
    return <Badge className={colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{priority}</Badge>
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      Personnel: Users,
      Equipment: Wrench,
      Vehicle: Truck,
    }
    const Icon = icons[type as keyof typeof icons] || Wrench
    return <Icon className="h-4 w-4" />
  }

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesService = serviceFilter === "all" || complaint.service === serviceFilter
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter
    return matchesSearch && matchesService && matchesStatus
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/admin/resources">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assign Resources</h1>
            <p className="text-gray-600">Assign resources to complaints for resolution</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints List */}
          <Card>
            <CardHeader>
              <CardTitle>Open Complaints</CardTitle>
              <CardDescription>Select a complaint to assign resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex space-x-2">
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="waste">Waste</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="parks">Parks</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Complaints List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedComplaint?.id === complaint.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleComplaintSelect(complaint)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{complaint.title}</h4>
                        <p className="text-xs text-gray-500">{complaint.id}</p>
                      </div>
                      <div className="flex space-x-1">
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                    </div>
                    {complaint.location && (
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {complaint.location.address}
                      </div>
                    )}
                    {complaint.resources.length > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        {complaint.resources.length} resources assigned
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resource Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Assignment</CardTitle>
              <CardDescription>
                {selectedComplaint
                  ? `Assign resources to: ${selectedComplaint.title}`
                  : "Select a complaint to assign resources"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedComplaint ? (
                <Tabs defaultValue="assign" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="assign">Assign Resources</TabsTrigger>
                    <TabsTrigger value="current">Current Assignments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="assign" className="space-y-4">
                    {/* Available Resources */}
                    <div className="space-y-3">
                      <Label>Available Resources</Label>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {resources.map((resource) => (
                          <div key={resource.id} className="flex items-center space-x-3 p-2 border rounded">
                            <Checkbox
                              checked={selectedResources.includes(resource.id)}
                              onCheckedChange={() => handleResourceToggle(resource.id)}
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              {getTypeIcon(resource.type)}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{resource.name}</div>
                                <div className="text-xs text-gray-500">
                                  {resource.type} • {resource.serviceCategory}
                                </div>
                              </div>
                              {getStatusBadge(resource.availabilityStatus)}
                            </div>
                            {resource.contactPhone && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Phone className="h-3 w-3 mr-1" />
                                {resource.contactPhone}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assignment Details */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Assignment Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add notes about this assignment..."
                          value={assignmentNotes}
                          onChange={(e) => setAssignmentNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hours">Estimated Hours</Label>
                        <Input
                          id="hours"
                          type="number"
                          step="0.5"
                          placeholder="e.g., 4.5"
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Assign Button */}
                    <Button
                      onClick={handleAssignResources}
                      disabled={loading || selectedResources.length === 0}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Assign {selectedResources.length} Resource{selectedResources.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="current" className="space-y-4">
                    {assignments.length > 0 ? (
                      <div className="space-y-3">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(assignment.resource.type)}
                                <div>
                                  <div className="font-medium text-sm">{assignment.resource.name}</div>
                                  <div className="text-xs text-gray-500">{assignment.resource.type}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(assignment.status)}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(selectedComplaint.id, assignment.resource.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Assigned: {assignment.assignedAt}</div>
                              {assignment.estimatedHours && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Estimated: {assignment.estimatedHours} hours
                                </div>
                              )}
                              {assignment.notes && <div>Notes: {assignment.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>No resources currently assigned to this complaint</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>Select a complaint from the list to assign resources</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
