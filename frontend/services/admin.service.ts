import api from '@/lib/api'

export interface AdminStats {
  totalComplaints: number
  inProgress: number
  resolvedToday: number
  highPriority: number
  trends: Array<{
    category: string
    change: string
    direction: 'up' | 'down'
  }>
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  district?: string
  joinDate: string
  status: 'Active' | 'Inactive'
  complaintsCount: number
  lastActive: string
}

export interface UserFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  district?: string
}

export const adminService = {
  // Get admin dashboard stats
  getDashboardStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/dashboard/stats')
    return response.data
  },

  // Get all users (admin only)
  getUsers: async (filters: UserFilters = {}) => {
    const response = await api.get('/admin/users', { params: filters })
    return response.data
  },

  // Get single user
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },

  // Update user
  updateUser: async (id: string, updates: Partial<User>) => {
    const response = await api.put(`/admin/users/${id}`, updates)
    return response.data
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  },

  // Assign complaint to team
  assignComplaint: async (complaintId: string, assignmentData: { teamId: string, assignedTo: string }) => {
    const response = await api.put(`/admin/complaints/${complaintId}/assign`, assignmentData)
    return response.data
  },

  // Update complaint status
  updateComplaintStatus: async (complaintId: string, statusData: { status: string, note?: string }) => {
    const response = await api.put(`/admin/complaints/${complaintId}/status`, statusData)
    return response.data
  },

  // Update complaint priority
  updateComplaintPriority: async (complaintId: string, priorityData: { priority: string, reason?: string }) => {
    const response = await api.put(`/admin/complaints/${complaintId}/priority`, priorityData)
    return response.data
  }
}
