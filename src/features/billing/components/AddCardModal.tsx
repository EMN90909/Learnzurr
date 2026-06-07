'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentMethodId: string) => void;
  userId: string;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function StripeCardForm({ 
  userId, 
  onSuccess, 
  onClose,
  setError,
  setIsLoading,
  isLoading,
  error,
}: { 
  userId: string; 
  onSuccess?: (paymentMethodId: string) => void;
  onClose: () => void;
  setError: (error: string) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  error: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');

  const handleVerify = async () => {
    if (!stripe || !elements) {
      setError('Stripe is not loaded yet. Please wait.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Step 1: Create SetupIntent on server
      const verifyResponse = await fetch('/api/payment/verify-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, provider: 'stripe' }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to initiate verification');
      }

      const { clientSecret, setupIntentId } = await verifyResponse.json();

      if (!clientSecret) {
        throw new Error('Could not get client secret for 3DS verification');
      }

      setStep('processing');

      // Step 2: Confirm SetupIntent with CardElement (triggers 3DS if required)
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || '3DS verification failed');
      }

      if (setupIntent?.status !== 'succeeded') {
        throw new Error(`Verification incomplete: ${setupIntent?.status}`);
      }

      // Step 3: Complete verification on server
      const completeResponse = await fetch('/api/payment/complete-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          setupIntentId,
          provider: 'stripe',
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to save card');
      }

      const { paymentMethodId, cardBrand, last4 } = await completeResponse.json();

      // Success
      setStep('success');
      setTimeout(() => {
        onSuccess?.(paymentMethodId);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification');
      setStep('input');
      console.error('Card verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
        <h3 className="text-lg font-semibold">Card Verified Successfully</h3>
        <p className="text-sm text-gray-600 text-center">Your payment method has been saved and verified with 3DS.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="p-4 border rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1a1a1a',
                  '::placeholder': {
                    color: '#6b7280',
                  },
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
                invalid: {
                  color: '#dc2626',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            Your card will be verified using 3D Secure (3DS) technology to protect against fraud. You may be redirected to your bank for authentication.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleVerify}
          disabled={isLoading || !stripe}
          className="w-full"
          size="lg"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {step === 'processing' ? 'Verifying with 3DS...' : isLoading ? 'Starting verification...' : 'Verify & Save Card'}
        </Button>
      </div>
    </div>
  );
}

export function AddCardModal({ isOpen, onClose, onSuccess, userId }: AddCardModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePayPalConnect = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Create PayPal Billing Agreement for 3DS-equivalent security
      const response = await fetch('/api/payment/paypal-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          returnUrl: `${window.location.origin}/billing?paypal_success=true`,
          cancelUrl: `${window.location.origin}/billing?paypal_cancel=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup PayPal');
      }

      const { approvalUrl, billingToken } = await response.json();
      
      // Store the billing token for verification after redirect
      sessionStorage.setItem('paypal_billing_token', billingToken);
      sessionStorage.setItem('paypal_user_id', userId);
      
      // Redirect user to PayPal for authorization (similar to 3DS)
      window.location.href = approvalUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to connect PayPal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>Securely add a card for your free trial. We use 3D Secure (3DS) verification to prevent fraud.</DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'paypal')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stripe">Credit/Debit Card</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="space-y-4 pt-4">
            <Elements stripe={stripePromise}>
              <StripeCardForm 
                userId={userId} 
                onSuccess={onSuccess} 
                onClose={onClose}
                setError={setError}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
                error={error}
              />
            </Elements>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="py-6 text-center space-y-4">
              <p className="text-gray-600">Connect your PayPal account for secure payments.</p>
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  PayPal uses advanced security measures to protect your transactions.
                </AlertDescription>
              </Alert>
              <Button onClick={handlePayPalConnect} disabled={isLoading} className="w-full" size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Connecting...' : 'Connect PayPal Account'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
