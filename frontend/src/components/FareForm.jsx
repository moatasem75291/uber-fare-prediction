import React from 'react';

function FareForm({ formData, onChange, onSubmit, onSetNow, loading }) {
    return (
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <label htmlFor="pickup_datetime">Pickup Date & Time</label>
                <div className="datetime-input">
                    <input
                        type="text"
                        id="pickup_datetime"
                        name="pickup_datetime"
                        placeholder="YYYY-MM-DD HH:MM:SS"
                        value={formData.pickup_datetime}
                        onChange={onChange}
                        required
                    />
                    <button type="button" onClick={onSetNow} className="now-button">
                        Now
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="passenger_count">Number of Passengers</label>
                <select
                    id="passenger_count"
                    name="passenger_count"
                    value={formData.passenger_count}
                    onChange={onChange}
                    required
                >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                    ))}
                </select>
            </div>

            {/* Hidden input fields for coordinates - these are populated from the map */}
            <input type="hidden" name="pickup_longitude" value={formData.pickup_longitude} />
            <input type="hidden" name="pickup_latitude" value={formData.pickup_latitude} />
            <input type="hidden" name="dropoff_longitude" value={formData.dropoff_longitude} />
            <input type="hidden" name="dropoff_latitude" value={formData.dropoff_latitude} />

            <button
                type="submit"
                className="submit-button"
                disabled={loading || !formData.pickup_longitude || !formData.dropoff_longitude}
            >
                {loading ? 'Calculating...' : 'Predict Fare'}
            </button>
        </form>
    );
}

export default FareForm;
