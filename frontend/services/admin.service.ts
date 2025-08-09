import api from '@/lib/api'

export interface AdminStats {
  totalComplaints: number
  totalComplaintsChange: number | null
  inProgress: number
  inProgressChange: number | null
  resolved: number
  resolvedChange: number | null
  highPriority: number
  highPriorityChange: number | null
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

export interface ComplaintFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  service?: string
}

// API Key configuration
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY

// Create a separate API instance for admin operations with API key
const createAdminApi = () => {
  const adminApi = api.create()
  
  // Add API key to headers for admin requests
  adminApi.interceptors.request.use((config) => {
    config.headers['admin-api-key'] = ADMIN_API_KEY
    return config
  })
  
  return adminApi
}

const adminApi = createAdminApi()

export const adminService = {
  // Get admin dashboard stats
  getDashboardStats: async (): Promise<AdminStats> => {
    const response = await adminApi.get('/admin/dashboard/stats')
    return response.data
  },

  // Get all users (admin only)
  getUsers: async (filters: UserFilters = {}) => {
    const response = await adminApi.get('/admin/users', { params: filters })
    return response.data
  },

  // Get all complaints (admin only)
  getComplaints: async (filters: ComplaintFilters = {}) => {
    const response = await adminApi.get('/admin/complaints', { params: filters })
    return response.data
  },

  // Get single user
  getUser: async (id: string) => {
    const response = await adminApi.get(`/admin/users/${id}`)
    return response.data
  },

  // Update user
  updateUser: async (id: string, updates: Partial<User>) => {
    const response = await adminApi.put(`/admin/users/${id}`, updates)
    return response.data
  },

  // Delete user
  deleteUser: async (id: string) => {
    const response = await adminApi.delete(`/admin/users/${id}`)
    return response.data
  },

  // Assign complaint to team
  assignComplaint: async (complaintId: string, assignmentData: { teamId: string, assignedTo: string }) => {
    const response = await adminApi.put(`/admin/complaints/${complaintId}/assign`, assignmentData)
    return response.data
  },

  // Update complaint status
  updateComplaintStatus: async (complaintId: string, statusData: { status: string, note?: string }) => {
    const response = await adminApi.put(`/admin/complaints/${complaintId}/status`, statusData)
    return response.data
  },

  // Update complaint priority
  updateComplaintPriority: async (complaintId: string, priorityData: { priority: string, reason?: string }) => {
    const response = await adminApi.put(`/admin/complaints/${complaintId}/priority`, priorityData)
    return response.data
  },

  // Get API info (useful for testing API key access)
  getApiInfo: async () => {
    const response = await adminApi.get('/admin/info')
    return response.data
  }
}

// Export a function to create admin API instance with custom API key (for bots)
export const createAdminServiceWithApiKey = (apiKey: string) => {
  const customAdminApi = api.create()
  
  customAdminApi.interceptors.request.use((config) => {
    config.headers['X-API-Key'] = apiKey
    return config
  })

  return {
    getDashboardStats: async (): Promise<AdminStats> => {
      const response = await customAdminApi.get('/admin/dashboard/stats')
      return response.data
    },

    getComplaints: async (filters: ComplaintFilters = {}) => {
      const response = await customAdminApi.get('/admin/complaints', { params: filters })
      return response.data
    },

    updateComplaintStatus: async (complaintId: string, statusData: { status: string, note?: string }) => {
      const response = await customAdminApi.put(`/admin/complaints/${complaintId}/status`, statusData)
      return response.data
    },

    assignComplaint: async (complaintId: string, assignmentData: { teamId: string, assignedTo: string }) => {
      const response = await customAdminApi.put(`/admin/complaints/${complaintId}/assign`, assignmentData)
      return response.data
    },

    getApiInfo: async () => {
      const response = await customAdminApi.get('/admin/info')
      return response.data
    }
  }
}
