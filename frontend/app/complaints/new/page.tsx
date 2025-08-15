'use client'

import { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Upload, X, CheckCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { complaintService } from '@/services/complaint.service'
import { aiService } from '@/services/ai.service'
import { geocodingService } from '@/services/geocoding.service'

export default function NewComplaintPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<{lat: number, lng: number, address?: string} | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [serviceType, setServiceType] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [complaintId, setComplaintId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const services = [
    { value: 'roads', label: 'Roads & Infrastructure' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'waste', label: 'Waste Management' },
    { value: 'safety', label: 'Public Safety' },
    { value: 'parks', label: 'Parks & Recreation' }
  ]

  const handleLocationClick = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          try {
            // Get address from coordinates
            const geocodeResult = await geocodingService.reverseGeocode(coords.lat, coords.lng)
            setLocation({
              ...coords,
              address: geocodeResult.address
            })
            
            toast({
              title: "Location captured!",
              description: `Location: ${geocodeResult.address}`,
            })
          } catch (error) {
            setLocation(coords)
            toast({
              title: "Location captured!",
              description: "Your current location has been added to the complaint.",
            })
          }
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Unable to get your location. Please try again.",
            variant: "destructive"
          })
        }
      )
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(prev => [...prev, ...files].slice(0, 3)) // Max 3 images
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleDescriptionChange = async (value: string) => {
    // Get AI suggestions after typing 2+ characters
    if (value.length >= 2) {
      try {
        const suggestions = await aiService.getSuggestions(value)
        setAiSuggestions(suggestions.suggestions.slice(0, 3))
      } catch (error) {
        // Fallback to static suggestions if AI service fails
        const staticSuggestions = [
          'Pothole on main road',
          'Street light not working',
          'Water leak on sidewalk',
          'Garbage not collected',
          'Broken traffic signal'
        ].filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        )
        setAiSuggestions(staticSuggestions.slice(0, 3))
      }
    } else {
      setAiSuggestions([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const complaintData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        serviceType: serviceType,
        location: location,
        images: selectedImages
      }

      const response = await complaintService.createComplaint(complaintData)
      
      setComplaintId(response.complaint.id)
      setShowSuccess(true)
      
      toast({
        title: "Complaint submitted successfully!",
        description: `Your complaint has been assigned ID: ${response.complaint.id}`,
      })
      
      setTimeout(() => {
        router.push('/complaints')
      }, 3000)
      
    } catch (error: any) {
      toast({
        title: "Failed to submit complaint",
        description: error.response?.data?.message || "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Your complaint has been successfully submitted. You'll receive updates on its progress.
              </p>
              <p className="text-sm text-gray-500">
                Complaint ID: #{complaintId}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Complaint</h1>
          <p className="text-gray-600">Report an issue to the Public Works Department</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us resolve your issue quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  required
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                />
                {aiSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                    <div className="space-y-1">
                      {aiSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="block w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          onClick={() => {
                            const textarea = document.getElementById('description') as HTMLTextAreaElement
                            textarea.value = suggestion
                            setAiSuggestions([])
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service Type *</Label>
                <Select value={serviceType} onValueChange={setServiceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upload Photos (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop images
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
                
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(file) || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLocationClick}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Get Current Location</span>
                  </Button>
                  {location && (
                    <span className="text-sm text-green-600">
                      Location captured ✓
                    </span>
                  )}
                </div>
                {location?.address && (
                  <p className="text-sm text-gray-600 mt-2">{location.address}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
