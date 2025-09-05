import React, { useState } from 'react';
import { useFormik } from 'formik';
import { DollarSign, Smartphone, QrCode, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStepData } from '../../contexts/SiteBuilderContext';
import { venmoConfigSchema } from '../../utils/validation';
import { VenmoConfig } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../common/Card';

export default function VenmoStep() {
  const { data, updateData } = useStepData<VenmoConfig>(4);
  const [showQRUpload, setShowQRUpload] = useState(false);

  const formik = useFormik({
    initialValues: {
      venmo_username: data?.venmo_username || '',
      venmo_display_name: data?.venmo_display_name || '',
      payment_instructions: data?.payment_instructions || 'Please include your name and "Baby Raffle" in the payment note.',
    },
    validationSchema: venmoConfigSchema,
    onSubmit: async (values) => {
      updateData(values);
      toast.success('Venmo configuration saved successfully!');
    },
  });

  const getVenmoUrl = (username: string) => {
    return `https://venmo.com/${username}`;
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <div className="text-center py-6">
          <DollarSign className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Set Up Payment Collection
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Configure how participants will send their raffle payments via Venmo. 
            This makes it easy for friends and family to participate in your baby raffle.
          </p>
        </div>
      </Card>

      {/* Important Notice */}
      <Card>
        <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-medium text-yellow-800 mb-1">Important Setup Requirements:</h4>
            <ul className="text-yellow-700 space-y-1">
              <li>• You must have an active Venmo account</li>
              <li>• Your Venmo account should be set to allow payments from friends</li>
              <li>• Consider setting up payment privacy settings appropriately</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Venmo Account Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Venmo Account Information</CardTitle>
            <CardDescription>
              Enter your Venmo username to receive raffle payments
            </CardDescription>
          </CardHeader>
          
          <div className="space-y-6">
            <Input
              label="Venmo Username *"
              placeholder="sarah-johnson-2024"
              leftIcon={<Smartphone className="w-4 h-4" />}
              helperText="Your @username from your Venmo profile (without the @)"
              {...formik.getFieldProps('venmo_username')}
              error={formik.touched.venmo_username ? formik.errors.venmo_username : undefined}
            />
            
            <Input
              label="Display Name"
              placeholder="Sarah Johnson"
              helperText="How your name appears to participants (optional - uses Venmo profile name if blank)"
              {...formik.getFieldProps('venmo_display_name')}
              error={formik.touched.venmo_display_name ? formik.errors.venmo_display_name : undefined}
            />

            {/* Venmo URL Preview */}
            {formik.values.venmo_username && !formik.errors.venmo_username && (
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      Participants will be directed to:
                    </p>
                    <a 
                      href={getVenmoUrl(formik.values.venmo_username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 underline hover:text-green-900"
                    >
                      {getVenmoUrl(formik.values.venmo_username)}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
            <CardDescription>
              Custom message shown to participants about how to send payments
            </CardDescription>
          </CardHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions for Participants
              </label>
              <textarea
                rows={4}
                className="input resize-none"
                placeholder="Please include your name and 'Baby Raffle' in the payment note so we can track your entry."
                {...formik.getFieldProps('payment_instructions')}
              />
              {formik.touched.payment_instructions && formik.errors.payment_instructions && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.payment_instructions}
                </p>
              )}
            </div>

            {/* Preview */}
            {formik.values.payment_instructions && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preview:</h4>
                <p className="text-sm text-gray-700 italic">
                  "{formik.values.payment_instructions}"
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* QR Code Upload (Future Feature) */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Venmo QR Code</span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  Coming Soon
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              Upload your Venmo QR code for even easier payments
            </CardDescription>
          </CardHeader>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <QrCode className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              QR code upload feature coming in a future update!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For now, participants will use your username to find you on Venmo
            </p>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!formik.isValid || !formik.dirty}
            loading={formik.isSubmitting}
          >
            Continue to Admin Settings
          </Button>
        </div>
      </form>

      {/* Payment Preview */}
      {formik.values.venmo_username && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Flow Preview</CardTitle>
            <CardDescription>
              Here's what participants will see when making payments
            </CardDescription>
          </CardHeader>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-gray-200">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Payment via Venmo</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  Send payment to: @{formik.values.venmo_username}
                </p>
                {formik.values.venmo_display_name && (
                  <p className="text-gray-700">
                    ({formik.values.venmo_display_name})
                  </p>
                )}
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-left">
                <p className="text-sm text-gray-600 mb-1">Instructions:</p>
                <p className="text-sm text-gray-900 italic">
                  {formik.values.payment_instructions}
                </p>
              </div>
              
              <Button variant="outline" size="sm">
                Open Venmo App
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-3">💡 Venmo Setup Tips:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Make sure your Venmo username is correct - participants will use this to find you
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Consider setting your Venmo payments to "friends only" for privacy
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Ask participants to include their name in payment notes for easy tracking
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            You can manually validate payments later in the admin dashboard
          </li>
        </ul>
      </Card>
    </div>
  );
}