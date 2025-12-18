import React from 'react';
import { 
  Building, 
  Users, 
  TreePine, 
  Target, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar
} from 'lucide-react';
import { CollegeData } from '../../types/dashboard';

interface CollegeRankingTableProps {
  colleges: CollegeData[];
  loading?: boolean;
}

const CollegeRankingTable: React.FC<CollegeRankingTableProps> = ({ colleges, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="w-5 h-5 text-yellow-500" />;
      case 'good':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'fair':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'fair':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building className="w-6 h-6 mr-2 text-blue-600" />
              College Performance Overview 
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Colleges ranked by tree planting participation rate
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {colleges.length} colleges
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank & College
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Principal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students & Resources
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {colleges.map((college) => (
              <tr key={college.id} className="hover:bg-gray-50 transition-colors duration-200">
                {/* Rank & College */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(college.rank)}`}>
                      {college.rank}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {college.name}
                      </div>
                      {college.established && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          Est. {college.established}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Principal */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {college.principalName}
                  </div>
                </td>

                {/* Location */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    <div>
                      <div>{college.districtName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{college.stateName || 'N/A'}</div>
                    </div>
                  </div>
                </td>

                {/* Students & Resources */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="w-4 h-4 mr-1 text-blue-500" />
                      {college.totalStudents.toLocaleString()} students
                    </div>
                    <div className="flex items-center text-sm text-blue-600">
                      <TreePine className="w-4 h-4 mr-1" />
                      {college.resourcesAssigned?.toLocaleString() || 0} resources
                    </div>
                    {college.missing > 0 && (
                      <div className="text-xs text-red-500">
                        {college.missing} pending
                      </div>
                    )}
                  </div>
                </td>

                {/* Participation */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">
                          {college.participationRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            college.participationRate >= 90 ? 'bg-yellow-500' :
                            college.participationRate >= 70 ? 'bg-blue-500' :
                            college.participationRate >= 50 ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(college.participationRate, 100)}%` }}
                        />
                      </div>
                    </div>
                    <Target className="w-4 h-4 text-gray-400" />
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(college.status)}`}>
                    {getStatusIcon(college.status)}
                    <span className="ml-1 capitalize">
                      {college.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {college.phone && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="w-3 h-3 mr-1" />
                        {college.phone}
                      </div>
                    )}
                    {college.email && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="w-3 h-3 mr-1" />
                        {college.email}
                      </div>
                    )}
                    {college.website && (
                      <div className="flex items-center text-xs text-blue-600">
                        <Globe className="w-3 h-3 mr-1" />
                        <a 
                          href={college.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {colleges.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No colleges found</p>
        </div>
      )}
    </div>
  );
};

export default CollegeRankingTable;
