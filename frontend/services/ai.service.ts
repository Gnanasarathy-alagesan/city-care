import api from '@/lib/api'

export interface AISuggestion {
  suggestions: string[]
  confidence: number
}

export interface AIAnalysis {
  priority: string
  reasoning: string
  estimatedCost: string
  recommendedAction: string
  confidence: number
}

export interface AIInsight {
  type: 'Priority' | 'Resource' | 'Pattern'
  suggestion: string
  confidence: string
}

export const aiService = {
  // Get AI suggestions for complaint description
  getSuggestions: async (description: string): Promise<AISuggestion> => {
    const response = await api.post('/ai/suggest-category', { description })
    return response.data
  },

  // Get AI analysis for complaint
  analyzeComplaint: async (complaintId: string): Promise<AIAnalysis> => {
    const response = await api.post('/ai/analyze-complaint', { complaintId })
    return response.data
  },

  // Get AI insights for admin dashboard
  getInsights: async () => {
    const response = await api.get('/ai/insights')
    return response.data
  }
}
