import React, { useState, useEffect, useRef } from 'react';

function ResultDisplay({ loading, error, prediction, liveRecommendation }) {
    const [animatedFare, setAnimatedFare] = useState(0);
    const [streamedText, setStreamedText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const fullTextRef = useRef('');
    const charIndexRef = useRef(0);
    const streamSpeedRef = useRef(30); // ms per character
    const streamingTimerRef = useRef(null);

    // Clean up any ongoing streaming when component unmounts
    useEffect(() => {
        return () => {
            if (streamingTimerRef.current) {
                clearTimeout(streamingTimerRef.current);
            }
        };
    }, []);

    // Animate fare when prediction changes
    useEffect(() => {
        if (!prediction) return;

        const targetFare = prediction.predicted_fare;
        const duration = 1500; // 1.5 second animation
        const steps = 25; // Number of steps in animation
        const increment = targetFare / steps;
        let current = 0;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                clearInterval(interval);
                setAnimatedFare(targetFare);

                // Start streaming the recommendation after fare animation completes
                if (prediction.recommendation) {
                    startStreamingText(prediction.recommendation);
                }
            } else {
                setAnimatedFare(current);
            }
        }, duration / steps);

        return () => clearInterval(interval);
    }, [prediction]);

    // Handle streaming of live recommendation when it changes
    useEffect(() => {
        if (liveRecommendation && !prediction) {
            startStreamingText(liveRecommendation);
        }
    }, [liveRecommendation, prediction]);

    const startStreamingText = (text) => {
        console.log(`Starting streaming text: ${text}`);

        // Clean up any ongoing streaming process
        if (streamingTimerRef.current) {
            clearTimeout(streamingTimerRef.current);
            streamingTimerRef.current = null;
        }

        // Reset state for new streaming
        setStreamedText('');
        charIndexRef.current = 0;
        fullTextRef.current = " " + text;  // Keep the space prefix
        setIsStreaming(true);

        const streamText = () => {
            if (charIndexRef.current < fullTextRef.current.length) {
                setStreamedText(fullTextRef.current.substring(0, charIndexRef.current + 1));
                charIndexRef.current++;
                streamingTimerRef.current = setTimeout(streamText, streamSpeedRef.current);
            } else {
                setIsStreaming(false);
                streamingTimerRef.current = null;
            }
        };

        // Start the streaming process
        streamText();
    };

    // Create ripple effect on fare amount
    const createRipple = (event) => {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    };

    return (
        <div className="results-container">
            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Calculating your fare...</div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            )}

            {/* Live recommendation section - always visible when locations are selected */}
            {liveRecommendation && !prediction && (
                <div className="live-recommendation">
                    <h3>Smart Recommendation</h3>
                    <p className={isStreaming ? 'streaming-text' : ''}>
                        {streamedText || liveRecommendation}
                    </p>
                    <div className="recommendation-note">
                        <em>Submit for a more accurate prediction and personalized recommendation</em>
                    </div>
                </div>
            )}

            {prediction && (
                <div className="prediction">
                    <div className="fare-box" onClick={createRipple}>
                        <h2>Estimated Fare</h2>
                        <div className="fare-amount" data-testid="fare-amount">
                            ${animatedFare.toFixed(2)}
                        </div>
                    </div>

                    <div className="explanation">
                        <h3>Why This Price?</h3>
                        <p>{prediction.explanation}</p>
                    </div>

                    <div className="recommendation">
                        <h3>Personalized Recommendation</h3>
                        <p className={isStreaming ? 'streaming-text' : ''}>
                            {streamedText || prediction.recommendation}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResultDisplay;