"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Business } from "@/types";

interface MapProps {
  businesses?: Business[];
  center?: [number, number];
  zoom?: number;
  onBusinessClick?: (business: Business) => void;
  showUserLocation?: boolean;
  className?: string;
}

export default function Map({
  businesses = [],
  center = [-122.4194, 37.7749],
  zoom = 12,
  onBusinessClick,
  showUserLocation = true,
  className = "w-full h-[500px]",
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("Mapbox token not configured");
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (showUserLocation) {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right"
      );
    }

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    businesses.forEach((biz) => {
      const el = document.createElement("div");
      el.className = "map-marker";
      el.style.cssText =
        "width:32px;height:32px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;transition:transform 0.2s;";
      el.onmouseenter = () => {
        el.style.transform = "scale(1.2)";
      };
      el.onmouseleave = () => {
        el.style.transform = "scale(1)";
      };

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(
          `<div style="padding:8px;max-width:200px;">
            <h3 style="font-weight:600;font-size:14px;margin:0 0 4px;">${biz.name}</h3>
            <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">${biz.category}</p>
            <p style="font-size:11px;color:#9ca3af;margin:0;">${biz.address}</p>
          </div>`
        );

      const marker = new mapboxgl.Marker(el)
        .setLngLat(biz.location.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        onBusinessClick?.(biz);
      });

      markersRef.current.push(marker);
    });
  }, [businesses, mapLoaded, onBusinessClick]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {!token ? (
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
            <p className="text-primary-600 font-medium">
              Map Preview
            </p>
            <p className="text-sm text-primary-400 mt-1">
              Set NEXT_PUBLIC_MAPBOX_TOKEN to enable interactive map
            </p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
    </div>
  );
}
