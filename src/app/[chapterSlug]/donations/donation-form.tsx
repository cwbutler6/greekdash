'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DonationCampaignType } from '@/generated/prisma';

const donationSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least $1').max(10000, 'Amount cannot exceed $10,000'),
  donorName: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  donorEmail: z.string().email('Please enter a valid email address'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  isAnonymous: z.boolean(),
  campaignId: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  goalAmount: number;
  currentAmount: number;
  type: DonationCampaignType;
  endDate: Date | null;
};

type DonationFormProps = {
  chapterSlug: string;
  primaryColor: string;
  campaigns: Campaign[];
};

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

export default function DonationForm({ chapterSlug, primaryColor, campaigns }: DonationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      isAnonymous: false,
    },
  });

  const watchedAmount = watch('amount');
  const watchedIsAnonymous = watch('isAnonymous');

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setValue('amount', amount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setValue('amount', numValue);
    }
  };

  const onSubmit = async (data: DonationFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // First create the donation
      const donationResponse = await fetch(`/api/chapters/${chapterSlug}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!donationResponse.ok) {
        throw new Error('Failed to create donation');
      }

      const donation = await donationResponse.json();

      // Then create the checkout session
      const checkoutResponse = await fetch(`/api/chapters/${chapterSlug}/donations/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donationId: donation.id,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await checkoutResponse.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error processing donation:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Donation Amount *
          </label>
          
          {/* Preset Amounts */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAmountSelect(amount)}
                className={`p-3 rounded-md border-2 font-medium transition-colors ${
                  selectedAmount === amount
                    ? 'border-current text-white'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: selectedAmount === amount ? primaryColor : 'transparent',
                  borderColor: selectedAmount === amount ? primaryColor : undefined,
                }}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          {/* Custom Amount */}
          <div>
            <label htmlFor="customAmount" className="block text-sm text-gray-600 mb-1">
              Or enter a custom amount:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="customAmount"
                min="1"
                max="10000"
                step="0.01"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
                placeholder="0.00"
              />
            </div>
          </div>
          
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Campaign Selection */}
        {campaigns.length > 0 && (
          <div>
            <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
              Support a Specific Campaign (Optional)
            </label>
            <select
              id="campaignId"
              {...register('campaignId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
            >
              <option value="">General Donation</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Donor Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="donorName"
              {...register('donorName')}
              disabled={watchedIsAnonymous}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
              placeholder={watchedIsAnonymous ? 'Anonymous' : 'Enter your full name'}
            />
            {errors.donorName && (
              <p className="mt-1 text-sm text-red-600">{errors.donorName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="donorEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="donorEmail"
              {...register('donorEmail')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
              placeholder="Enter your email address"
            />
            {errors.donorEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.donorEmail.message}</p>
            )}
          </div>
        </div>

        {/* Anonymous Donation */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAnonymous"
            {...register('isAnonymous')}
            className="h-4 w-4 rounded border-gray-300 focus:ring-2"
            style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
          />
          <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
            Make this donation anonymous
          </label>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message (Optional)
          </label>
          <textarea
            id="message"
            rows={3}
            {...register('message')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
            placeholder="Leave a message with your donation..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !watchedAmount}
          className="w-full py-3 px-4 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? 'Processing...' : `Donate $${watchedAmount || 0}`}
        </button>

        {/* Status Messages */}
        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              ❌ There was an error processing your donation. Please try again.
            </p>
          </div>
        )}
      </form>
      
      {/* Security Notice */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600 text-center">
          🔒 Your payment is processed securely through Stripe. We never store your payment information.
        </p>
      </div>
    </div>
  );
}