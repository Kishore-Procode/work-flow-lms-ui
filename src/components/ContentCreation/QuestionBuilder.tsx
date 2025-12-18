import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, CheckCircle, Circle } from 'lucide-react';

export interface Question {
  id?: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'long_answer';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
  orderIndex?: number;
}

interface QuestionBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  maxQuestions?: number;
}

export const QuestionBuilder: React.FC<QuestionBuilderProps> = ({
  questions,
  onChange,
  maxQuestions = 50
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  const addQuestion = () => {
    if (questions.length >= maxQuestions) {
      alert(`Maximum ${maxQuestions} questions allowed`);
      return;
    }

    const newQuestion: Question = {
      questionText: '',
      questionType: 'single_choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
      explanation: ''
    };

    onChange([...questions, newQuestion]);
    setExpandedQuestion(questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };

    // Handle question type changes
    if (updates.questionType) {
      if (updates.questionType === 'true_false') {
        updated[index].options = ['True', 'False'];
        updated[index].correctAnswer = 'True';
      } else if (updates.questionType === 'single_choice' || updates.questionType === 'multiple_choice') {
        if (!updated[index].options || updated[index].options!.length < 2) {
          updated[index].options = ['', ''];
        }
        updated[index].correctAnswer = updates.questionType === 'multiple_choice' ? [] : '';
      } else {
        // Short/long answer - no options needed
        updated[index].options = undefined;
        updated[index].correctAnswer = undefined;
      }
    }

    onChange(updated);
  };

  const deleteQuestion = (index: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updated = questions.filter((_, i) => i !== index);
      onChange(updated);
      if (expandedQuestion === index) {
        setExpandedQuestion(null);
      }
    }
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options && question.options.length >= 6) {
      alert('Maximum 6 options allowed');
      return;
    }

    updateQuestion(questionIndex, {
      options: [...(question.options || []), '']
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options && question.options.length <= 2) {
      alert('Minimum 2 options required');
      return;
    }

    const newOptions = question.options!.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: newOptions });
  };

  const toggleCorrectAnswer = (questionIndex: number, option: string) => {
    const question = questions[questionIndex];

    if (question.questionType === 'single_choice' || question.questionType === 'true_false') {
      updateQuestion(questionIndex, { correctAnswer: option });
    } else if (question.questionType === 'multiple_choice') {
      const currentAnswers = (question.correctAnswer as string[]) || [];
      const newAnswers = currentAnswers.includes(option)
        ? currentAnswers.filter(a => a !== option)
        : [...currentAnswers, option];
      updateQuestion(questionIndex, { correctAnswer: newAnswers });
    }
  };

  return (
    <div className="space-y-4">
      {questions.map((question, qIndex) => (
        <div
          key={qIndex}
          className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
        >
          {/* Question Header */}
          <div
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <GripVertical className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                Question {qIndex + 1}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({question.questionType.replace('_', ' ')}) • {question.points} {question.points === 1 ? 'point' : 'points'}
              </span>
              {question.questionText && (
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-md">
                  {question.questionText}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(qIndex);
              }}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Question Body */}
          {expandedQuestion === qIndex && (
            <div className="p-6 space-y-4">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={question.questionType}
                  onChange={(e) => updateQuestion(qIndex, { questionType: e.target.value as Question['questionType'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="single_choice">Single Choice (MCQ)</option>
                  <option value="multiple_choice">Multiple Choice (Multiple Correct)</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer (Manual Grading)</option>
                  <option value="long_answer">Long Answer (Manual Grading)</option>
                </select>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={question.questionText}
                  onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                  rows={3}
                  placeholder="Enter your question here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Options (for MCQ types) */}
              {(question.questionType === 'single_choice' || 
                question.questionType === 'multiple_choice' || 
                question.questionType === 'true_false') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options <span className="text-red-500">*</span>
                    {question.questionType === 'multiple_choice' && (
                      <span className="text-xs text-gray-500 ml-2">(Select all correct answers)</span>
                    )}
                  </label>
                  <div className="space-y-2">
                    {question.options?.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleCorrectAnswer(qIndex, option)}
                          className="flex-shrink-0"
                        >
                          {(question.questionType === 'single_choice' || question.questionType === 'true_false') ? (
                            question.correctAnswer === option ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )
                          ) : (
                            (question.correctAnswer as string[])?.includes(option) ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )
                          )}
                        </button>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          disabled={question.questionType === 'true_false'}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
                        />
                        {question.questionType !== 'true_false' && question.options!.length > 2 && (
                          <button
                            type="button"
                            onClick={() => deleteOption(qIndex, oIndex)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {question.questionType !== 'true_false' && (
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Points and Explanation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Points <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Explanation (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                  rows={2}
                  placeholder="Provide an explanation for the correct answer..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Question Button */}
      <button
        type="button"
        onClick={addQuestion}
        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>Add Question</span>
      </button>
    </div>
  );
};

