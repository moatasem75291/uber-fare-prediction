import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// Fix for Leaflet marker icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons
const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map clicks and add event listeners
function MapEvents({ onLocationSelect }) {
    const map = useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

// Component to handle routing
function RoutingMachine({ pickupLocation, dropoffLocation }) {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!pickupLocation || !dropoffLocation) return;

        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }

        const waypoints = [
            L.latLng(pickupLocation.lat, pickupLocation.lng),
            L.latLng(dropoffLocation.lat, dropoffLocation.lng)
        ];

        routingControlRef.current = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{ color: '#2563eb', opacity: 0.7, weight: 5 }]
            },
            createMarker: () => { return null; } // Disable default markers, we'll use our own
        }).addTo(map);

        // Fit bounds to show the entire route with some padding
        const bounds = L.latLngBounds(waypoints);
        map.fitBounds(bounds, { padding: [50, 50] });

        return () => {
            if (routingControlRef.current) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, pickupLocation, dropoffLocation]);

    return null;
}

// Search box component
function SearchBox({ placeholder, onPlaceSelected, locationStep }) {
    // This is a simplified search box that would need to be enhanced 
    // with a geocoding service like Nominatim
    const [searchValue, setSearchValue] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!searchValue.trim()) return;

        try {
            // Using OpenStreetMap's Nominatim service for geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const location = data[0];
                onPlaceSelected(parseFloat(location.lat), parseFloat(location.lon));
                setSearchValue('');
            }
        } catch (error) {
            console.error("Error searching for location:", error);
        }
    };

    return (
        <div className="search-container" style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            zIndex: 1000
        }}>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="search-input"
                    style={{
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        width: '100%'
                    }}
                />
            </form>
        </div>
    );
}

function LeafletMapSelector({ onLocationSelect, pickupLocation, dropoffLocation, onMapReady, locationStep = 'pickup' }) {
    const [mapLoaded, setMapLoaded] = useState(false);

    // NYC default coordinates
    const defaultCenter = [40.7484, -73.9876];
    const zoom = 12;

    useEffect(() => {
        if (!mapLoaded) return;
        if (onMapReady) onMapReady();
    }, [mapLoaded, onMapReady]);

    return (
        <div className="map-wrapper" style={{ position: 'relative' }}>
            <MapContainer
                center={defaultCenter}
                zoom={zoom}
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                whenReady={() => setMapLoaded(true)}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents onLocationSelect={onLocationSelect} />

                {pickupLocation && (
                    <Marker
                        position={[pickupLocation.lat, pickupLocation.lng]}
                        icon={pickupIcon}
                    >
                        <Popup>Pickup Location</Popup>
                    </Marker>
                )}

                {dropoffLocation && (
                    <Marker
                        position={[dropoffLocation.lat, dropoffLocation.lng]}
                        icon={dropoffIcon}
                    >
                        <Popup>Dropoff Location</Popup>
                    </Marker>
                )}

                {pickupLocation && dropoffLocation && (
                    <RoutingMachine
                        pickupLocation={pickupLocation}
                        dropoffLocation={dropoffLocation}
                    />
                )}
            </MapContainer>

            <SearchBox
                placeholder={`Search for ${locationStep === 'pickup' ? 'pickup' : 'dropoff'} location`}
                onPlaceSelected={onLocationSelect}
                locationStep={locationStep}
            />

            {/* Map legend */}
            <div className="map-legend" style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '10px',
                fontSize: '12px',
                zIndex: 1000
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#22c55e',
                        borderRadius: '50%'
                    }}></div>
                    <span>Pickup</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%'
                    }}></div>
                    <span>Dropoff</span>
                </div>
            </div>

            {/* Map instructions */}
            <div className="map-instructions" style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 1000
            }}>
                Click on map to select {locationStep === 'pickup' ? 'pickup' : 'dropoff'} location
            </div>
        </div>
    );
}

export default LeafletMapSelector;