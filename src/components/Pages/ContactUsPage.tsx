import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

const ContactUsPage: React.FC = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  // Mutation for sending contact message
  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => ApiService.sendContactMessage(data),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');

      // Reset form
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: '',
        category: '',
        message: '',
        priority: 'medium'
      });
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message. Please try again.');
    },
  });

  const loading = sendMessageMutation.isPending;
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });

  const categories = [
    { value: 'technical', label: 'Technical Support', icon: '🔧' },
    { value: 'tree-monitoring', label: 'Tree Monitoring', icon: '🌳' },
    { value: 'account', label: 'Account Issues', icon: '👤' },
    { value: 'general', label: 'General Inquiry', icon: '💬' },
    { value: 'feedback', label: 'Feedback & Suggestions', icon: '💡' },
    { value: 'emergency', label: 'Emergency (Tree Health)', icon: '🚨' }
  ];

  const contactInfo = [
    {
      type: 'Email',
      value: 'support@onestudentonetreetree.org',
      icon: Mail,
      action: 'mailto:support@onestudentonetreetree.org'
    },
    {
      type: 'Phone',
      value: '+91 98765 43210',
      icon: Phone,
      action: 'tel:+919876543210'
    },
    {
      type: 'Address',
      value: 'Environmental Department, RMK Engineering College, Chennai - 601206',
      icon: MapPin,
      action: null
    }
  ];

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    if (!formData.message.trim()) {
      toast.error('Message is required');
      return false;
    }
    if (formData.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    sendMessageMutation.mutate({
      ...formData,
      userId: user?.id,
      userRole: user?.role
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pt-2 lg:pt-0 pb-16 lg:pb-6">
        <div className="p-3 lg:p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for contacting us. We've received your message and will respond within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pt-2 lg:pt-0 pb-16 lg:pb-6">
      <div className="p-3 lg:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-8 text-center">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
              <MessageSquare className="w-6 lg:w-8 h-6 lg:h-8 text-blue-600 mr-2 lg:mr-3" />
              Contact Us
            </h1>
            <p className="text-gray-600 text-sm lg:text-base max-w-2xl mx-auto">
              Have questions about tree monitoring, need technical support, or want to share feedback? 
              We're here to help you succeed in your environmental journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone and Priority */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority Level
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                      >
                        <option value="low">Low - General inquiry</option>
                        <option value="medium">Medium - Standard support</option>
                        <option value="high">High - Urgent assistance needed</option>
                      </select>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleInputChange('category', category.value)}
                          className={`p-2 lg:p-3 text-left border rounded-lg transition-colors text-xs lg:text-sm ${
                            formData.category === category.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{category.icon}</span>
                            <span className="font-medium">{category.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-3 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base resize-none"
                      placeholder="Please provide detailed information about your inquiry..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.message.length}/1000 characters (minimum 10 required)
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex items-center justify-center space-x-2 py-3 lg:py-4 rounded-lg font-medium transition-colors ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-6">
              {/* Contact Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{info.type}</p>
                        {info.action ? (
                          <a
                            href={info.action}
                            className="text-sm text-blue-600 hover:text-blue-800 break-all"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600">{info.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 lg:p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-blue-900">Response Time</h3>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• General inquiries: Within 24 hours</p>
                  <p>• Technical support: Within 12 hours</p>
                  <p>• Emergency issues: Within 2 hours</p>
                </div>
              </div>

              {/* Emergency Notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 lg:p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-semibold text-orange-900">Emergency?</h3>
                </div>
                <p className="text-sm text-orange-800 mb-3">
                  For urgent tree health issues or system emergencies, call us directly:
                </p>
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Emergency Line</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
