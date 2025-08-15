"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { BarChart3, DollarSign, PieChart } from "lucide-react";
import { watsonxService, type WatsonXAnalytics } from "@/services/bot.service";

export function AnalyticsMetrics() {
  const [analytics, setAnalytics] = useState<WatsonXAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await watsonxService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load metrics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
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
            <Progress
              value={analytics?.overview.resourceUtilization || 0}
              className="h-2"
            />
            <p className="text-xs text-gray-600">
              {analytics?.overview.activeResources} active resources
            </p>
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
            <Progress
              value={analytics?.overview.costEfficiency || 0}
              className="h-2"
            />
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
          <div className="text-2xl font-bold mb-2">
            {analytics?.overview.pendingComplaints}
          </div>
          <p className="text-sm text-gray-600">Awaiting resolution</p>
          <div className="mt-3">
            <Badge variant="outline" className="text-xs">
              {analytics?.overview.pendingComplaints &&
              analytics?.overview.totalComplaints
                ? Math.round(
                    (analytics.overview.pendingComplaints /
                      analytics.overview.totalComplaints) *
                      100,
                  )
                : 0}
              % of total
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
