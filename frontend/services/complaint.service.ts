import api from "@/lib/api";

export interface ComplaintRequest {
  title: string;
  description: string;
  serviceType: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  images?: File[];
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: "Open" | "Under Review" | "In Progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  location?: {
    lat: number;
    lng: number;
    address: string;
    district: string;
    city: string;
  };
  images: string[];
  reporterId: string;
  assignedTo?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: string;
    date: string;
    note: string;
    updatedBy: string;
  }>;
  aiAnalysis?: {
    priority: string;
    reasoning: string;
    estimatedCost: string;
    recommendedAction: string;
    confidence: number;
  };
}

export interface ComplaintFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  service?: string;
  userId?: string;
  city?: string;
}

export const complaintService = {
  // Get all complaints (with filters) - now defaults to San Francisco
  getComplaints: async (filters: ComplaintFilters = {}) => {
    const cityFilter = { ...filters, city: filters.city || "San Francisco" };
    const response = await api.get("/complaints", { params: cityFilter });
    return response.data;
  },

  // Get single complaint by ID
  getComplaint: async (id: string) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  // Create new complaint
  createComplaint: async (complaintData: ComplaintRequest) => {
    const formData = new FormData();

    formData.append("title", complaintData.title);
    formData.append("description", complaintData.description);
    formData.append("serviceType", complaintData.serviceType);

    if (complaintData.location) {
      formData.append("location", JSON.stringify(complaintData.location));
    }

    if (complaintData.images) {
      complaintData.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    const response = await api.post("/complaints", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Update complaint
  updateComplaint: async (id: string, updates: Partial<ComplaintRequest>) => {
    const response = await api.put(`/complaints/${id}`, updates);
    return response.data;
  },

  // Delete complaint
  deleteComplaint: async (id: string) => {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  },

  getComplaintsByCity: async (city = "San Francisco") => {
    const response = await api.get(`/complaints/city/${city}`);
    return response.data;
  },

  getStreetComplaintStats: async (city = "San Francisco") => {
    const response = await api.get(`/complaints/city/${city}/streets`);
    return response.data;
  },
};
