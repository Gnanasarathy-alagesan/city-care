import {api} from '@/lib/api'

export interface GeocodeResponse {
  address: string
  district: string
}

export const geocodingService = {
  // Convert coordinates to address
  reverseGeocode: async (lat: number, lng: number): Promise<GeocodeResponse> => {
    const response = await api.post('/geocode', { lat, lng })
    return response.data
  }
}
