"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";

// LPU Coordinates (roughly center)
const LPU_CENTER: [number, number] = [31.2560, 75.7051];

interface ActiveStudent {
  userId: string;
  lat: number;
  lng: number;
  timestamp: number;
  updatedAt: string;
}

export default function MapComponent() {
  const [students, setStudents] = useState<Record<string, ActiveStudent>>({});

  // Fix for default marker icons in Leaflet with Next.js
  const customMarkerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("campus-presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const activeUsers: Record<string, ActiveStudent> = {};

        // Parse presence state into flat list
        for (const id in newState) {
          const presences = newState[id] as unknown as {
            location?: { lat: number; lng: number; timestamp: number };
            userId: string;
            updatedAt: string;
          }[];
          if (presences.length > 0) {
            const data = presences[presences.length - 1]; // Get latest track
            if (data.location) {
              activeUsers[id] = {
                userId: id,
                lat: data.location.lat,
                lng: data.location.lng,
                timestamp: data.location.timestamp,
                updatedAt: data.updatedAt,
              };
            }
          }
        }
        setStudents(activeUsers);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setStudents((prev) => {
          const next = { ...prev };
          (
            newPresences as unknown as {
              location?: { lat: number; lng: number; timestamp: number };
              userId: string;
              updatedAt: string;
            }[]
          ).forEach((p) => {
            if (p.location) {
              next[p.userId] = {
                userId: p.userId,
                lat: p.location.lat,
                lng: p.location.lng,
                timestamp: p.location.timestamp,
                updatedAt: p.updatedAt,
              };
            }
          });
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setStudents((prev) => {
          const next = { ...prev };
          (leftPresences as unknown as { userId: string }[]).forEach((p) => {
            delete next[p.userId];
          });
          return next;
        });
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const studentList = Object.values(students);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-outline-variant/20 shadow-xl shadow-black/40">
      <div className="absolute top-4 left-4 z-[400] bg-surface-container/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-outline-variant/20 shadow-lg shadow-black/20 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-sm font-bold text-on-surface">
          {studentList.length} Active {studentList.length === 1 ? "Student" : "Students"}
        </span>
      </div>

      <MapContainer
        center={LPU_CENTER}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", backgroundColor: "#131313" }}
        className="z-0 grayscale contrast-125 brightness-75"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {studentList.map((student) => (
          <Marker
            key={student.userId}
            position={[student.lat, student.lng]}
            icon={customMarkerIcon}
          >
            <Popup className="bg-surface-container border-none text-on-surface rounded-xl overflow-hidden">
              <div className="p-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00b5fc] block mb-1">
                  Active User
                </span>
                <span className="text-xs text-on-surface/60 break-all leading-tight block truncate">
                  ID: {student.userId.substring(0, 8)}...
                </span>
                <span className="text-[9px] text-on-surface/40 mt-2 block">
                  Last seen: {new Date(student.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
