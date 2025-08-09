'use client';

import { useEffect, useState } from 'react'
import { complaintService } from '@/services/complaint.service'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Filter } from 'lucide-react'
import Link from 'next/link'

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await complaintService.getComplaints()
        // API returns { complaints: [...], total, page }
        setComplaints(response?.complaints || [])
      } catch (err) {
        console.error('Failed to fetch complaints', err)
      } finally {
        setLoading(false)
      }
    }
    fetchComplaints()
  }, [])

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

        {/* Complaints List */}
        {loading ? (
          <p>Loading complaints...</p>
        ) : complaints.length > 0 ? (
          complaints.map((complaint) => (
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
          ))
        ) : (
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
