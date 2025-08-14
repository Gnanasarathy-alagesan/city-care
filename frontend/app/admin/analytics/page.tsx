"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsOverview } from "@/components/analytics-overview"
import { AnalyticsMetrics } from "@/components/analytics-metrics"
import { WatsonXRecommendations } from "@/components/watsonx-recommendations"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { watsonxService } from "@/services/bot.service"

export default function AnalyticsPage() {
  const [generatingInsights, setGeneratingInsights] = useState(false)

  const generateDynamicInsights = async () => {
    setGeneratingInsights(true)
    try {
      await watsonxService.analyzeCurrentData({
        includeComplaints: true,
        includeResources: true,
        includeUsers: true,
        timeframe: "30d",
      })

      const newInsights = await watsonxService.generateInsights()

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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
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
          </div>
        </div>

        <AnalyticsOverview />
        <AnalyticsMetrics />
        <WatsonXRecommendations />
      </div>
    </DashboardLayout>
  )
}
