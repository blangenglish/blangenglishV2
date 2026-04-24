// CheckoutForm.tsx - Payment form component (Stripe integration placeholder)
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ==================== Stripe Configuration ====================
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export const stripePromise = STRIPE_PUBLIC_KEY ? STRIPE_PUBLIC_KEY : null;

export interface StripeConfig {
  publishableKey: string;
  supportedPaymentMethods: string[];
  currency: string;
}

export const defaultStripeConfig: StripeConfig = {
  publishableKey: STRIPE_PUBLIC_KEY || '',
  supportedPaymentMethods: ['card'],
  currency: 'usd',
};

export const validateStripeSetup = (): boolean => {
  if (!STRIPE_PUBLIC_KEY) return false;
  if (!STRIPE_PUBLIC_KEY.startsWith('pk_')) return false;
  return true;
};

export const getStripeInstance = async (): Promise<unknown | null> => {
  if (!validateStripeSetup()) return null;
  return stripePromise;
};

// ==================== Payment Form Component ====================

interface PaymentData {
  amount: number;
  currency: string;
  productIds: string[];
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface CheckoutFormProps {
  paymentData: PaymentData;
  onSuccess?: (paymentIntent: unknown) => void;
  onError?: (error: string) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  paymentData,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          product_ids: paymentData.productIds,
          customer_info: paymentData.customerInfo,
        },
      });

      if (error) throw new Error(`Failed to create payment intent: ${error.message}`);
      if (!data?.client_secret) throw new Error('Server returned invalid payment configuration');

      onSuccess?.(data);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Información de pago
        </label>
        <div className="border rounded-md p-3 bg-white">
          <input
            type="text"
            placeholder="Número de tarjeta"
            className="w-full outline-none text-sm"
            readOnly
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 rounded-md font-medium ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Procesando...' : `Pagar $${(paymentData.amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
};

export const ExampleUsage = () => {
  const examplePaymentData: PaymentData = {
    amount: 2000,
    currency: 'usd',
    productIds: ['prod_1'],
    customerInfo: { name: 'John Doe', email: 'john@example.com' },
  };

  return (
    <CheckoutForm
      paymentData={examplePaymentData}
      onSuccess={(pi) => console.log('Payment successful!', pi)}
      onError={(err) => console.error('Payment failed:', err)}
    />
  );
};
