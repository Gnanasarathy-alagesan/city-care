"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { TrendingUp, Activity, Users, Clock, CheckCircle } from "lucide-react"
import { watsonxService, type WatsonXAnalytics } from "@/services/bot.service"

export function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<WatsonXAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const data = await watsonxService.getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === "decreasing") return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.overview.totalComplaints}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getTrendIcon(analytics?.trends.complaintTrend || "stable")}
            <span className="ml-1">{analytics?.trends.complaintTrend}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics?.overview.resolvedComplaints && analytics?.overview.totalComplaints
              ? Math.round((analytics.overview.resolvedComplaints / analytics.overview.totalComplaints) * 100)
              : 0}
            %
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getTrendIcon(analytics?.trends.resolutionTrend || "stable")}
            <span className="ml-1">{analytics?.trends.resolutionTrend}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.overview.avgResolutionTime}d</div>
          <p className="text-xs text-muted-foreground">Average days to resolve</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.overview.citizenSatisfaction}/5</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {getTrendIcon(analytics?.trends.satisfactionTrend || "stable")}
            <span className="ml-1">{analytics?.trends.satisfactionTrend}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
