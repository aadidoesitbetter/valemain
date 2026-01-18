"use client";

import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useMemo } from 'react';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 28.6139, // New Delhi (from user context/snippet)
    lng: 77.2090
};

export default function GoogleMapComponent() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    });

    const center = useMemo(() => defaultCenter, []);

    if (!isLoaded) {
        return (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center animate-pulse">
                <p className="text-neutral-400 font-medium">Loading Map...</p>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            options={{
                disableDefaultUI: true,
                zoomControl: false,
                styles: [
                    {
                        "featureType": "poi",
                        "elementType": "labels",
                        "stylers": [{ "visibility": "off" }]
                    }
                ]
            }}
        >
            <Marker position={center} />
        </GoogleMap>
    );
}
