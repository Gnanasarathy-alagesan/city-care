'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, Calendar, User, FileText, Camera, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { adminService } from '@/services/admin.service'

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const [backUrl, setBackUrl] = useState('/complaints')
  const [complaint, setComplaint] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (isAdmin === 'true') {
      setBackUrl('/admin/complaints')
    }
  }, [])

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const res = await adminService.getComplaints({
          page: 1,
          limit: 100 // fetch enough so we can find this one
        })

        const found = res.complaints.find((c: any) => String(c.id) === params.id)

        if (found) {
          // Map API format → UI format
          setComplaint({
            id: found.id,
            title: found.title,
            description: found.description,
            service: found.service,
            status: found.status,
            priority: found.priority,
            date: found.date,
            location: found.location || { address: '', coordinates: {} },
            reporter: found.reporter, // not provided by API yet
            assignedTo: found.assignedTo || 'N/A',
            estimatedResolution: 'N/A', // placeholder
            images: found.images, // no images yet
            aiSuggestion: {
              priority: 'Medium',
              reasoning: 'AI analytics not available yet — placeholder.',
              estimatedCost: 'N/A',
              recommendedAction: 'N/A'
            },
            statusHistory: found.history.map((h: any) => ({
              status: h.status,
              date: h.date,
              note: h.note
            }))
          })
        }
      } catch (err) {
        console.error('Error fetching complaint detail:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaint()
  }, [params.id])

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

  if (loading) {
    return (
      <DashboardLayout>
        <p>Loading...</p>
      </DashboardLayout>
    )
  }

  if (!complaint) {
    return (
      <DashboardLayout>
        <p>Complaint not found.</p>
      </DashboardLayout>
    )
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Complaints
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{complaint.title}</h1>
            <p className="text-gray-600">Complaint #{complaint.id}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Complaint Details</CardTitle>
                    <CardDescription>Submitted on {complaint.date}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(complaint.status)}
                    {getPriorityBadge(complaint.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{complaint.description}</p>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Service: {complaint.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Assigned to: {complaint.assignedTo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Est. Resolution: {complaint.estimatedResolution}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{complaint.location.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Photos */}
            {complaint.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {complaint.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={`http://localhost:8000${image}`}
                          alt={`Complaint photo ${index + 1}`}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaint.statusHistory.map((entry, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        {index < complaint.statusHistory.length - 1 && (
                          <div className="w-px h-8 bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-900">{entry.status}</h4>
                          <span className="text-sm text-gray-500">{entry.date}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{entry.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Analysis</CardTitle>
                <CardDescription>IBM AI-powered insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended Priority</h4>
                  {getPriorityBadge(complaint.aiSuggestion.priority)}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Reasoning</h4>
                  <p className="text-sm text-gray-700">{complaint.aiSuggestion.reasoning}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Estimated Cost</h4>
                  <p className="text-sm text-gray-700">{complaint.aiSuggestion.estimatedCost}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended Action</h4>
                  <p className="text-sm text-gray-700">{complaint.aiSuggestion.recommendedAction}</p>
                </div>
              </CardContent>
            </Card>


            {/* Reporter Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reporter Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {complaint.reporter.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {complaint.reporter.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
