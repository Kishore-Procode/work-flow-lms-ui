import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { XCircle, TreePine, MapPin, Calendar, Loader, AlertCircle, Package } from 'lucide-react';
import { ApiService } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

interface TreeSelfAssignmentModalProps {
  studentId: string;
  departmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TreeSelfAssignmentModal: React.FC<TreeSelfAssignmentModalProps> = ({
  studentId,
  departmentId,
  onClose,
  onSuccess
}) => {
  const [selectedTreeType, setSelectedTreeType] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [plantedDate, setPlantedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch available tree inventory for student's department
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['tree-inventory', departmentId],
    queryFn: () => ApiService.getTreeInventory({ 
      departmentId: departmentId,
      limit: 100 
    }),
    enabled: !!departmentId,
  });

  const availableTreeTypes = inventoryData?.data?.filter((inv: any) => inv.availableCount > 0) || [];

  // Self-assignment mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTreeType) {
        throw new Error('Please select a tree type');
      }

      return ApiService.createTreeAndAssignToStudent({
        studentId: studentId,
        treeData: {
          species: selectedTreeType,
          locationDescription: locationDescription.trim(),
          plantedDate: plantedDate,
          status: 'healthy'
        }
      });
    },
    onSuccess: () => {
      toast.success('Tree assigned successfully! You can now start monitoring your tree.');
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to assign tree';
      toast.error(errorMessage);
    }
  });

  const handleAssign = () => {
    assignMutation.mutate();
  };

  if (inventoryLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <LoadingSpinner size="lg" text="Loading available trees..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Your Tree</h2>
            <p className="text-sm text-gray-600 mt-1">Choose a tree type and provide planting details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={assignMutation.isPending}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Available Trees Info */}
        {availableTreeTypes.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {availableTreeTypes.slice(0, 3).map((inv: any) => (
                <div key={inv.id} className="bg-blue-50 rounded-lg p-4 text-center">
                  <TreePine className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">{inv.treeType}</p>
                  <p className="text-xs text-blue-600">{inv.availableCount} available</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Tree Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TreePine className="w-4 h-4 inline mr-1" />
                  Select Tree Type *
                </label>
                <select
                  value={selectedTreeType}
                  onChange={(e) => setSelectedTreeType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={assignMutation.isPending}
                >
                  <option value="">Choose a tree type...</option>
                  {availableTreeTypes.map((inv: any) => (
                    <option key={inv.id} value={inv.treeType}>
                      {inv.treeType} - {inv.availableCount} available
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select from the available tree types in your department's inventory
                </p>
              </div>

              {/* Selected Tree Info */}
              {selectedTreeType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Package className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Selected: {selectedTreeType}</p>
                      <p className="text-xs mt-1">
                        Available: {availableTreeTypes.find((inv: any) => inv.treeType === selectedTreeType)?.availableCount || 0} trees
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Planting Location
                </label>
                <textarea
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="e.g., Near main building, Behind library, Campus garden area A"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={assignMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe where you will plant or have planted your tree (optional)
                </p>
              </div>

              {/* Planted Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Planting Date
                </label>
                <input
                  type="date"
                  value={plantedDate}
                  onChange={(e) => setPlantedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={assignMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select the date when you planted or will plant the tree
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <TreePine className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">What happens next?</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                      <li>A unique tree code will be generated for your tree</li>
                      <li>The tree will be assigned to you</li>
                      <li>You can start uploading progress photos</li>
                      <li>Monitor your tree's growth over time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedTreeType}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Assigning Tree...
                  </>
                ) : (
                  <>
                    <TreePine className="w-5 h-5 mr-2" />
                    Assign Tree to Me
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={assignMutation.isPending}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* No Trees Available */
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trees Available</h3>
            <p className="text-gray-600 mb-6">
              There are currently no trees available in your department's inventory.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please contact your HOD or department staff to add trees to the inventory.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeSelfAssignmentModal;

