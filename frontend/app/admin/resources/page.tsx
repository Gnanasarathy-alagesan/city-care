"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Wrench,
  Truck,
  Activity,
  Clock,
  DollarSign,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Settings,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { adminService, ResourceFilters } from "@/services/admin.service"

interface Resource {
  id: string
  name: string
  type: string
  serviceCategory: string
  description?: string
  availabilityStatus: 'Available' | 'Busy' | 'Maintenance'
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  location?: string
  capacity?: number
  hourlyRate?: number
  activeAssignments: number
  createdAt: string
  updatedAt: string
}

interface ResourceStats {
  total: number
  available: number
  busy: number
  maintenance: number
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [stats, setStats] = useState<ResourceStats>({ total: 0, available: 0, busy: 0, maintenance: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchResources = async () => {
    try {
      const filters: ResourceFilters = {
        page,
        limit: 20,
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(typeFilter !== "all" ? { type_filter: typeFilter } : {}),
        ...(serviceFilter !== "all" ? { service_category: serviceFilter } : {}),
        ...(statusFilter !== "all" ? { availability_status: statusFilter } : {}),
      }
      
      const response = await adminService.getResources(filters)
      
      if (response.resources) {
        setResources(response.resources)
        setTotal(response.total)

        // Calculate stats
        const statsData = response.resources.reduce(
          (acc: ResourceStats, resource: Resource) => {
            acc.total++
            if (resource.availabilityStatus === "Available") acc.available++
            else if (resource.availabilityStatus === "Busy") acc.busy++
            else if (resource.availabilityStatus === "Maintenance") acc.maintenance++
            return acc
          },
          { total: 0, available: 0, busy: 0, maintenance: 0 },
        )

        setStats(statsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [page, searchTerm, typeFilter, serviceFilter, statusFilter])

  const handleEdit = async (resource: Resource) => {
  try {
    const updates: Partial<Resource> = {
      name: resource.name,
      type: resource.type,
      serviceCategory: resource.serviceCategory,
      description: resource.description,
      availabilityStatus: resource.availabilityStatus,
      contactPerson: resource.contactPerson,
      contactPhone: resource.contactPhone,
      contactEmail: resource.contactEmail,
      location: resource.location,
      capacity: resource.capacity,
      hourlyRate: resource.hourlyRate,
    }

    const response = await adminService.updateResource(resource.id, updates)

    if (response?.resource) {
      toast({
        title: "Success",
        description: response.message || "Resource updated successfully",
      })
      setEditingResource(null)
      fetchResources()
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to update resource",
      variant: "destructive",
    })
  }
}

  const handleDelete = async (resourceId: string) => {
  try {
    const response = await adminService.deleteResource(resourceId)

    if (response?.message) {
      toast({
        title: "Success",
        description: response.message || "Resource deleted successfully",
      })
      setDeleteConfirm(null)
      fetchResources()
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to delete resource",
      variant: "destructive",
    })
  }
}

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Personnel":
        return <Users className="h-4 w-4" />
      case "Equipment":
        return <Wrench className="h-4 w-4" />
      case "Vehicle":
        return <Truck className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800"
      case "Busy":
        return "bg-yellow-100 text-yellow-800"
      case "Maintenance":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getServiceCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      roads: "Roads & Infrastructure",
      water: "Water Supply",
      electricity: "Electricity",
      waste: "Waste Management",
      safety: "Public Safety",
      parks: "Parks & Recreation",
    }
    return categories[category] || category
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
    
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-gray-600">Monitor and manage city resources, personnel, equipment, and vehicles</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/resources/assign">
            <Button variant="outline">
              <UserCheck className="h-4 w-4 mr-2" />
              Assign Resources
            </Button>
          </Link>
          <Link href="/admin/resources/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All registered resources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.busy}</div>
            <p className="text-xs text-muted-foreground">Currently assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Resources</CardTitle>
          <CardDescription>Search and filter resources by type, service, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search resources by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Personnel">Personnel</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Service Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="roads">Roads & Infrastructure</SelectItem>
                <SelectItem value="water">Water Supply</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="waste">Waste Management</SelectItem>
                <SelectItem value="safety">Public Safety</SelectItem>
                <SelectItem value="parks">Parks & Recreation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Busy">Busy</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources ({total})</CardTitle>
          <CardDescription>Complete list of all city resources with current status and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Service Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(resource.type)}
                        <div>
                          <div className="font-medium">{resource.name}</div>
                          {resource.description && (
                            <div className="text-sm text-gray-500 max-w-[200px] truncate">{resource.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{resource.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getServiceCategoryLabel(resource.serviceCategory)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(resource.availabilityStatus)}>
                        {resource.availabilityStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {resource.contactPerson && (
                          <div className="flex items-center text-sm">
                            <Users className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="truncate max-w-[120px]">{resource.contactPerson}</span>
                          </div>
                        )}
                        {resource.contactPhone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {resource.contactPhone}
                          </div>
                        )}
                        {resource.contactEmail && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[120px]">{resource.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resource.location ? (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="truncate max-w-[100px]">{resource.location}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <Badge variant="secondary">{resource.activeAssignments}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {resource.hourlyRate ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">${resource.hourlyRate}/hr</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingResource(resource)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Resource
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(resource.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Resource
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {resources.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first resource.</p>
              <Link href="/admin/resources/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Resource Dialog */}
      {editingResource && (
        <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Resource</DialogTitle>
              <DialogDescription>Update resource information and availability status</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Resource Name</Label>
                <Input
                  id="edit-name"
                  value={editingResource.name}
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editingResource.type}
                  onValueChange={(value) => setEditingResource({ ...editingResource, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personnel">Personnel</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-service">Service Category</Label>
                <Select
                  value={editingResource.serviceCategory}
                  onValueChange={(value) => setEditingResource({ ...editingResource, serviceCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roads">Roads & Infrastructure</SelectItem>
                    <SelectItem value="water">Water Supply</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="waste">Waste Management</SelectItem>
                    <SelectItem value="safety">Public Safety</SelectItem>
                    <SelectItem value="parks">Parks & Recreation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Availability Status</Label>
                <Select
                  value={editingResource.availabilityStatus}
                  onValueChange={(value) => setEditingResource({ ...editingResource, availabilityStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-person">Contact Person</Label>
                <Input
                  id="edit-contact-person"
                  value={editingResource.contactPerson}
                  onChange={(e) => setEditingResource({ ...editingResource, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-phone">Contact Phone</Label>
                <Input
                  id="edit-contact-phone"
                  value={editingResource.contactPhone}
                  onChange={(e) => setEditingResource({ ...editingResource, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact-email">Contact Email</Label>
                <Input
                  id="edit-contact-email"
                  type="email"
                  value={editingResource.contactEmail}
                  onChange={(e) => setEditingResource({ ...editingResource, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingResource.location}
                  onChange={(e) => setEditingResource({ ...editingResource, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={editingResource.capacity}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, capacity: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hourly-rate">Hourly Rate ($)</Label>
                <Input
                  id="edit-hourly-rate"
                  type="number"
                  step="0.01"
                  value={editingResource.hourlyRate}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, hourlyRate: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingResource.description}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingResource(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleEdit(editingResource)}>
                <Settings className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Resource</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this resource? This action cannot be undone and will remove all
                associated assignments.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Resource
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </DashboardLayout>
  )
}
