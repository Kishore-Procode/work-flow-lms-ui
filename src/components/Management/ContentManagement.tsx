import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, BookOpen, FileText, Video } from 'lucide-react';
import { ApiService } from '../../services/api';
import OptimizedDropdown from '../UI/OptimizedDropdown';
import { useGuidelines, useResources, useCreateGuideline, useUpdateGuideline, useDeleteGuideline, useCreateResource, useUpdateResource, useDeleteResource } from '../../hooks/api/useContent';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';

interface Guideline {
  id: string;
  title: string;
  description: string;
  icon: string;
  tips: string[];
  displayOrder: number;
  isActive: boolean;
}

interface Resource {
  id: string;
  category: string;
  title: string;
  description: string;
  type: string;
  size?: string;
  link: string;
  displayOrder: number;
  isActive: boolean;
}

const ContentManagement: React.FC = () => {
  // Pagination and filter states
  const [guidelineFilters, setGuidelineFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'displayOrder',
    sortOrder: 'asc' as 'asc' | 'desc',
    search: '',
    status: '',
  });

  const [resourceFilters, setResourceFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    search: '',
    type: '',
    category: '',
  });

  const [activeTab, setActiveTab] = useState<'guidelines' | 'resources'>('guidelines');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Guideline | Resource | null>(null);

  // React Query hooks
  const {
    data: guidelinesResponse,
    isLoading: guidelinesLoading,
    error: guidelinesError,
    refetch: refetchGuidelines
  } = useGuidelines(guidelineFilters);

  const {
    data: resourcesResponse,
    isLoading: resourcesLoading,
    error: resourcesError,
    refetch: refetchResources
  } = useResources(resourceFilters);

  // Mutations
  const createGuidelineMutation = useCreateGuideline();
  const updateGuidelineMutation = useUpdateGuideline();
  const deleteGuidelineMutation = useDeleteGuideline();
  const createResourceMutation = useCreateResource();
  const updateResourceMutation = useUpdateResource();
  const deleteResourceMutation = useDeleteResource();

  // Process data
  const guidelines = Array.isArray(guidelinesResponse) ? guidelinesResponse : guidelinesResponse?.data || [];
  const resources = Array.isArray(resourcesResponse) ? resourcesResponse : resourcesResponse?.data || [];

  const guidelinesPagination: PaginationInfo = guidelinesResponse?.pagination || {
    page: 1, limit: 25, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
  };

  const resourcesPagination: PaginationInfo = resourcesResponse?.pagination || {
    page: 1, limit: 25, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
  };

  const iconOptions = [
    { value: 'TreePine', label: '🌲 Tree Pine' },
    { value: 'MapPin', label: '📍 Map Pin' },
    { value: 'Droplets', label: '💧 Droplets' },
    { value: 'Camera', label: '📷 Camera' },
    { value: 'Sun', label: '☀️ Sun' },
    { value: 'AlertTriangle', label: '⚠️ Alert Triangle' },
    { value: 'BookOpen', label: '📖 Book Open' },
    { value: 'Video', label: '🎥 Video' },
    { value: 'FileText', label: '📄 File Text' },
    { value: 'Users', label: '👥 Users' }
  ];

  const resourceCategories = [
    { value: 'Educational Materials', label: 'Educational Materials' },
    { value: 'Video Tutorials', label: 'Video Tutorials' },
    { value: 'Tools & Supplies', label: 'Tools & Supplies' }
  ];

  const resourceTypes = [
    { value: 'PDF', label: 'PDF Document' },
    { value: 'Video', label: 'Video' },
    { value: 'Link', label: 'External Link' }
  ];

  // Pagination handlers
  const handleGuidelinePageChange = (page: number) => {
    setGuidelineFilters(prev => ({ ...prev, page }));
  };

  const handleGuidelineLimitChange = (limit: number) => {
    setGuidelineFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleResourcePageChange = (page: number) => {
    setResourceFilters(prev => ({ ...prev, page }));
  };

  const handleResourceLimitChange = (limit: number) => {
    setResourceFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // Filter handlers
  const handleGuidelineSearch = (search: string) => {
    setGuidelineFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleResourceSearch = (search: string) => {
    setResourceFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const GuidelineForm: React.FC<{ guideline?: Guideline; onSave: (data: any) => void; onCancel: () => void }> = ({
    guideline,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState({
      title: guideline?.title || '',
      description: guideline?.description || '',
      icon: guideline?.icon || '',
      tips: guideline?.tips || [''],
      displayOrder: guideline?.displayOrder || 0,
      isActive: guideline?.isActive ?? true
    });

    const addTip = () => {
      setFormData(prev => ({ ...prev, tips: [...prev.tips, ''] }));
    };

    const updateTip = (index: number, value: string) => {
      const newTips = [...formData.tips];
      newTips[index] = value;
      setFormData(prev => ({ ...prev, tips: newTips }));
    };

    const removeTip = (index: number) => {
      setFormData(prev => ({ ...prev, tips: prev.tips.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        tips: formData.tips.filter(tip => tip.trim() !== '')
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {guideline ? 'Edit Guideline' : 'Add New Guideline'}
            </h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon *
              </label>
              <OptimizedDropdown
                options={iconOptions}
                value={formData.icon}
                onChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                placeholder="Select an icon"
                required
                searchable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tips *
              </label>
              {formData.tips.map((tip, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tip}
                    onChange={(e) => updateTip(index, e.target.value)}
                    placeholder={`Tip ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {formData.tips.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTip(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTip}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Tip
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Guideline
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ResourceForm: React.FC<{ resource?: Resource; onSave: (data: any) => void; onCancel: () => void }> = ({
    resource,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState({
      category: resource?.category || '',
      title: resource?.title || '',
      description: resource?.description || '',
      type: resource?.type || '',
      size: resource?.size || '',
      link: resource?.link || '',
      displayOrder: resource?.displayOrder || 0,
      isActive: resource?.isActive ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      if (!formData.category.trim()) {
        alert('Category is required');
        return;
      }
      if (!formData.title.trim()) {
        alert('Title is required');
        return;
      }
      if (!formData.description.trim()) {
        alert('Description is required');
        return;
      }
      if (!formData.type.trim()) {
        alert('Type is required');
        return;
      }
      if (!formData.link.trim()) {
        alert('Link is required');
        return;
      }

      console.log('Form data being submitted:', formData);
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {resource ? 'Edit Resource' : 'Add New Resource'}
            </h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select Category</option>
                <option value="Educational Materials">Educational Materials</option>
                <option value="Video Tutorials">Video Tutorials</option>
                <option value="Tools & Supplies">Tools & Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="PDF">PDF Document</option>
                  <option value="Video">Video</option>
                  <option value="Link">External Link</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Size/Duration
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g., 2.5 MB or 10 min"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link/URL *
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://example.com/resource"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Resource
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const isLoading = guidelinesLoading || resourcesLoading;
  const hasError = guidelinesError || resourcesError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading content...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading content: {(guidelinesError || resourcesError)?.message}</p>
        <button
          onClick={() => {
            refetchGuidelines();
            refetchResources();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Content Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage guidelines and resources for students</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'guidelines'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Guidelines ({guidelines.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'resources'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Resources ({resources.length})
        </button>
      </div>

      {/* Add Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'guidelines' ? 'Guideline' : 'Resource'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'guidelines' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guidelines.map((guideline) => (
            <div key={guideline.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">{guideline.title}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingItem(guideline)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{guideline.description}</p>
              <div className="text-xs text-gray-500">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2">
                  Order: {guideline.displayOrder}
                </span>
                <span className={`px-2 py-1 rounded ${guideline.isActive ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                  {guideline.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(
            resources.reduce((acc, resource) => {
              if (!acc[resource.category]) acc[resource.category] = [];
              acc[resource.category].push(resource);
              return acc;
            }, {} as Record<string, Resource[]>)
          ).map(([category, categoryResources]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryResources.map((resource) => (
                  <div key={resource.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{resource.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingItem(resource)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{resource.type}</span>
                      {resource.size && <span className="text-gray-500">{resource.size}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {activeTab === 'guidelines' && guidelinesPagination.total > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
          <EnhancedPagination
            pagination={guidelinesPagination}
            onPageChange={handleGuidelinePageChange}
            onLimitChange={handleGuidelineLimitChange}
            disabled={guidelinesLoading}
          />
        </div>
      )}

      {activeTab === 'resources' && resourcesPagination.total > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
          <EnhancedPagination
            pagination={resourcesPagination}
            onPageChange={handleResourcePageChange}
            onLimitChange={handleResourceLimitChange}
            disabled={resourcesLoading}
          />
        </div>
      )}

      {/* Forms */}
      {showAddForm && activeTab === 'guidelines' && (
        <GuidelineForm
          onSave={async (data) => {
            try {
              const newGuideline = await ApiService.createGuideline(data);
              setGuidelines([...guidelines, newGuideline]);
              setShowAddForm(false);
            } catch (error) {
              console.error('Failed to create guideline:', error);
            }
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showAddForm && activeTab === 'resources' && (
        <ResourceForm
          onSave={async (data) => {
            try {
              console.log('Submitting resource data:', data);
              await createResourceMutation.mutateAsync(data);
              console.log('Resource created successfully');
              setShowAddForm(false);
            } catch (error: any) {
              console.error('Failed to create resource:', error);
              console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
              });
              // Show user-friendly error message
              alert(`Failed to create resource: ${error.response?.data?.message || error.message || 'Unknown error'}`);
            }
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingItem && 'tips' in editingItem && (
        <GuidelineForm
          guideline={editingItem as Guideline}
          onSave={async (data) => {
            try {
              const updatedGuideline = await ApiService.updateGuideline(editingItem.id, data);
              setGuidelines(guidelines.map(g => g.id === editingItem.id ? updatedGuideline : g));
              setEditingItem(null);
            } catch (error) {
              console.error('Failed to update guideline:', error);
            }
          }}
          onCancel={() => setEditingItem(null)}
        />
      )}

      {editingItem && !('tips' in editingItem) && (
        <ResourceForm
          resource={editingItem as Resource}
          onSave={async (data) => {
            try {
              await updateResourceMutation.mutateAsync({ id: editingItem.id, data });
              setEditingItem(null);
            } catch (error) {
              console.error('Failed to update resource:', error);
            }
          }}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default ContentManagement;
