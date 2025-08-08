import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Construction, Droplets, Zap, Trash2, Shield, TreePine } from 'lucide-react'
import Link from 'next/link'

export default function ServicesPage() {
  const services = [
    {
      id: 'roads',
      title: 'Roads & Infrastructure',
      description: 'Report potholes, damaged roads, broken sidewalks, and traffic issues',
      icon: Construction,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      examples: ['Potholes', 'Broken sidewalks', 'Traffic signals', 'Road signs']
    },
    {
      id: 'water',
      title: 'Water Supply',
      description: 'Water leaks, pipe bursts, water quality issues, and supply problems',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      examples: ['Water leaks', 'Pipe bursts', 'Low pressure', 'Water quality']
    },
    {
      id: 'electricity',
      title: 'Electricity',
      description: 'Street lighting, power outages, electrical hazards, and maintenance',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      examples: ['Street lights', 'Power outages', 'Electrical hazards', 'Transformer issues']
    },
    {
      id: 'waste',
      title: 'Waste Management',
      description: 'Garbage collection, recycling, illegal dumping, and sanitation',
      icon: Trash2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      examples: ['Missed collection', 'Illegal dumping', 'Overflowing bins', 'Recycling issues']
    },
    {
      id: 'safety',
      title: 'Public Safety',
      description: 'Safety hazards, emergency situations, and security concerns',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      examples: ['Safety hazards', 'Emergency situations', 'Security concerns', 'Vandalism']
    },
    {
      id: 'parks',
      title: 'Parks & Recreation',
      description: 'Park maintenance, playground issues, landscaping, and facilities',
      icon: TreePine,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      examples: ['Playground damage', 'Tree maintenance', 'Park facilities', 'Landscaping']
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Select a service category to report an issue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 ${service.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <service.icon className={`w-6 h-6 ${service.color}`} />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Common Issues:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.examples.map((example) => (
                        <span
                          key={example}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/complaints/new?service=${service.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Report Issue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
