import React from 'react';
import { useFormik } from 'formik';
import { Heart, Calendar, User, Mail, MapPin, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStepData } from '../../contexts/SiteBuilderContext';
import { parentInfoSchema } from '../../utils/validation';
import { ParentInfo } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';
import Card, { CardHeader, CardTitle, CardDescription } from '../common/Card';

export default function ParentInfoStep() {
  const { data, updateData } = useStepData<ParentInfo>(3);

  const formik = useFormik({
    initialValues: {
      parent1_name: data?.parent1_name || '',
      parent1_email: data?.parent1_email || '',
      parent2_name: data?.parent2_name || '',
      parent2_email: data?.parent2_email || '',
      due_date: data?.due_date || '',
      baby_name: data?.baby_name || '',
      hospital: data?.hospital || '',
      doctor: data?.doctor || '',
    },
    validationSchema: parentInfoSchema,
    onSubmit: async (values) => {
      // Clean up empty optional fields
      const cleanedValues = {
        ...values,
        parent2_name: values.parent2_name || undefined,
        parent2_email: values.parent2_email || undefined,
        baby_name: values.baby_name || undefined,
        hospital: values.hospital || undefined,
        doctor: values.doctor || undefined,
      };
      
      updateData(cleanedValues);
      toast.success('Parent information saved successfully!');
    },
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <div className="text-center py-6">
          <Heart className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tell Us About the Expecting Parents
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This information will be displayed on your baby raffle site and used for 
            communications about the raffle. All fields marked with * are required.
          </p>
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Primary Parent */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Parent Information *</CardTitle>
            <CardDescription>
              This parent will receive all administrative communications
            </CardDescription>
          </CardHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name *"
              placeholder="Sarah Johnson"
              leftIcon={<User className="w-4 h-4" />}
              {...formik.getFieldProps('parent1_name')}
              error={formik.touched.parent1_name ? formik.errors.parent1_name : undefined}
            />
            
            <Input
              label="Email Address *"
              type="email"
              placeholder="sarah@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Used for raffle notifications and admin access"
              {...formik.getFieldProps('parent1_email')}
              error={formik.touched.parent1_email ? formik.errors.parent1_email : undefined}
            />
          </div>
        </Card>

        {/* Secondary Parent */}
        <Card>
          <CardHeader>
            <CardTitle>Second Parent Information</CardTitle>
            <CardDescription>
              Optional - include the partner's information if desired
            </CardDescription>
          </CardHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              placeholder="John Johnson"
              leftIcon={<User className="w-4 h-4" />}
              {...formik.getFieldProps('parent2_name')}
              error={formik.touched.parent2_name ? formik.errors.parent2_name : undefined}
            />
            
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              {...formik.getFieldProps('parent2_email')}
              error={formik.touched.parent2_email ? formik.errors.parent2_email : undefined}
            />
          </div>
        </Card>

        {/* Baby Information */}
        <Card>
          <CardHeader>
            <CardTitle>Baby Information *</CardTitle>
            <CardDescription>
              Details about the expected arrival
            </CardDescription>
          </CardHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Due Date *"
              type="date"
              leftIcon={<Calendar className="w-4 h-4" />}
              helperText="Expected delivery date"
              {...formik.getFieldProps('due_date')}
              error={formik.touched.due_date ? formik.errors.due_date : undefined}
            />
            
            <Input
              label="Baby's Name"
              placeholder="Leave blank if keeping it a surprise!"
              leftIcon={<Heart className="w-4 h-4" />}
              helperText="Optional - only if you've chosen a name"
              {...formik.getFieldProps('baby_name')}
              error={formik.touched.baby_name ? formik.errors.baby_name : undefined}
            />
          </div>

          {formik.values.due_date && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <Calendar className="w-4 h-4 inline mr-1" />
                Expected arrival: <strong>{formatDate(formik.values.due_date)}</strong>
              </p>
            </div>
          )}
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>
              Optional details about the delivery (for raffle categories)
            </CardDescription>
          </CardHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Hospital/Birth Center"
              placeholder="St. Mary's Hospital"
              leftIcon={<MapPin className="w-4 h-4" />}
              helperText="Where the baby will be born"
              {...formik.getFieldProps('hospital')}
              error={formik.touched.hospital ? formik.errors.hospital : undefined}
            />
            
            <Input
              label="Doctor/Midwife"
              placeholder="Dr. Smith"
              leftIcon={<Stethoscope className="w-4 h-4" />}
              helperText="Primary care provider"
              {...formik.getFieldProps('doctor')}
              error={formik.touched.doctor ? formik.errors.doctor : undefined}
            />
          </div>
        </Card>

        {/* Preview */}
        {(formik.values.parent1_name || formik.values.parent2_name) && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Here's how this information will appear on your site
              </CardDescription>
            </CardHeader>
            
            <div className="bg-gradient-to-br from-pink-50 to-blue-50 p-6 rounded-lg border border-gray-200">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {formik.values.parent1_name}
                  {formik.values.parent2_name && ` & ${formik.values.parent2_name}`}
                  's Baby Raffle
                </h3>
                
                {formik.values.due_date && (
                  <p className="text-lg text-gray-700">
                    Expected Arrival: {formatDate(formik.values.due_date)}
                  </p>
                )}
                
                {formik.values.baby_name && (
                  <p className="text-lg text-primary-600 font-medium">
                    Welcome {formik.values.baby_name}! 👶
                  </p>
                )}
                
                {(formik.values.hospital || formik.values.doctor) && (
                  <div className="text-sm text-gray-600 space-y-1">
                    {formik.values.hospital && (
                      <p>📍 {formik.values.hospital}</p>
                    )}
                    {formik.values.doctor && (
                      <p>🩺 {formik.values.doctor}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!formik.isValid || !formik.dirty}
            loading={formik.isSubmitting}
          >
            Continue to Payment Setup
          </Button>
        </div>
      </form>

      {/* Privacy Notice */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-3">🔒 Privacy & Security:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Your information is encrypted and stored securely
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Only you can access and modify this information
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Participants only see what you choose to display publicly
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Email addresses are never shared with raffle participants
          </li>
        </ul>
      </Card>
    </div>
  );
}