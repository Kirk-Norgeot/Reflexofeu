import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  latitude?: number;
  longitude?: number;
  markers?: Array<{ lat: number; lng: number; label?: string; id?: string }>;
  onMarkerClick?: (id: string) => void;
  className?: string;
}

export default function MapView({
  latitude = 46.603354,
  longitude = 1.888334,
  markers = [],
  onMarkerClick,
  className = 'h-96',
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current).setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });

      markers.forEach((marker) => {
        const m = L.marker([marker.lat, marker.lng], { icon: defaultIcon }).addTo(map);
        if (marker.label) {
          m.bindPopup(marker.label);
        }
        if (marker.id && onMarkerClick) {
          m.on('click', () => onMarkerClick(marker.id!));
        }
      });
    } else if (latitude && longitude) {
      L.marker([latitude, longitude], { icon: defaultIcon })
        .addTo(map)
        .bindPopup('Localisation');
    }

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, markers, onMarkerClick]);

  return <div ref={mapContainerRef} className={`rounded-lg ${className}`} />;
}
