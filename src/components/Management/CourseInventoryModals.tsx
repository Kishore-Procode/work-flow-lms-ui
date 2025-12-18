import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { XCircle, BookOpen, Users, Package, AlertCircle, Loader } from 'lucide-react';
import { ApiService } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

interface CourseInventory {
  id: string;
  courseType: string;
  totalCount: number;
  availableCount: number;
  assignedCount: number;
  departmentId: string;
  collegeId: string;
  departmentName?: string;
  collegeName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  collegeId: string;
}

// Add Inventory Modal
interface AddInventoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
  userRole: string;
  userDepartmentId?: string;
  userCollegeId?: string;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  onClose,
  onSuccess,
  departments,
  userRole,
  userDepartmentId,
  userCollegeId
}) => {
  const [formData, setFormData] = useState({
    courseType: '',
    totalCount: 0,
    departmentId: (userRole === 'hod' || userRole === 'staff') ? userDepartmentId || '' : '',
    collegeId: userCollegeId || '',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ApiService.createTreeInventory(data),
    onSuccess: () => {
      toast.success('Course inventory created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create course inventory');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courseType.trim()) {
      toast.error('Course type is required');
      return;
    }
    
    if (formData.totalCount <= 0) {
      toast.error('Total count must be greater than 0');
      return;
    }
    
    if (!formData.departmentId) {
      toast.error('Department is required');
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Add Course Type</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Type *
            </label>
            <input
              type="text"
              value={formData.courseType}
              onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Computer Science, Mathematics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Count *
            </label>
            <input
              type="number"
              min="1"
              value={formData.totalCount}
              onChange={(e) => setFormData({ ...formData, totalCount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {(userRole === 'admin' || userRole === 'principal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this course type..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {createMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course Type'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Inventory Modal
interface EditInventoryModalProps {
  inventory: CourseInventory;
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
  userRole: string;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  inventory,
  onClose,
  onSuccess,
  departments,
  userRole
}) => {
  const [formData, setFormData] = useState({
    courseType: inventory.courseType,
    totalCount: inventory.totalCount,
    departmentId: inventory.departmentId,
    notes: inventory.notes || ''
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => ApiService.updateTreeInventory(inventory.id, data),
    onSuccess: () => {
      toast.success('Course inventory updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update course inventory');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courseType.trim()) {
      toast.error('Course type is required');
      return;
    }
    
    if (formData.totalCount <= 0) {
      toast.error('Total count must be greater than 0');
      return;
    }
    
    if (formData.totalCount < inventory.assignedCount) {
      toast.error(`Total count cannot be less than assigned count (${inventory.assignedCount})`);
      return;
    }

    updateMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Course Type</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Type *
            </label>
            <input
              type="text"
              value={formData.courseType}
              onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Computer Science, Mathematics"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Count *
            </label>
            <input
              type="number"
              min={inventory.assignedCount}
              value={formData.totalCount}
              onChange={(e) => setFormData({ ...formData, totalCount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {inventory.assignedCount} (currently assigned)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this course type..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Course Type'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inventory Details Modal
interface InventoryDetailsModalProps {
  inventory: CourseInventory;
  onClose: () => void;
}

export const InventoryDetailsModal: React.FC<InventoryDetailsModalProps> = ({
  inventory,
  onClose
}) => {
  const { data: assignedCourses, isLoading } = useQuery({
    queryKey: ['assigned-courses', inventory.courseType, inventory.departmentId],
    queryFn: () => ApiService.getAssignedTreesByType({
      treeType: inventory.courseType,
      departmentId: inventory.departmentId
    }),
    enabled: inventory.assignedCount > 0
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Course Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{inventory.courseType}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{inventory.departmentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">College</p>
                <p className="font-medium">{inventory.collegeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Count</p>
                <p className="font-medium">{inventory.totalCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="font-medium text-blue-600">{inventory.availableCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="font-medium text-blue-600">{inventory.assignedCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">{new Date(inventory.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {inventory.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-medium">{inventory.notes}</p>
              </div>
            )}
          </div>

          {/* Assigned Courses */}
          {inventory.assignedCount > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Assigned Courses ({inventory.assignedCount})
              </h4>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" text="Loading assigned courses..." />
                </div>
              ) : assignedCourses && assignedCourses.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {assignedCourses.map((course: any) => (
                    <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{course.studentName}</p>
                          <p className="text-sm text-gray-600">{course.studentEmail}</p>
                          <p className="text-xs text-gray-500">Roll: {course.studentRollNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            course.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            course.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned: {new Date(course.assignmentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No assigned course details available</p>
                </div>
              )}
            </div>
          )}

          {inventory.assignedCount === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No Courses Assigned</p>
              <p>All courses of this type are available for assignment.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
