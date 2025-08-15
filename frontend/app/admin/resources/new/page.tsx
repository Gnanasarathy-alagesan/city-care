"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Users, Wrench, Truck } from "lucide-react"
import { adminService } from "@/services/admin.service"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const resourceTypes = [
  { value: "Personnel", label: "Personnel", icon: Users, description: "Human resources and teams" },
  { value: "Equipment", label: "Equipment", icon: Wrench, description: "Tools and machinery" },
  { value: "Vehicle", label: "Vehicle", icon: Truck, description: "Trucks, cars, and mobile units" },
]

const serviceCategories = [
  { value: "roads", label: "Roads & Infrastructure", description: "Road repair, construction, traffic management" },
  { value: "water", label: "Water Supply", description: "Plumbing, water systems, pipe repair" },
  { value: "electricity", label: "Electricity", description: "Electrical work, power systems, lighting" },
  { value: "waste", label: "Waste Management", description: "Garbage collection, recycling, cleanup" },
  { value: "safety", label: "Public Safety", description: "Safety inspections, emergency response" },
  { value: "parks", label: "Parks & Recreation", description: "Park maintenance, landscaping, facilities" },
]

export default function NewResourcePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    service_category: "",
    description: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    location: "",
    capacity: "",
    hourly_rate: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.service_category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const resourceData = {
        name: formData.name,
        type: formData.type,
        service_category: formData.service_category,
        description: formData.description || undefined,
        contact_person: formData.contact_person || undefined,
        contact_phone: formData.contact_phone || undefined,
        contact_email: formData.contact_email || undefined,
        location: formData.location || undefined,
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : undefined,
        hourly_rate: formData.hourly_rate ? Number.parseFloat(formData.hourly_rate) : undefined,
      }

      await adminService.createResource(resourceData)

      toast({
        title: "Success",
        description: "Resource created successfully",
      })

      router.push("/admin/resources")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create resource",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedType = resourceTypes.find((t) => t.value === formData.type)
  const selectedCategory = serviceCategories.find((c) => c.value === formData.service_category)

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/admin/resources">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Resource</h1>
            <p className="text-gray-600">Create a new resource for complaint management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the basic details for the new resource</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Resource Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Road Repair Crew A"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Resource Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource type" />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {selectedType && <p className="text-sm text-gray-500">{selectedType.description}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_category">Service Category *</Label>
                <Select
                  value={formData.service_category}
                  onValueChange={(value) => handleInputChange("service_category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory && <p className="text-sm text-gray-500">{selectedCategory.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the resource and its capabilities..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Contact details for coordinating with this resource</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    placeholder="e.g., John Smith"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange("contact_person", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    placeholder="e.g., +1-555-0123"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="e.g., john.smith@citycare.com"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location/Base</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Downtown Depot"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Specifications</CardTitle>
              <CardDescription>Additional specifications and pricing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 5 (people/units)"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Number of people, units, or capacity this resource can handle</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 75.00"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">Cost per hour for using this resource</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/resources">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
