import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your email...');
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token || !email) {
                setStatus('idle');
                setMessage('Please click the verification link sent to your email address to activate your account.');
                return;
            }

            setStatus('verifying');
            setMessage('Verifying your email...');

            try {
                const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, token })
                });
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(data.detail || 'Verification failed. The link may have expired.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('An error occurred. Please try again later.');
            }
        };

        verifyEmail();
    }, [token, email]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-orange-100">
                <div className="mb-6">
                    {status === 'verifying' && (
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    )}
                    {status === 'success' && (
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                            ✓
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                            ✕
                        </div>
                    )}
                    {status === 'idle' && (
                        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-4xl">
                            📧
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {status === 'success' ? 'Email Verified!' : status === 'error' ? 'Verification Failed' : status === 'idle' ? 'Check Your Email' : 'Verifying Email...'}
                </h1>

                <p className="text-gray-600 mb-8">
                    {message}
                </p>

                {status === 'success' && (
                    <Link
                        to="/login"
                        className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                        Go to Login
                    </Link>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <Link
                            to="/register"
                            className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                        >
                            Register Again
                        </Link>
                        <p className="text-sm text-gray-500 mt-4">
                            If you already have an account, contact support for assistance.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;