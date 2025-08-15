"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb } from "lucide-react";
import { watsonxService } from "@/services/bot.service";
import { toast } from "@/hooks/use-toast";

interface WatsonXRecommendationsProps {
  className?: string;
}

export function WatsonXRecommendations({
  className,
}: WatsonXRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await watsonxService.getAnalytics();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch WatsonX recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to load WatsonX recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          WatsonX Recommendations
        </CardTitle>
        <CardDescription>
          Actionable recommendations to improve operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <Skeleton className="flex-shrink-0 w-6 h-6 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
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
            {recommendations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recommendations available</p>
                <p className="text-xs">
                  Generate insights to get WatsonX recommendations
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
