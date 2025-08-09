import api from '@/lib/api'
import { User } from './admin.service'

export interface DashboardStats {
  totalComplaints: number
  inProgress: number
  resolved: number
}

export const dashboardService = {
  // Get user dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  // Get recent activity
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/activity')
    return response.data
  },
  
  updateUser: async (updates: Partial<User>) => {
    const response = await api.put('/user', updates)
    return response.data
  }
}
