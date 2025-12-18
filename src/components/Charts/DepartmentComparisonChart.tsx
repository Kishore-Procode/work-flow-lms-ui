import React from 'react';

interface DepartmentData {
  id?: string;
  name?: string;
  dept?: string;
  students: number;
  participated: number;
  percentage: number;
  availableTrees?: number;
  totalTrees?: number;
  code?: string;
}

interface DepartmentComparisonChartProps {
  data: DepartmentData[];
}

const DepartmentComparisonChart: React.FC<DepartmentComparisonChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Department-wise Comparison</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No department data available</p>
        </div>
      </div>
    );
  }

  // Find the maximum values for scaling
  const maxStudents = Math.max(...data.map(d => d.students));
  const maxParticipated = Math.max(...data.map(d => d.participated));
  const maxValue = Math.max(maxStudents, maxParticipated, 10);

  // Calculate nice scale increments for Y-axis (0, 20, 40, 60, 80, 100)
  const getScaleValues = (max: number) => {
    const roundedMax = Math.ceil(max / 10) * 10;
    const increment = roundedMax / 5;
    return Array.from({ length: 6 }, (_, i) => i * increment);
  };

  const scaleValues = getScaleValues(maxValue);
  const maxScale = scaleValues[scaleValues.length - 1];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Department-wise Comparison</h3>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-teal-400 rounded"></div>
            <span className="text-gray-700 font-medium">Total number of students</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-gray-700 font-medium">No. of students participated</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative pb-8">
        {/* Y-axis */}
        <div className="absolute left-0 top-0 h-72 flex flex-col justify-between text-sm text-gray-600 pr-4">
          {scaleValues.slice().reverse().map((value) => (
            <span key={value} className="font-medium">{value}</span>
          ))}
        </div>

        {/* Chart Area */}
        <div className="ml-12 relative">
          {/* Grid Lines */}
          <div className="absolute inset-0 h-72">
            {scaleValues.map((value) => (
              <div
                key={value}
                className="absolute w-full border-t border-gray-200"
                style={{ bottom: `${(value / maxScale) * 100}%` }}
              />
            ))}
          </div>

          {/* Bars Container */}
          <div className="relative h-72 mb-4">
            <div className="flex items-end justify-between h-full px-2">
              {data.map((dept, index) => {
                const studentHeight = Math.max((dept.students / maxScale) * 288, 2); // 288px = h-72
                const participatedHeight = Math.max((dept.participated / maxScale) * 288, 2);

                return (
                  <div key={index} className="flex items-end justify-center space-x-1 flex-1">
                    {/* Total students bar */}
                    <div className="relative group">
                      <div
                        className="w-8 bg-teal-400 hover:bg-teal-500 transition-colors duration-200 cursor-pointer"
                        style={{ height: `${studentHeight}px` }}
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Total: {dept.students}
                      </div>
                    </div>

                    {/* Participated students bar */}
                    <div className="relative group">
                      <div
                        className="w-8 bg-yellow-400 hover:bg-yellow-500 transition-colors duration-200 cursor-pointer"
                        style={{ height: `${participatedHeight}px` }}
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Participated: {dept.participated}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis Labels - Positioned outside chart area */}
          <div className="flex justify-between px-2 border-t border-gray-200 pt-3">
            {data.map((dept, index) => (
              <div
                key={index}
                className="flex-1 text-center hover:bg-gray-100 hover:cursor-pointer transition-colors duration-200 rounded"
                title={`${dept.name}`}
              >
                <span className="text-sm font-semibold text-gray-700">
                  {dept.code || `Dept ${index + 1}`}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DepartmentComparisonChart;
