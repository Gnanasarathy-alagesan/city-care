import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MapPin, ArrowLeft, Users, Target, Award } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Project Director",
      email: "sarah.johnson@citycare.gov",
      phone: "+1 (555) 101-2001",
      image: "/diverse-user-avatars.png",
      bio: "Leading digital transformation in public services with 15+ years of experience in municipal technology."
    },
    {
      name: "Michael Chen",
      role: "Lead Developer",
      email: "michael.chen@citycare.gov", 
      phone: "+1 (555) 101-2002",
      image: "/diverse-user-avatars.png",
      bio: "Full-stack developer specializing in civic technology and AI-powered solutions for government services."
    },
    {
      name: "Emily Rodriguez",
      role: "UX/UI Designer",
      email: "emily.rodriguez@citycare.gov",
      phone: "+1 (555) 101-2003", 
      image: "/diverse-user-avatars.png",
      bio: "Designing accessible and user-friendly interfaces for public services with focus on citizen experience."
    },
    {
      name: "David Thompson",
      role: "Data Analyst",
      email: "david.thompson@citycare.gov",
      phone: "+1 (555) 101-2004",
      image: "/diverse-user-avatars.png",
      bio: "Leveraging data analytics and IBM AI to optimize city operations and improve service delivery."
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
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About CityCare</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            CityCare is a revolutionary platform that bridges the gap between citizens and the Public Works Department, 
            making it easier than ever to report issues and track their resolution.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                To create a transparent, efficient, and citizen-centric platform that empowers communities 
                to actively participate in improving their city's infrastructure and services.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                To build smarter, more responsive cities where every citizen's voice is heard and 
                every issue is addressed promptly through the power of technology and collaboration.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle>Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Transparency, accountability, innovation, and citizen empowerment drive everything we do. 
                We believe in making government services accessible to all.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600">
              The dedicated professionals behind CityCare's success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-24 h-24 mx-auto mb-4">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-blue-600 font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{member.bio}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{member.email}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{member.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="mb-16">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Powered by Advanced Technology</CardTitle>
            <CardDescription>
              CityCare leverages cutting-edge technology to deliver exceptional service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="font-semibold text-lg mb-2">IBM AI Integration</h3>
                <p className="text-gray-600">
                  Smart complaint categorization and priority assignment using IBM Watson AI
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-time Tracking</h3>
                <p className="text-gray-600">
                  Live updates and transparent progress tracking for all reported issues
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Mobile-First Design</h3>
                <p className="text-gray-600">
                  Responsive design ensuring seamless experience across all devices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of citizens already using CityCare to make their communities better
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Sign Up Today
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
