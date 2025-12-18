import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  XMarkIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

interface CollegeRegistrationProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CollegeRegistration: React.FC<CollegeRegistrationProps> = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  // Mutation for college registration
  const registerCollegeMutation = useMutation({
    mutationFn: (data: any) => ApiService.registerCollege(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('College registration submitted successfully! We will review your application and contact you soon.');
        onSuccess?.();
        onClose();
      } else {
        // Show API validation error message
        const errorMessage = response.message || 'Failed to submit college registration';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    },
    onError: (error: any) => {
      console.error('College registration failed:', error);
      const errorMessage = error.message || 'Failed to submit college registration';
      toast.error(errorMessage);
      setError(errorMessage);
    },
  });

  const loading = registerCollegeMutation.isPending;
  const [states,setStates]=useState([])
  const [districts,setDistricts] = useState([])
  const [stateid,setStateid]=useState<string>('')
  const [districtid,setDistrictid]=useState<string>('')

  const [formData, setFormData] = useState({
    // College Information
    collegeName: '',
    collegeCode: '',
    collegeAddress: '',
    collegeCity: '',
    collegeState: '',
    collegePincode: '',
    collegeEmail: '',
    collegePhone: '',
    collegeWebsite: '',
    establishedYear: '',
    collegeType: 'government',
    affiliatedUniversity: '',
    totalStudents: '',
    totalFaculty: '',

    // Point of Contact Information (required)
    pocName: '',
    pocEmail: '',
    pocPhone: '',
    pocDesignation: '',

    // Principal Information (optional)
    principalName: '',
    principalEmail: '',
    principalPhone: '',
  });


  useEffect(()=>{
    fetchStates()
    fetchdistrict()
  },[])

  const fetchStates = async () => {
  try {
    const response = await ApiService.getState();
    setStates(response); 
  } catch (err) {
    console.error("Error fetching states:", err);
  }
};

  const fetchdistrict =async()=>{
    try{
      const response = await ApiService.getDistrict()
      setDistricts(response)
    }
    catch (err) {
    console.error("Error fetching states:", err);
  }
  }
  debugger
  const filteredDistricts = districts.filter(district => 
      district.stateId == stateid
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handlestateid=(val:any)=>{
    console.log("stateid",val);
    setStateid(val)
    setDistrictid('') // Reset district selection when state changes
    
  }

  const handleDistrictid=(val:any)=>{
    console.log("districtid",val);
    setDistrictid(val)
    
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Basic required field validation
        if (!formData.collegeName) {
          toast.error('College name is required');
          return false;
        }
        if (!formData.collegeCode) {
          toast.error('College code is required');
          return false;
        }
        // Validate college code format (alphanumeric, 3-10 characters)
        if (!/^[A-Za-z0-9]{3,10}$/.test(formData.collegeCode)) {
          toast.error('College code must be 3-10 alphanumeric characters');
          return false;
        }
        if (!formData.collegeAddress) {
          toast.error('College address is required');
          return false;
        }
        if (!stateid) {
          toast.error('State is required');
          return false;
        }
        if (!districtid) {
          toast.error('District is required');
          return false;
        }
        if (!formData.collegePincode) {
          toast.error('Pincode is required');
          return false;
        }
        // Validate pincode format
        if (!/^[0-9]{6}$/.test(formData.collegePincode)) {
          toast.error('Pincode must be a 6-digit number');
          return false;
        }
        if (!formData.collegeEmail) {
          toast.error('College email is required');
          return false;
        }
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.collegeEmail)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        if (!formData.collegePhone) {
          toast.error('College phone number is required');
          return false;
        }
        return true;

      case 2:
        // Validate established year
        if (!formData.establishedYear) {
          toast.error('Established year is required');
          return false;
        }

        const currentYear = new Date().getFullYear();
        const establishedYear = parseInt(formData.establishedYear);

        if (isNaN(establishedYear)) {
          toast.error('Please enter a valid established year');
          return false;
        }

        if (establishedYear < 1800) {
          toast.error('Established year must be 1800 or later');
          return false;
        }

        if (establishedYear > currentYear) {
          toast.error(`Established year cannot be greater than current year (${currentYear})`);
          return false;
        }

        // Validate college type
        if (!formData.collegeType) {
          toast.error('College type is required');
          return false;
        }

        // Validate total students
        if (!formData.totalStudents) {
          toast.error('Total students is required');
          return false;
        }

        const totalStudents = parseInt(formData.totalStudents);
        if (isNaN(totalStudents) || totalStudents < 1) {
          toast.error('Total students must be at least 1');
          return false;
        }

        if (totalStudents > 100000) {
          toast.error('Total students cannot exceed 100,000');
          return false;
        }

        // Validate total faculty
        if (!formData.totalFaculty) {
          toast.error('Total faculty is required');
          return false;
        }

        const totalFaculty = parseInt(formData.totalFaculty);
        if (isNaN(totalFaculty) || totalFaculty < 1) {
          toast.error('Total faculty must be at least 1');
          return false;
        }

        if (totalFaculty > 10000) {
          toast.error('Total faculty cannot exceed 10,000');
          return false;
        }

        return true;

      case 3:
        // Validate POC information
        if (!formData.pocName) {
          toast.error('POC name is required');
          return false;
        }
        if (!formData.pocEmail) {
          toast.error('POC email is required');
          return false;
        }
        // Validate POC email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.pocEmail)) {
          toast.error('Please enter a valid POC email address');
          return false;
        }
        if (!formData.pocPhone) {
          toast.error('POC phone number is required');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    registerCollegeMutation.mutate({...formData, collegeState: stateid, collegeCity: districtid});
  };

  const steps = [
    { number: 1, title: 'College Information', icon: BuildingOfficeIcon },
    { number: 2, title: 'Additional Details', icon: CalendarIcon },
    { number: 3, title: 'POC Information', icon: UserIcon }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Register Your College</h2>
            <p className="text-gray-600 text-sm mt-1">Join the Student-ACT Learning Management System</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step {step.number}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: College Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">College Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange('collegeName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter college name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.collegeCode}
                  onChange={(e) => handleInputChange('collegeCode', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., RMKEC, ANNA, MIT"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique 3-10 character alphanumeric code for your college
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.collegeAddress}
                  onChange={(e) => handleInputChange('collegeAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter complete address"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>

                <select
                 value={stateid}
                  onChange={(e) => handlestateid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                 bg-white text-black 
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
              >
              <option value="" className='bg-white'>Select State</option>
            {states.map((state) => (
              <option key={state.id} value={state.id} className="text-black bg-white">
            {state.name}
            </option>
            ))}
              </select>


                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>

                  <select
                  value={districtid}
                  onChange={(e)=>handleDistrictid(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                 bg-white text-black 
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         disabled={!stateid} // Disable if no state selected
                  >
                  <option value="" className='bg-white'>{stateid ? "Select District" : "First select a state"}</option>
                  {filteredDistricts.map((district)=>
                  <option key={district.id} value={district.id}  className="text-black bg-white">
                    {district.name}
                  </option>
                  )}


                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.collegePincode}
                    onChange={(e) => handleInputChange('collegePincode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Pincode"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.collegeEmail}
                    onChange={(e) => handleInputChange('collegeEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="college@example.edu"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.collegePhone}
                    onChange={(e) => handleInputChange('collegePhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91-98765-43210"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.collegeWebsite}
                  onChange={(e) => handleInputChange('collegeWebsite', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.college.edu"
                />
              </div>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Established Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2000"
                    min="1800"
                    max={new Date().getFullYear()}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Year must be between 1800 and {new Date().getFullYear()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.collegeType}
                    onChange={(e) => handleInputChange('collegeType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="aided">Government Aided</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliated University
                </label>
                <input
                  type="text"
                  value={formData.affiliatedUniversity}
                  onChange={(e) => handleInputChange('affiliatedUniversity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="University name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Students <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalStudents}
                    onChange={(e) => handleInputChange('totalStudents', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Faculty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalFaculty}
                    onChange={(e) => handleInputChange('totalFaculty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: POC Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Point of Contact Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide details of the person who will be the primary contact for this college registration.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  POC Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pocName}
                  onChange={(e) => handleInputChange('pocName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dr. John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  POC Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.pocEmail}
                  onChange={(e) => handleInputChange('pocEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="poc@college.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  POC Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.pocPhone}
                  onChange={(e) => handleInputChange('pocPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91-98765-43210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  POC Designation
                </label>
                <input
                  type="text"
                  value={formData.pocDesignation}
                  onChange={(e) => handleInputChange('pocDesignation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Principal / Vice Principal / Registrar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Specify the role/title of the point of contact
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollegeRegistration;
