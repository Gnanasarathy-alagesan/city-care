import api from "@/lib/api";

export interface WatsonXInsight {
  id: string;
  type: "prediction" | "optimization" | "alert" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  data: any;
}

export interface AnalyticsOverview {
  totalComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  resourceUtilization: number;
  citizenSatisfaction: number;
  costEfficiency: number;
  activeResources: number;
  pendingComplaints: number;
}

export interface WatsonXAnalytics {
  overview: AnalyticsOverview;
  insights: WatsonXInsight[];
  trends: {
    complaintTrend: string;
    resolutionTrend: string;
    satisfactionTrend: string;
  };
  recommendations: string[];
}

export interface WatsonXAnalysisRequest {
  includeComplaints?: boolean;
  includeResources?: boolean;
  includeUsers?: boolean;
  timeframe?: string;
}

// API Key configuration
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

// Create a separate API instance for admin operations with API key
const createAdminApi = () => {
  const botApi = api.create();

  // Add API key to headers for admin requests
  botApi.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${ADMIN_API_KEY}`;
    return config;
  });

  return botApi;
};

const botApi = createAdminApi();

export const watsonxService = {
  // Get WatsonX analytics
  getAnalytics: async (): Promise<WatsonXAnalytics> => {
    const response = await botApi.get("/admin/analytics/watsonx");
    return response.data;
  },

  // Generate new insights
  generateInsights: async (): Promise<{ insights: WatsonXInsight[] }> => {
    const response = await botApi.post("/admin/analytics/watsonx/generate");
    return response.data;
  },

  // Get detailed insight information
  getInsightDetails: async (
    insightId: string,
  ): Promise<
    WatsonXInsight & { detailed_analysis: any; recommended_actions: string[] }
  > => {
    const response = await botApi.get(
      `/admin/analytics/watsonx/insights/${insightId}`,
    );
    return response.data;
  },

  // Analyze current data with WatsonX
  analyzeCurrentData: async (request: WatsonXAnalysisRequest): Promise<any> => {
    const response = await botApi.post(
      "/admin/analytics/watsonx/analyze",
      request,
    );
    return response.data;
  },

  // Chat functionality with Rights Agent
  chatWithRightsAgent: async (
    message: string,
    history: any[] = [],
  ): Promise<{
    message: string;
    confidence: number;
    intent: string;
    entities: any[];
    suggestedActions: string[];
  }> => {
    const response = await api.post("bot/chat", {
      message,
    });
    return response.data;
  },
};
