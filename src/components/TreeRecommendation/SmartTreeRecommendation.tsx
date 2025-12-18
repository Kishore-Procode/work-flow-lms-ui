import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Star,
  Clock,
  Droplets,
  Sun,
  TreePine,
  Award,
  ArrowRight
} from 'lucide-react';
import { 
  TreeRecommendationEngine, 
  StudentProfile, 
  RecommendationResult,
  TREE_SPECIES_DATABASE 
} from '../../utils/treeRecommendationEngine';
import Card from '../UI/Card';
import { FadeIn, ScaleIn, Stagger } from '../UI/Animations';

const SmartTreeRecommendation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<StudentProfile>>({});
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const steps = [
    {
      title: 'Experience Level',
      description: 'How experienced are you with plant care?',
      key: 'experience'
    },
    {
      title: 'Your Interests',
      description: 'What type of trees interest you most?',
      key: 'interests'
    },
    {
      title: 'Available Time',
      description: 'How much time can you dedicate to tree care?',
      key: 'availableTime'
    },
    {
      title: 'Location Details',
      description: 'Tell us about your planting location',
      key: 'location'
    },
    {
      title: 'Preferences',
      description: 'Your specific preferences',
      key: 'preferences'
    }
  ];

  const handleStepComplete = (stepData: any) => {
    setProfile(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      generateRecommendations({ ...profile, ...stepData });
    }
  };

  const generateRecommendations = (completeProfile: StudentProfile) => {
    const results = TreeRecommendationEngine.generateRecommendations(completeProfile, 5);
    setRecommendations(results);
    setShowResults(true);
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setProfile({});
    setRecommendations([]);
    setSelectedRecommendation(null);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="p-6 space-y-6">
        <FadeIn>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Personalized Tree Recommendations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Based on your preferences and location</p>
          </div>
        </FadeIn>

        <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.tree.species}
              recommendation={recommendation}
              rank={index + 1}
              onSelect={() => setSelectedRecommendation(recommendation)}
              isSelected={selectedRecommendation?.tree.species === recommendation.tree.species}
            />
          ))}
        </Stagger>

        {selectedRecommendation && (
          <DetailedRecommendationView 
            recommendation={selectedRecommendation}
            onClose={() => setSelectedRecommendation(null)}
          />
        )}

        <div className="text-center">
          <button
            onClick={resetWizard}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <FadeIn>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Smart Tree Recommendation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get personalized tree recommendations based on your preferences and location
          </p>
        </div>
      </FadeIn>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ScaleIn>
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {steps[currentStep].description}
          </p>

          {currentStep === 0 && (
            <ExperienceStep onComplete={handleStepComplete} />
          )}
          {currentStep === 1 && (
            <InterestsStep onComplete={handleStepComplete} />
          )}
          {currentStep === 2 && (
            <TimeStep onComplete={handleStepComplete} />
          )}
          {currentStep === 3 && (
            <LocationStep onComplete={handleStepComplete} />
          )}
          {currentStep === 4 && (
            <PreferencesStep onComplete={handleStepComplete} />
          )}
        </Card>
      </ScaleIn>
    </div>
  );
};

// Step Components
const ExperienceStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const options = [
    { value: 'beginner', label: 'Beginner', description: 'New to plant care' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some gardening experience' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced gardener' }
  ];

  return (
    <div className="space-y-3">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onComplete({ experience: option.value })}
          className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
        </button>
      ))}
    </div>
  );
};

const InterestsStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const interests = [
    { value: 'fruit', label: 'Fruit Trees', icon: '🍎' },
    { value: 'shade', label: 'Shade Trees', icon: '🌳' },
    { value: 'ornamental', label: 'Ornamental Trees', icon: '🌺' },
    { value: 'medicinal', label: 'Medicinal Trees', icon: '🌿' },
    { value: 'timber', label: 'Timber Trees', icon: '🪵' }
  ];

  const toggleInterest = (value: string) => {
    setSelected(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {interests.map(interest => (
          <button
            key={interest.value}
            onClick={() => toggleInterest(interest.value)}
            className={`p-4 text-left border rounded-lg transition-colors ${
              selected.includes(interest.value)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{interest.icon}</span>
              <span className="font-medium text-gray-900 dark:text-white">{interest.label}</span>
            </div>
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onComplete({ interests: selected })}
        disabled={selected.length === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
};

const TimeStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const options = [
    { value: 'low', label: 'Low (1-2 hours/week)', description: 'Minimal maintenance' },
    { value: 'medium', label: 'Medium (3-5 hours/week)', description: 'Regular care' },
    { value: 'high', label: 'High (6+ hours/week)', description: 'Intensive care' }
  ];

  return (
    <div className="space-y-3">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onComplete({ availableTime: option.value })}
          className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
        </button>
      ))}
    </div>
  );
};

const LocationStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [location, setLocation] = useState({
    climate: '',
    soilType: '',
    spaceAvailable: ''
  });

  const climates = ['tropical', 'subtropical', 'temperate', 'arid'];
  const soilTypes = ['clay', 'sandy', 'loamy', 'rocky'];
  const spaces = ['small', 'medium', 'large'];

  const isComplete = location.climate && location.soilType && location.spaceAvailable;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Climate</label>
        <select
          value={location.climate}
          onChange={(e) => setLocation(prev => ({ ...prev, climate: e.target.value }))}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select climate</option>
          {climates.map(climate => (
            <option key={climate} value={climate}>{climate.charAt(0).toUpperCase() + climate.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Soil Type</label>
        <select
          value={location.soilType}
          onChange={(e) => setLocation(prev => ({ ...prev, soilType: e.target.value }))}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select soil type</option>
          {soilTypes.map(soil => (
            <option key={soil} value={soil}>{soil.charAt(0).toUpperCase() + soil.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Space</label>
        <select
          value={location.spaceAvailable}
          onChange={(e) => setLocation(prev => ({ ...prev, spaceAvailable: e.target.value }))}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select space</option>
          {spaces.map(space => (
            <option key={space} value={space}>{space.charAt(0).toUpperCase() + space.slice(1)}</option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onComplete({ location })}
        disabled={!isComplete}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  );
};

const PreferencesStep: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [preferences, setPreferences] = useState({
    category: [] as string[],
    maintenance: '',
    growthRate: ''
  });

  const categories = ['fruit', 'shade', 'ornamental', 'medicinal', 'timber'];
  const maintenanceLevels = ['low', 'medium', 'high'];
  const growthRates = ['slow', 'medium', 'fast'];

  const toggleCategory = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const isComplete = preferences.category.length > 0 && preferences.maintenance && preferences.growthRate;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Categories</label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                preferences.category.includes(category)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Level</label>
        <select
          value={preferences.maintenance}
          onChange={(e) => setPreferences(prev => ({ ...prev, maintenance: e.target.value }))}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select maintenance level</option>
          {maintenanceLevels.map(level => (
            <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Growth Rate</label>
        <select
          value={preferences.growthRate}
          onChange={(e) => setPreferences(prev => ({ ...prev, growthRate: e.target.value }))}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select growth rate</option>
          {growthRates.map(rate => (
            <option key={rate} value={rate}>{rate.charAt(0).toUpperCase() + rate.slice(1)}</option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onComplete({ preferences })}
        disabled={!isComplete}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Get My Recommendations
      </button>
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard: React.FC<{
  recommendation: RecommendationResult;
  rank: number;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ recommendation, rank, onSelect, isSelected }) => {
  const { tree, score, reasons } = recommendation;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-3">
            #{rank}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tree.species}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">{tree.scientificName}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-500 mr-1" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{score}%</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {reasons.slice(0, 3).map((reason, index) => (
          <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
            {reason}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {tree.maintenanceLevel}
          </div>
          <div className="flex items-center">
            <Droplets className="w-3 h-3 mr-1" />
            {tree.waterRequirement}
          </div>
          <div className="flex items-center">
            <TreePine className="w-3 h-3 mr-1" />
            {tree.growthRate}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>
    </Card>
  );
};

// Detailed Recommendation View Component
const DetailedRecommendationView: React.FC<{
  recommendation: RecommendationResult;
  onClose: () => void;
}> = ({ recommendation, onClose }) => {
  const { tree, reasons, warnings, tips } = recommendation;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tree.species}</h2>
              <p className="text-gray-600 dark:text-gray-400 italic">{tree.scientificName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                  Why This Tree is Perfect for You
                </h3>
                <ul className="space-y-2">
                  {reasons.map((reason, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {warnings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                    Things to Consider
                  </h3>
                  <ul className="space-y-2">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Lightbulb className="w-5 h-5 text-blue-500 mr-2" />
                  Expert Tips
                </h3>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tree Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Category:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{tree.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Mature Height:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{tree.matureHeight}m</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Growth Rate:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{tree.growthRate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Water Needs:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{tree.waterRequirement}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Maintenance:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{tree.maintenanceLevel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Difficulty:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{tree.difficulty}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {tree.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Care Instructions</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {tree.careInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Select This Tree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartTreeRecommendation;
