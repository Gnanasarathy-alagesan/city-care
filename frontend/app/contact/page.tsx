import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, MapPin, ArrowLeft, Clock, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Phone,
      title: "Phone Support",
      details: "+1 (555) 123-4567",
      description: "Available Monday - Friday, 8:00 AM - 6:00 PM"
    },
    {
      icon: Mail,
      title: "Email Support", 
      details: "support@citycare.gov",
      description: "We'll respond within 24 hours"
    },
    {
      icon: MapPin,
      title: "Office Address",
      details: "123 City Hall Drive, Downtown",
      description: "Public Works Department, 3rd Floor"
    }
  ]

  const teamContacts = [
    {
      name: "Dr. Sarah Johnson",
      role: "Project Director",
      email: "sarah.johnson@citycare.gov",
      phone: "+1 (555) 101-2001",
      department: "Administration"
    },
    {
      name: "Michael Chen", 
      role: "Technical Support Lead",
      email: "michael.chen@citycare.gov",
      phone: "+1 (555) 101-2002",
      department: "Technical Support"
    },
    {
      name: "Emily Rodriguez",
      role: "User Experience Manager",
      email: "emily.rodriguez@citycare.gov", 
      phone: "+1 (555) 101-2003",
      department: "User Support"
    },
    {
      name: "David Thompson",
      role: "Data & Analytics Manager",
      email: "david.thompson@citycare.gov",
      phone: "+1 (555) 101-2004", 
      department: "Analytics"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CityCare</span>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have questions about CityCare? Need technical support? We're here to help! 
            Reach out to our team using any of the methods below.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((contact, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <contact.icon className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>{contact.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-gray-900 mb-2">{contact.details}</p>
                <p className="text-gray-600">{contact.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john.doe@email.com" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help you?" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Please describe your question or issue in detail..."
                    rows={5}
                    required 
                  />
                </div>
                
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Team Directory */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Office Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Monday - Friday</p>
                      <p className="text-sm text-gray-600">8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Saturday</p>
                      <p className="text-sm text-gray-600">9:00 AM - 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Sunday</p>
                      <p className="text-sm text-gray-600">Closed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Directory</CardTitle>
                <CardDescription>Direct contacts for specific departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamContacts.map((member, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-blue-600">{member.role}</p>
                          <p className="text-xs text-gray-500">{member.department}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-red-600">Emergency Services</p>
                    <p className="text-gray-600">Call 911 for immediate emergencies</p>
                  </div>
                  <div>
                    <p className="font-medium">After-Hours Support</p>
                    <p className="text-gray-600">+1 (555) 999-0000</p>
                  </div>
                  <div>
                    <p className="font-medium">Technical Issues</p>
                    <p className="text-gray-600">tech-support@citycare.gov</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
