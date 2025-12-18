import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Star,
  Clock,
  BookOpen,
  GraduationCap,
  Target,
  Award,
  ArrowRight,
  User,
  TrendingUp
} from 'lucide-react';
import Card from '../UI/Card';
import { FadeIn, ScaleIn, Stagger } from '../UI/Animations';

interface StudentProfile {
  experience: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  availableTime: 'low' | 'medium' | 'high';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  goals: string[];
  preferredDifficulty: 'easy' | 'moderate' | 'challenging';
}

interface CourseRecommendation {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  description: string;
  skills: string[];
  matchScore: number;
  reasons: string[];
  prerequisites?: string[];
  outcomes: string[];
}

const COURSE_DATABASE: CourseRecommendation[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    category: 'Technology',
    difficulty: 'Beginner',
    estimatedHours: 40,
    description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
    skills: ['HTML', 'CSS', 'JavaScript', 'Web Design'],
    matchScore: 0,
    reasons: [],
    outcomes: ['Build responsive websites', 'Understand web technologies', 'Create interactive web pages']
  },
  {
    id: '2',
    title: 'Data Science Fundamentals',
    category: 'Data Science',
    difficulty: 'Intermediate',
    estimatedHours: 60,
    description: 'Explore data analysis, visualization, and machine learning basics.',
    skills: ['Python', 'Data Analysis', 'Statistics', 'Machine Learning'],
    matchScore: 0,
    reasons: [],
    prerequisites: ['Basic Programming Knowledge'],
    outcomes: ['Analyze complex datasets', 'Create data visualizations', 'Build predictive models']
  },
  {
    id: '3',
    title: 'Digital Marketing Strategy',
    category: 'Marketing',
    difficulty: 'Beginner',
    estimatedHours: 30,
    description: 'Master digital marketing techniques and social media strategies.',
    skills: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
    matchScore: 0,
    reasons: [],
    outcomes: ['Develop marketing campaigns', 'Understand digital analytics', 'Create engaging content']
  },
  {
    id: '4',
    title: 'Advanced Project Management',
    category: 'Business',
    difficulty: 'Advanced',
    estimatedHours: 50,
    description: 'Learn advanced project management methodologies and leadership skills.',
    skills: ['Project Planning', 'Team Leadership', 'Risk Management', 'Agile Methodology'],
    matchScore: 0,
    reasons: [],
    prerequisites: ['Basic Project Management Experience'],
    outcomes: ['Lead complex projects', 'Manage diverse teams', 'Implement agile practices']
  }
];

const SmartCourseRecommendation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<StudentProfile>>({});
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CourseRecommendation | null>(null);
  const [showResults, setShowResults] = useState(false);

  const steps = [
    {
      title: 'Experience Level',
      description: 'What is your current learning experience level?',
      key: 'experience'
    },
    {
      title: 'Your Interests',
      description: 'What subjects interest you most?',
      key: 'interests'
    },
    {
      title: 'Available Time',
      description: 'How much time can you dedicate to learning?',
      key: 'availableTime'
    },
    {
      title: 'Learning Style',
      description: 'How do you prefer to learn?',
      key: 'learningStyle'
    },
    {
      title: 'Your Goals',
      description: 'What do you want to achieve?',
      key: 'goals'
    }
  ];

  const generateRecommendations = () => {
    const scoredCourses = COURSE_DATABASE.map(course => {
      let score = 0;
      const reasons: string[] = [];

      // Experience level matching
      if (profile.experience === 'beginner' && course.difficulty === 'Beginner') {
        score += 30;
        reasons.push('Perfect for beginners');
      } else if (profile.experience === 'intermediate' && course.difficulty === 'Intermediate') {
        score += 30;
        reasons.push('Matches your intermediate level');
      } else if (profile.experience === 'advanced' && course.difficulty === 'Advanced') {
        score += 30;
        reasons.push('Challenging content for advanced learners');
      }

      // Interest matching
      if (profile.interests?.includes(course.category.toLowerCase())) {
        score += 25;
        reasons.push(`Aligns with your interest in ${course.category}`);
      }

      // Time availability matching
      if (profile.availableTime === 'low' && course.estimatedHours <= 30) {
        score += 20;
        reasons.push('Fits your available time commitment');
      } else if (profile.availableTime === 'medium' && course.estimatedHours <= 50) {
        score += 20;
        reasons.push('Good time investment for your schedule');
      } else if (profile.availableTime === 'high') {
        score += 15;
        reasons.push('You have time for comprehensive learning');
      }

      // Learning style bonus
      if (profile.learningStyle === 'visual' && course.category === 'Technology') {
        score += 10;
        reasons.push('Visual learning opportunities');
      }

      // Goals matching
      if (profile.goals?.some(goal => course.outcomes.some(outcome => 
        outcome.toLowerCase().includes(goal.toLowerCase())))) {
        score += 15;
        reasons.push('Helps achieve your learning goals');
      }

      return {
        ...course,
        matchScore: Math.min(100, score),
        reasons
      };
    });

    const sortedRecommendations = scoredCourses
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    setRecommendations(sortedRecommendations);
    setShowResults(true);
  };

  const handleStepComplete = (stepData: any) => {
    setProfile(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendations();
    }
  };

  const resetRecommendation = () => {
    setCurrentStep(0);
    setProfile({});
    setRecommendations([]);
    setSelectedRecommendation(null);
    setShowResults(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeIn>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Your Personalized Course Recommendations</h1>
                  <p className="text-gray-600 mt-2">Based on your preferences and learning profile</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <Stagger>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {recommendations.map((course, index) => (
                <ScaleIn key={course.id} delay={index * 0.1}>
                  <Card className="h-full">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="text-2xl font-bold text-blue-600">{course.matchScore}%</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4">{course.description}</p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {course.estimatedHours} hours
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Target className="w-4 h-4 mr-2" />
                          {course.category}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Why this course?</h4>
                        <ul className="space-y-1">
                          {course.reasons.slice(0, 2).map((reason, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Skills you'll learn</h4>
                        <div className="flex flex-wrap gap-1">
                          {course.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedRecommendation(course)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </Card>
                </ScaleIn>
              ))}
            </div>
          </Stagger>

          <div className="text-center">
            <button
              onClick={resetRecommendation}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Course Recommendation</h1>
                <p className="text-gray-600 mt-2">Get personalized learning recommendations based on your profile</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>

            <p className="text-gray-600 mb-6">{steps[currentStep].description}</p>

            {/* Step content would be rendered here based on currentStep */}
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Interactive step content will be implemented here</p>
              <button
                onClick={() => handleStepComplete({})}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep < steps.length - 1 ? 'Next Step' : 'Get Recommendations'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SmartCourseRecommendation;
