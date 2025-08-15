"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, Clock, CheckCircle } from "lucide-react";

// Mock data for San Francisco streets with complaint counts
const mockStreetData = [
  {
    id: 1,
    street: "Market Street",
    lat: 37.7879,
    lng: -122.4075,
    complaints: 1,
    priority: "High",
  },
  {
    id: 2,
    street: "Mission Street",
    lat: 37.7599,
    lng: -122.4148,
    complaints: 3,
    priority: "Medium",
  },
  {
    id: 3,
    street: "Van Ness Avenue",
    lat: 37.7849,
    lng: -122.4194,
    complaints: 2,
    priority: "High",
  },
  {
    id: 4,
    street: "Lombard Street",
    lat: 37.8021,
    lng: -122.4187,
    complaints: 1,
    priority: "Low",
  },
];

interface CityMapProps {
  complaints?: any[];
}

export function CityMap({ complaints = [] }: CityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstance) return;

    import("leaflet").then((L) => {
      // Fix for default markers
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // Initialize map
      const map = L.default
        .map(mapRef.current!)
        .setView([37.7749, -122.4194], 13);

      // Add tile layer
      L.default
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
        .addTo(map);

      // Add markers for each street
      mockStreetData.forEach((street) => {
        const color = getMarkerColor(street.priority, street.complaints);
        const radius = Math.max(8, street.complaints);

        const circle = L.default
          .circleMarker([street.lat, street.lng], {
            radius: radius,
            fillColor: color,
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          })
          .addTo(map);

        // Add popup
        const popupContent = `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900 mb-2">${street.street}</h3>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Complaints:</span>
                <span class="px-2 py-1 text-xs border rounded">${street.complaints}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Priority:</span>
                <span class="px-2 py-1 text-xs rounded ${getPriorityBadgeClass(street.priority)}">${street.priority}</span>
              </div>
            </div>
          </div>
        `;
        circle.bindPopup(popupContent);
      });

      setMapInstance(map);
    });

    // Cleanup function
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [isClient, mapInstance]);

  const getMarkerColor = (priority: string, complaintCount: number) => {
    if (complaintCount > 10) return "#ef4444"; // red for high complaint count
    if (priority === "High") return "#f97316"; // orange for high priority
    if (priority === "Medium") return "#eab308"; // yellow for medium priority
    return "#22c55e"; // green for low priority
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "Medium":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>San Francisco Street Complaints Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Street Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Streets
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockStreetData.length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  High Priority
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {mockStreetData.filter((s) => s.priority === "High").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Medium Priority
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mockStreetData.filter((s) => s.priority === "Medium").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockStreetData.reduce((sum, s) => sum + s.complaints, 0)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>San Francisco Street Complaints Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="h-96 rounded-lg overflow-hidden border"
            style={{ height: "384px", width: "100%" }}
          />
        </CardContent>
      </Card>

      {/* Street List */}
      <Card>
        <CardHeader>
          <CardTitle>Street Complaint Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockStreetData
              .sort((a, b) => b.complaints - a.complaints)
              .map((street) => (
                <div
                  key={street.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(street.priority)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {street.street}
                      </p>
                      <p className="text-sm text-gray-500">
                        {street.lat.toFixed(4)}, {street.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">
                      {street.complaints} complaints
                    </Badge>
                    <Badge
                      className={
                        street.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : street.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }
                    >
                      {street.priority}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
