"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import {
  Brain,
  TrendingUp,
  Activity,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lightbulb,
  BarChart3,
  PieChart,
  Target,
} from "lucide-react"
import { watsonxService, type WatsonXInsight, type WatsonXAnalytics } from "@/services/bot.service"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<WatsonXAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState<WatsonXInsight | null>(null)

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

  const refreshAnalytics = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
  }

  const generateDynamicInsights = async () => {
    setGeneratingInsights(true)
    try {
      // First analyze current data
      await watsonxService.analyzeCurrentData({
        includeComplaints: true,
        includeResources: true,
        includeUsers: true,
        timeframe: "30d",
      })

      // Then generate new insights
      const newInsights = await watsonxService.generateInsights()

      // Refresh analytics to get updated data
      await fetchAnalytics()

      toast({
        title: "Success",
        description: `Generated ${newInsights.insights?.length || 0} new insights using WatsonX AI`,
      })
    } catch (error) {
      console.error("Failed to generate insights:", error)
      toast({
        title: "Error",
        description: "Failed to generate new insights",
        variant: "destructive",
      })
    } finally {
      setGeneratingInsights(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <TrendingUp className="h-4 w-4" />
      case "optimization":
        return <Target className="h-4 w-4" />
      case "alert":
        return <AlertTriangle className="h-4 w-4" />
      case "recommendation":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case "prediction":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "optimization":
        return "bg-green-100 text-green-800 border-green-200"
      case "alert":
        return "bg-red-100 text-red-800 border-red-200"
      case "recommendation":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === "decreasing") return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            WatsonX Analytics
          </h1>
          <p className="text-gray-600">AI-powered insights and recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateDynamicInsights}
            disabled={generatingInsights}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Brain className={`h-4 w-4 mr-2 ${generatingInsights ? "animate-pulse" : ""}`} />
            {generatingInsights ? "Generating..." : "Generate AI Insights"}
          </Button>
          <Button onClick={refreshAnalytics} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Current Usage</span>
                <span>{analytics?.overview.resourceUtilization}%</span>
              </div>
              <Progress value={analytics?.overview.resourceUtilization || 0} className="h-2" />
              <p className="text-xs text-gray-600">{analytics?.overview.activeResources} active resources</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Efficiency Score</span>
                <span>{analytics?.overview.costEfficiency}%</span>
              </div>
              <Progress value={analytics?.overview.costEfficiency || 0} className="h-2" />
              <p className="text-xs text-gray-600">Above target efficiency</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pending Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{analytics?.overview.pendingComplaints}</div>
            <p className="text-sm text-gray-600">Awaiting resolution</p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">
                {analytics?.overview.pendingComplaints && analytics?.overview.totalComplaints
                  ? Math.round((analytics.overview.pendingComplaints / analytics.overview.totalComplaints) * 100)
                  : 0}
                % of total
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              WatsonX Insights
            </CardTitle>
            <CardDescription>AI-generated insights from your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.insights.slice(0, 4).map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${getInsightColor(insight.type)} text-xs`}>
                      {getInsightIcon(insight.type)}
                      <span className="ml-1 capitalize">{insight.type}</span>
                    </Badge>
                    <Badge variant="outline" className={`${getImpactColor(insight.impact)} text-xs`}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{insight.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Confidence: {insight.confidence}%</span>
                    <Progress value={insight.confidence} className="w-16 h-1" />
                  </div>
                </div>
              ))}
              {(!analytics?.insights || analytics.insights.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No insights available</p>
                  <p className="text-xs">Click "Generate AI Insights" to analyze your data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Actionable recommendations to improve operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800">
                    {index + 1}
                  </div>
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
              {(!analytics?.recommendations || analytics.recommendations.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recommendations available</p>
                  <p className="text-xs">Generate insights to get AI recommendations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insight Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getInsightColor(selectedInsight.type)}>
                    {getInsightIcon(selectedInsight.type)}
                    <span className="ml-1 capitalize">{selectedInsight.type}</span>
                  </Badge>
                  <Badge variant="outline" className={getImpactColor(selectedInsight.impact)}>
                    {selectedInsight.impact} impact
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedInsight(null)}>
                  ×
                </Button>
              </div>
              <CardTitle>{selectedInsight.title}</CardTitle>
              <CardDescription>Confidence: {selectedInsight.confidence}% • Generated by WatsonX AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{selectedInsight.description}</p>

              {selectedInsight.data && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Analysis Details</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedInsight.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedInsight.actionable && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Recommended Actions
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Review and implement the suggested optimization</li>
                    <li>• Monitor key metrics for improvement</li>
                    <li>• Schedule follow-up analysis in 2 weeks</li>
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                <span>Generated by WatsonX AI</span>
                <span>Powered by IBM Watson</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
