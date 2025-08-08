import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useTheme } from '@/components/theme-provider.tsx';

export function LocationMap() {
  const position = { lat: 43.2965, lng: 5.3698 };
  const apiKey = import.meta.env.VITE_Maps_API_KEY;
  const { resolvedTheme } = useTheme();

  const lightStyles = [
    {
      featureType: 'administrative',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#1e2939' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#e5e5e5' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#dadada' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9e6f4' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
  ];

  const darkStyles = [
    { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1f2937' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d1d5db' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca3af' }],
    },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#111827' }] },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#86efac' }],
    },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#374151' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4b5563' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#111827' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#fcd34d' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#111827' }] },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d1d5db' }],
    },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0b1220' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-56 lg:h-full bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 w-full">
        API Key is missing.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full xs:h-56 sm:h-56 md:h-64 lg:h-full">
        <Map
          key={resolvedTheme}
          style={{ width: '100%', height: '100%' }}
          defaultCenter={position}
          defaultZoom={9}
          gestureHandling={'none'}
          disableDefaultUI={true}
          styles={resolvedTheme === 'dark' ? darkStyles : lightStyles}
        />
      </div>
    </APIProvider>
  );
}
