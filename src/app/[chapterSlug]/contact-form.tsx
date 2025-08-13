'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Enhanced schema with honeypot protection
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
  // Honeypot fields
  website: z.string().max(0).optional(),
  phone: z.string().max(0).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

type ContactFormProps = {
  chapterSlug: string;
  primaryColor: string;
};

export default function ContactForm({ chapterSlug, primaryColor }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate-limited'>('idle');
  const [formStartTime, setFormStartTime] = useState<number>(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      website: '',
      phone: '',
    },
  });

  // Record form start time
  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  const onSubmit = async (data: ContactFormData) => {
    // Check honeypot fields
    if (data.website || data.phone) {
      // Silently fail for bots
      setSubmitStatus('success');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          chapterSlug,
          formStartTime,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        reset();
        setFormStartTime(Date.now()); // Reset for potential new submission
      } else if (response.status === 429) {
        setSubmitStatus('rate-limited');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            rows={5}
            {...register('message')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--focus-ring-color': primaryColor } as React.CSSProperties}
            placeholder="Tell us about your interest in joining our chapter..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        {/* Honeypot fields - hidden from users */}
        <div style={{ display: 'none' }}>
          <input
            type="text"
            {...register('website')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input
            type="text"
            {...register('phone')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>

        {submitStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">
              ✅ Thank you for your message! We&apos;ll get back to you soon.
            </p>
          </div>
        )}

        {submitStatus === 'rate-limited' && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-orange-800 text-sm">
              ⏱️ You&apos;ve submitted too many messages recently. Please wait 15 minutes before trying again.
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              ❌ There was an error sending your message. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}