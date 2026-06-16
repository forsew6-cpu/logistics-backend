"use client";

import { useEffect, useState } from "react";
import type { Business } from "@/types";

interface MapProps {
  businesses?: Business[];
  center?: [number, number]; // [lng, lat] (GeoJSON order)
  zoom?: number;
  onBusinessClick?: (business: Business) => void;
  showUserLocation?: boolean;
  className?: string;
}

function LeafletMap({
  businesses = [],
  center = [-122.4194, 37.7749],
  zoom = 12,
  onBusinessClick,
  className = "w-full h-[500px]",
}: Omit<MapProps, "showUserLocation">) {
  const {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
  } = require("react-leaflet");
  const L = require("leaflet");

  useEffect(() => {
    delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, [L]);

  const businessIcon = L.divIcon({
    className: "custom-marker",
    html: '<div style="width:28px;height:28px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  function RecenterMap({ center: c }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.setView([c[1], c[0]], map.getZoom());
    }, [c, map]);
    return null;
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <MapContainer
        center={[center[1], center[0]]}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />
        {businesses.map((biz) => (
          <Marker
            key={biz._id}
            position={[
              biz.location.coordinates[1],
              biz.location.coordinates[0],
            ]}
            icon={businessIcon}
            eventHandlers={{
              click: () => onBusinessClick?.(biz),
            }}
          >
            <Popup>
              <div style={{ padding: "4px", maxWidth: "200px" }}>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    margin: "0 0 4px",
                  }}
                >
                  {biz.name}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: "0 0 4px",
                  }}
                >
                  {biz.category}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  {biz.address}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function Map(props: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden ${props.className || "w-full h-[500px]"}`}
      >
        <div className="w-full h-full bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center">
          <div className="text-center p-8">
            <svg
              className="w-16 h-16 text-primary-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-primary-600 font-medium">Loading Map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Import Leaflet CSS on client side
  require("leaflet/dist/leaflet.css");

  return <LeafletMap {...props} />;
}
