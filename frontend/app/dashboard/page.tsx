'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { dashboardService } from '@/services/dashboard.service'
import { complaintService } from '@/services/complaint.service'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  totalComplaints: number
  inProgress: number
  resolved: number
}

interface Complaint {
  id: string
  title: string
  status: string
  date: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    inProgress: 0,
    resolved: 0
  })
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardStats = await dashboardService.getDashboardStats()
        setStats(dashboardStats)

        const res = await complaintService.getComplaints()
        const sorted = (res.complaints || []).sort(
          (a: Complaint, b: Complaint) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setComplaints(sorted)
      } catch (error: any) {
        toast({
          title: "Error loading dashboard",
          description: error.response?.data?.message || "Failed to load dashboard data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  const statsCards = [
    {
      title: "Total Complaints",
      value: stats.totalComplaints.toString(),
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "In Progress",
      value: stats.inProgress.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      title: "Resolved",
      value: stats.resolved.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ]

  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-500'
      case 'in progress':
        return 'bg-amber-500'
      case 'open':
        return 'bg-blue-500'
      default:
        return 'bg-gray-400'
    }
  }

  const toTitleCase = (str: string) =>
    str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your reports.</p>
          </div>
          <Link href="/complaints/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              New Complaint
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you might want to perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/complaints/new">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Report New Issue
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Browse Services
                </Button>
              </Link>
              <Link href="/complaints">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View My Complaints
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest complaint updates</CardDescription>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <p className="text-sm text-gray-500">No recent complaints found.</p>
              ) : (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <div key={c.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 ${getStatusDotColor(c.status)} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {toTitleCase(c.title) || 'Complaint'} {c.status.toLowerCase() === 'resolved' ? 'Resolved' : c.status.toLowerCase() === 'in progress' ? 'In Progress' : 'Submitted'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(c.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
