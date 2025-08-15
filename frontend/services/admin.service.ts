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
  totalResources: number
  availableResources: number
  busyResources: number
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

export interface Resource {
  id: string
  name: string
  type: string
  serviceCategory: string
  description?: string
  availabilityStatus: 'Available' | 'Busy' | 'Maintenance'
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  location?: string
  capacity?: number
  hourlyRate?: number
  activeAssignments: number
  createdAt: string
  updatedAt: string
}

export interface ResourceAssignment {
  id: string
  resource: {
    id: string
    name: string
    type: string
    serviceCategory: string
    contactPerson?: string
    contactPhone?: string
  }
  assignedBy: string
  assignedAt: string
  status: string
  startTime?: string
  endTime?: string
  estimatedHours?: number
  actualHours?: number
  notes?: string
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

export interface ResourceFilters {
  page?: number
  limit?: number
  search?: string
  type_filter?: string
  service_category?: string
  availability_status?: string
}

// API Key configuration
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY

// Create a separate API instance for admin operations with API key
const createAdminApi = () => {
  const adminApi = api.create()
  
  // Add API key to headers for admin requests
  adminApi.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${ADMIN_API_KEY}`
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

  // Resource Management
  getResources: async (filters: ResourceFilters = {}) => {
    const response = await adminApi.get('/admin/resources', { params: filters })
    return response.data
  },

  createResource: async (resourceData: {
    name: string
    type: string
    service_category: string
    description?: string
    contact_person?: string
    contact_phone?: string
    contact_email?: string
    location?: string
    capacity?: number
    hourly_rate?: number
  }) => {
    console.log('Creating resource with data:', resourceData)
    const response = await adminApi.post('/admin/resources', resourceData)
    return response.data
  },

  updateResource: async (resourceId: string, updates: Partial<Resource>) => {
    const response = await adminApi.put(`/admin/resources/${resourceId}`, updates)
    return response.data
  },

  deleteResource: async (resourceId: string) => {
    const response = await adminApi.delete(`/admin/resources/${resourceId}`)
    return response.data
  },

  // Resource Assignment
  getComplaintResources: async (complaintId: string) => {
    const response = await adminApi.get(`/admin/complaints/${complaintId}/resources`)
    return response.data
  },

  assignResourcesToComplaint: async (complaintId: string, assignmentData: {
    resource_ids: string[]
    notes?: string
    estimated_hours?: number
  }) => {
    const response = await adminApi.post(`/admin/complaints/${complaintId}/resources`, assignmentData)
    return response.data
  },

  removeResourceFromComplaint: async (complaintId: string, resourceId: string) => {
    const response = await adminApi.delete(`/admin/complaints/${complaintId}/resources/${resourceId}`)
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

    getResources: async (filters: ResourceFilters = {}) => {
      const response = await customAdminApi.get('/admin/resources', { params: filters })
      return response.data
    },

    assignResourcesToComplaint: async (complaintId: string, assignmentData: {
      resource_ids: string[]
      notes?: string
      estimated_hours?: number
    }) => {
      const response = await customAdminApi.post(`/admin/complaints/${complaintId}/resources`, assignmentData)
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
