import React, { useState, useEffect } from 'react';
import './styles/App.css';
import FareForm from './components/FareForm';
import ResultDisplay from './components/ResultDisplay';
import LeafletMapSelector from './components/LeafletMapSelector';

function App() {
  const [formData, setFormData] = useState({
    pickup_datetime: '',
    pickup_longitude: '',
    pickup_latitude: '',
    dropoff_longitude: '',
    dropoff_latitude: '',
    passenger_count: 1
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationStep, setLocationStep] = useState('pickup'); // 'pickup' or 'dropoff'
  const [liveRecommendation, setLiveRecommendation] = useState('');

  // Set default location to NYC
  useEffect(() => {
    if (mapReady && !formData.pickup_longitude) {
      // Default to NYC location
      setFormData(prev => ({
        ...prev,
        pickup_longitude: -73.9876,
        pickup_latitude: 40.7484
      }));
    }
  }, [mapReady]);

  // Generate live recommendations whenever relevant data changes
  useEffect(() => {
    if (formData.pickup_longitude && formData.dropoff_longitude) {
      generateLiveRecommendation();
    }
  }, [formData.pickup_longitude, formData.pickup_latitude,
  formData.dropoff_longitude, formData.dropoff_latitude,
  formData.passenger_count]);

  const generateLiveRecommendation = () => {
    // Calculate rough distance in miles using Haversine formula
    const R = 3958.8; // Earth radius in miles
    const dLat = (formData.dropoff_latitude - formData.pickup_latitude) * Math.PI / 180;
    const dLon = (formData.dropoff_longitude - formData.pickup_longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(formData.pickup_latitude * Math.PI / 180) * Math.cos(formData.dropoff_latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Generate a live recommendation based on distance
    if (distance < 1) {
      setLiveRecommendation("Short trip detected (under 1 mile). Consider walking or biking for eco-friendly travel.");
    } else if (distance < 3) {
      setLiveRecommendation("Medium distance trip (1-3 miles). Standard Uber recommended for quick and efficient transport.");
    } else if (distance < 10) {
      setLiveRecommendation("Longer trip detected (3-10 miles). UberX or UberXL recommended depending on your party size.");
    } else {
      setLiveRecommendation("Long distance journey (over 10 miles). Consider UberXL or BLACK for maximum comfort on this extended ride.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passenger_count' ? parseInt(value) : value
    }));
  };

  const handleSetNow = () => {
    const now = new Date();
    const formattedDatetime = now.toISOString().replace('T', ' ').substring(0, 19);
    setFormData(prev => ({
      ...prev,
      pickup_datetime: formattedDatetime
    }));
  };

  const handleLocationSelect = (lat, lng) => {
    if (locationStep === 'pickup') {
      setFormData(prev => ({
        ...prev,
        pickup_latitude: lat,
        pickup_longitude: lng
      }));
      setLocationStep('dropoff');
    } else {
      setFormData(prev => ({
        ...prev,
        dropoff_latitude: lat,
        dropoff_longitude: lng
      }));
      setLocationStep('pickup');
    }
  };

  const handleResetLocations = () => {
    setFormData(prev => ({
      ...prev,
      pickup_longitude: '',
      pickup_latitude: '',
      dropoff_longitude: '',
      dropoff_latitude: ''
    }));
    setLocationStep('pickup');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const payload = {
        ...formData,
        pickup_longitude: parseFloat(formData.pickup_longitude),
        pickup_latitude: parseFloat(formData.pickup_latitude),
        dropoff_longitude: parseFloat(formData.dropoff_longitude),
        dropoff_latitude: parseFloat(formData.dropoff_latitude)
      };

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Uber Fare Predictor</h1>
        <p>Get fare estimates and personalized recommendations</p>
      </header>
      <div className="content">
        <div className="map-container">
          <div className="location-selector">
            <h3>
              {locationStep === 'pickup'
                ? 'Select pickup location on the map'
                : 'Select dropoff location on the map'}
            </h3>
            <button
              onClick={handleResetLocations}
              className="reset-button"
              disabled={!formData.pickup_longitude && !formData.dropoff_longitude}
            >
              Reset Locations
            </button>
          </div>
          <LeafletMapSelector
            onLocationSelect={handleLocationSelect}
            pickupLocation={formData.pickup_latitude ?
              { lat: parseFloat(formData.pickup_latitude), lng: parseFloat(formData.pickup_longitude) } : null}
            dropoffLocation={formData.dropoff_latitude ?
              { lat: parseFloat(formData.dropoff_latitude), lng: parseFloat(formData.dropoff_longitude) } : null}
            onMapReady={() => setMapReady(true)}
            locationStep={locationStep}
          />
          <div className="coordinates-display">
            {formData.pickup_latitude && (
              <div className="location-point">
                <strong>Pickup:</strong> {parseFloat(formData.pickup_latitude).toFixed(4)}, {parseFloat(formData.pickup_longitude).toFixed(4)}
              </div>
            )}
            {formData.dropoff_latitude && (
              <div className="location-point">
                <strong>Dropoff:</strong> {parseFloat(formData.dropoff_latitude).toFixed(4)}, {parseFloat(formData.dropoff_longitude).toFixed(4)}
              </div>
            )}
          </div>

          {/* Car and Person Animations */}
          <div className="car-animation"></div>
          <div className="person-animation"></div>

          {/* Road Animation */}
          <div className="road-container">
            <div className="road-line"></div>
          </div>
        </div>
        <div className="form-and-results">
          <div className="form-container">
            <FareForm
              formData={formData}
              onChange={handleInputChange}
              onSetNow={handleSetNow}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
          <ResultDisplay
            loading={loading}
            error={error}
            prediction={prediction}
            liveRecommendation={liveRecommendation}
          />
        </div>
      </div>
    </div>
  );
}

export default App;