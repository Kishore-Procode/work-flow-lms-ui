import React, { useState, useEffect } from 'react';
import {
  TreePine,
  MapPin,
  Calendar,
  CheckCircle,
  Search,
  Filter,
  Heart,
  Leaf,
  Info
} from 'lucide-react';

import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';

interface Tree {
  id: string;
  treeCode: string;
  species: string;
  plantedDate: string;
  locationDescription: string;
  status: string;
  assignedStudentId?: string;
  assignedDate?: string;
  notes?: string;
  collegeId: string;
  departmentId: string;
}

interface StudentTreeSelection {
  id: string;
  treeId: string;
  studentId: string;
  assignedDate: string;
  status: string;
  tree: Tree;
}

const TreeSelection: React.FC = () => {
  const toast = useToast();
  const [availableTrees, setAvailableTrees] = useState<Tree[]>([]);
  const [myTreeSelection, setMyTreeSelection] = useState<StudentTreeSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [showTreeDetails, setShowTreeDetails] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // First check if student already has a tree assigned
      const mySelectionData = await ApiService.getMyTreeSelection().catch(() => null);

      // Convert the selection data to the expected format
      if (mySelectionData && mySelectionData.tree_id) {
        // Create a mock selection object with the expected structure
        setMyTreeSelection({
          id: mySelectionData.id || 'selection-1',
          treeId: mySelectionData.tree_id,
          studentId: mySelectionData.student_id,
          assignedDate: mySelectionData.assigned_date || new Date().toISOString(),
          status: mySelectionData.status || 'assigned',
          tree: {
            id: mySelectionData.tree_id,
            treeCode: mySelectionData.tree_code,
            species: mySelectionData.species || 'Unknown',
            plantedDate: mySelectionData.planted_date || new Date().toISOString(),
            locationDescription: mySelectionData.location_description || 'Campus',
            status: mySelectionData.status || 'assigned',
            collegeId: mySelectionData.college_id || '',
            departmentId: mySelectionData.department_id || ''
          }
        });
        // Don't load available trees if student already has one assigned
        setAvailableTrees([]);
      } else {
        // Only load available trees if student doesn't have one assigned
        const availableTreesData = await ApiService.getAvailableTrees();
        setAvailableTrees(availableTreesData || []);
        setMyTreeSelection(null);
      }
    } catch (error) {
      console.error('Failed to load tree data:', error);
      toast.error('Failed to load tree data', 'Please try refreshing the page');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTree = async (treeId: string) => {
    try {
      const selection = await ApiService.selectTree(treeId);
      setMyTreeSelection(selection);
      // Remove the selected tree from available trees
      setAvailableTrees(prev => prev.filter(t => t.id !== treeId));
      // Reload data to get the latest state
      await loadData();
      toast.success('Tree selected successfully!', 'You can now start monitoring your tree.');
    } catch (error: any) {
      console.error('Failed to select tree:', error);
      const errorMessage = error.response?.data?.message || 'Failed to select tree. Please try again.';
      if (errorMessage.includes('already selected')) {
        toast.warning('Tree already selected', 'You have already selected a tree. This page will refresh to show your current tree.');
        // Reload data to show existing selection
        await loadData();
      } else {
        toast.error('Failed to select tree', errorMessage);
      }
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!myTreeSelection || !myTreeSelection.tree) return;

    setUploadingImage(true);
    try {
      await ApiService.uploadTreeImage(myTreeSelection.tree.id, file, 'progress', 'Progress update');
      toast.success('Image uploaded successfully!', 'Your tree progress has been updated.');
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image', 'Please check your file and try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getSpeciesList = () => {
    const species = [...new Set(availableTrees.map(t => t.species))];
    return species.sort();
  };

  const filteredTrees = availableTrees.filter(tree => {
    const matchesSearch = tree.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tree.locationDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tree.treeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = speciesFilter === 'all' || tree.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });

  const getTreeIcon = (species: string) => {
    const iconMap: { [key: string]: string } = {
      'Neem': '🌿',
      'Banyan': '🌳',
      'Peepal': '🍃',
      'Mango': '🥭',
      'Coconut': '🥥',
      'Teak': '🌲',
      'Mahogany': '🪵',
      'Gulmohar': '🌺',
      'Tamarind': '🌰',
      'Jackfruit': '🍈'
    };
    return iconMap[species] || '🌱';
  };

  const getSpeciesInfo = (species: string) => {
    const infoMap: { [key: string]: { benefits: string[], care: string[] } } = {
      'Neem': {
        benefits: ['Natural pesticide', 'Medicinal properties', 'Air purification'],
        care: ['Moderate watering', 'Full sunlight', 'Well-drained soil']
      },
      'Banyan': {
        benefits: ['Oxygen production', 'Shade provider', 'Wildlife habitat'],
        care: ['Regular watering', 'Partial to full sun', 'Rich soil']
      },
      'Mango': {
        benefits: ['Fruit production', 'Carbon absorption', 'Soil conservation'],
        care: ['Deep watering', 'Full sunlight', 'Fertile soil']
      }
    };
    return infoMap[species] || { benefits: ['Environmental benefits'], care: ['Regular care needed'] };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pt-2 lg:pt-0 pb-16 lg:pb-6">
      <div className="p-3 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <TreePine className="mr-2 lg:mr-3 w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
              <span className="lg:hidden">Tree Selection</span>
              <span className="hidden lg:inline">Tree Selection</span>
            </h1>
            <p className="text-gray-600 text-sm lg:text-base mt-1 lg:mt-2">
              Choose a tree to monitor and care for throughout your academic journey
            </p>
          </div>
          
          {myTreeSelection && myTreeSelection.tree && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 lg:p-4">
              <div className="flex items-center text-blue-800">
                <CheckCircle className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
                <span className="font-medium text-sm lg:text-base">You have selected a tree!</span>
              </div>
              <p className="text-blue-700 text-xs lg:text-sm mt-1">
                {myTreeSelection.tree.species || 'Unknown Species'} - {myTreeSelection.tree.treeCode || 'No Code'}
              </p>
            </div>
          )}
        </div>

        {/* My Tree Section */}
        {myTreeSelection && myTreeSelection.tree && (
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <Heart className="w-4 lg:w-5 h-4 lg:h-5 mr-2 text-red-500" />
              My Tree
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center">
                  <span className="text-xl lg:text-2xl mr-3">{getTreeIcon(myTreeSelection.tree.species || 'Unknown')}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{myTreeSelection.tree.species || 'Unknown Species'}</h3>
                    <p className="text-gray-600 text-xs lg:text-sm">{myTreeSelection.tree.treeCode || 'No Code'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-3 lg:w-4 h-3 lg:h-4 mr-2 flex-shrink-0" />
                    <span className="text-xs lg:text-sm">{myTreeSelection.tree.locationDescription || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-3 lg:w-4 h-3 lg:h-4 mr-2 flex-shrink-0" />
                    <span className="text-xs lg:text-sm">
                      Assigned: {new Date(myTreeSelection.assignedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm lg:text-base">Care Instructions:</h4>
                <div className="space-y-2">
                  {getSpeciesInfo(myTreeSelection.tree.species || 'Unknown').care.map((instruction, index) => (
                    <div key={index} className="flex items-center text-xs lg:text-sm text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                      {instruction}
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col lg:flex-row gap-2 mt-4">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                  >
                    Upload Progress Photo
                  </button>
                  <button
                    onClick={() => toast.info('Coming Soon', 'Progress tracking feature is under development!')}
                    className="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                  >
                    View Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Trees Section */}
        {!myTreeSelection && (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 lg:w-5 h-4 lg:h-5" />
                  <input
                    type="text"
                    placeholder="Search by species, location, or tree code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 lg:w-5 h-4 lg:h-5" />
                  <select
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    className="pl-9 lg:pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm lg:text-base"
                  >
                    <option value="all">All Species</option>
                    {getSpeciesList().map(species => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Trees Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredTrees.map(tree => (
                <div key={tree.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl lg:text-3xl mr-3">{getTreeIcon(tree.species)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{tree.species}</h3>
                          <p className="text-gray-500 text-xs lg:text-sm">{tree.treeCode}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTreeDetails(showTreeDetails === tree.id ? null : tree.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Info className="w-4 lg:w-5 h-4 lg:h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-xs lg:text-sm">
                        <MapPin className="w-3 lg:w-4 h-3 lg:h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{tree.locationDescription}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-xs lg:text-sm">
                        <Calendar className="w-3 lg:w-4 h-3 lg:h-4 mr-2 flex-shrink-0" />
                        Planted: {new Date(tree.plantedDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {showTreeDetails === tree.id && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">Benefits:</h4>
                        <ul className="text-xs lg:text-sm text-gray-700 space-y-1">
                          {getSpeciesInfo(tree.species).benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center">
                              <Leaf className="w-3 h-3 mr-2 text-blue-500 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {!myTreeSelection ? (
                      <button
                        onClick={() => handleSelectTree(tree.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm lg:text-base"
                      >
                        Select This Tree
                      </button>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-center font-medium text-sm lg:text-base">
                        You already have a tree selected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredTrees.length === 0 && (
              <div className="text-center py-8 lg:py-12">
                <TreePine className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No trees available</h3>
                <p className="text-gray-500 text-sm lg:text-base">
                  {searchTerm || speciesFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'All trees have been assigned. Please check back later.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Upload Progress Photo</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadImage(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploadingImage}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {uploadingImage && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 lg:h-6 w-5 lg:w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-xs lg:text-sm text-gray-600">Uploading...</span>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TreeSelection;
