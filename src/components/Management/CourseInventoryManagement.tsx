import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Edit, 
  Trash2, 
  Eye,
  ChevronDown,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import EnhancedPagination from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import { AddInventoryModal, EditInventoryModal, InventoryDetailsModal } from './CourseInventoryModals';
import { queryKeys } from '../../lib/react-query';

// Interfaces
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

interface Filters {
  search?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

const CourseInventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    departmentId: '',
    page: 1,
    limit: 10
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    search: '',
    departmentId: '',
    page: 1,
    limit: 10
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<CourseInventory | null>(null);

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Apply filters with a slight delay to batch updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(filters);
    }, 100);
    return () => clearTimeout(timer);
  }, [filters]);

  // Auto-set department filter for HOD/Staff
  useEffect(() => {
    if ((user?.role === 'hod' || user?.role === 'staff') && user?.departmentId) {
      setFilters(prev => ({ ...prev, departmentId: user.departmentId }));
    }
  }, [user]);

  // Fetch course inventory
  const {
    data: inventoryResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['course-inventory', appliedFilters],
    queryFn: () => ApiService.getTreeInventory(appliedFilters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  const inventory = inventoryResponse?.data || [];
  const pagination = inventoryResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Fetch departments for filter dropdown
  const { data: departments = [] } = useQuery({
    queryKey: user?.collegeId
      ? queryKeys.departments.byCollege(user.collegeId)
      : queryKeys.departments.all,
    queryFn: () => {
      if (user?.role === 'admin') {
        return ApiService.getDepartments();
      } else if (user?.collegeId) {
        return ApiService.getDepartmentsByCollege(user.collegeId);
      }
      return [];
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'principal'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiService.deleteTreeInventory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-inventory'] });
      toast.success('Course inventory deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete course inventory');
    },
  });

  const handleDelete = (inventory: CourseInventory) => {
    if (inventory.assignedCount > 0) {
      toast.error('Cannot delete inventory with assigned courses');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${inventory.courseType} inventory?`)) {
      deleteMutation.mutate(inventory.id);
    }
  };

  const handleViewDetails = (inventory: CourseInventory) => {
    setSelectedInventory(inventory);
    setShowDetailsModal(true);
  };

  const handleEdit = (inventory: CourseInventory) => {
    setSelectedInventory(inventory);
    setShowEditModal(true);
  };

  if (isLoading && !inventory.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading course inventory..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Inventory</h2>
          <p className="text-gray-600 mb-4">Failed to load course inventory data.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['course-inventory'] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="mr-3 w-8 h-8 text-blue-600" />
                Course Catalog Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage course types and quantities for your department
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course Type
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Course Types</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {inventory.reduce((sum, item) => sum + item.totalCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {inventory.reduce((sum, item) => sum + item.availableCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {inventory.reduce((sum, item) => sum + item.assignedCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Course Types
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by course type or department..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {(user?.role === 'admin' || user?.role === 'principal') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <div className="relative">
                  <select
                    value={filters.departmentId}
                    onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <InventoryTable
          inventory={inventory}
          pagination={pagination}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          onLimitChange={(limit) => setFilters(prev => ({ ...prev, limit, page: 1 }))}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          userRole={user?.role || ''}
        />

        {/* Modals */}
        {showAddModal && (
          <AddInventoryModal
            onClose={() => setShowAddModal(false)}
            departments={departments}
            userRole={user?.role || ''}
            userDepartmentId={user?.departmentId}
            userCollegeId={user?.collegeId}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['course-inventory'] });
              setShowAddModal(false);
            }}
          />
        )}

        {showEditModal && selectedInventory && (
          <EditInventoryModal
            inventory={selectedInventory}
            onClose={() => {
              setShowEditModal(false);
              setSelectedInventory(null);
            }}
            departments={departments}
            userRole={user?.role || ''}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['course-inventory'] });
              setShowEditModal(false);
              setSelectedInventory(null);
            }}
          />
        )}

        {showDetailsModal && selectedInventory && (
          <InventoryDetailsModal
            inventory={selectedInventory}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedInventory(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Inventory Table Component
interface InventoryTableProps {
  inventory: CourseInventory[];
  pagination: any;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEdit: (inventory: CourseInventory) => void;
  onDelete: (inventory: CourseInventory) => void;
  onViewDetails: (inventory: CourseInventory) => void;
  userRole: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  pagination,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onViewDetails,
  userRole
}) => {
  if (!inventory.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Course Inventory Found</h3>
        <p className="text-gray-600">Start by adding course types to your inventory.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: {pagination.total} course types
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.courseType}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-500">{item.notes}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.departmentName}</div>
                  <div className="text-xs text-gray-500">{item.collegeName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.totalCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">{item.availableCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">{item.assignedCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails(item)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(userRole === 'admin' || userRole === 'principal' || userRole === 'hod') && (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                          disabled={item.assignedCount > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200">
        <EnhancedPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={onPageChange}
          onItemsPerPageChange={onLimitChange}
        />
      </div>
    </div>
  );
};

export default CourseInventoryManagement;
