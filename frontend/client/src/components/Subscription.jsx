import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { ENDPOINTS } from '../config/api';

const stripePromise = loadStripe('your_stripe_publishable_key');

function Subscription() {
  const [status, setStatus] = useState('inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(ENDPOINTS.subscriptionStatus, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setStatus(res.data.status);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    const stripe = await stripePromise;
    try {
      const response = await axios.post(
        ENDPOINTS.subscriptionCheckout,
        {},
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      await stripe.redirectToCheckout({ sessionId: response.data.id });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Subscription</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          <p className="mb-4">Current Status: {status}</p>
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Subscribe to Pro
          </button>
        </>
      )}
    </div>
  );
}

export default Subscription;