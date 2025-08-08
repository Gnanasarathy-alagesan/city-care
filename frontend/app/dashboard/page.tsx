'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { dashboardService } from '@/services/dashboard.service'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  totalComplaints: number
  inProgress: number
  resolved: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    inProgress: 0,
    resolved: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardStats = await dashboardService.getDashboardStats()
        setStats(dashboardStats)
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

        {/* Quick Actions */}
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
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pothole on Main Street resolved</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Street light repair in progress</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Water leak complaint submitted</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
