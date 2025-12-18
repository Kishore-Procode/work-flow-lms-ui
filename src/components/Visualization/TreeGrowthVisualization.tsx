import React, { useState, useEffect, useRef } from 'react';
import { 
  TreePine, 
  TrendingUp, 
  Calendar, 
  Ruler, 
  Droplets, 
  Sun, 
  Thermometer,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  Settings
} from 'lucide-react';

interface TreeGrowthData {
  date: string;
  height: number;
  diameter: number;
  leafCount: number;
  healthScore: number;
  imageUrl?: string;
  notes?: string;
  weather?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
}

interface TreeGrowthVisualizationProps {
  treeId: string;
  data: TreeGrowthData[];
  className?: string;
}

const TreeGrowthVisualization: React.FC<TreeGrowthVisualizationProps> = ({
  treeId,
  data,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // milliseconds
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showDetails, setShowDetails] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % data.length);
      }, playSpeed);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, playSpeed, data.length]);

  useEffect(() => {
    drawTree();
  }, [currentIndex, zoomLevel, viewMode]);

  const drawTree = () => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentData = data[currentIndex];
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Set up coordinate system
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight - 50);
    ctx.scale(zoomLevel, zoomLevel);

    if (viewMode === '2d') {
      draw2DTree(ctx, currentData);
    } else {
      draw3DTree(ctx, currentData);
    }

    ctx.restore();
  };

  const draw2DTree = (ctx: CanvasRenderingContext2D, treeData: TreeGrowthData) => {
    const { height, diameter, leafCount, healthScore } = treeData;
    
    // Calculate tree dimensions
    const trunkHeight = height * 0.6;
    const crownHeight = height * 0.4;
    const trunkWidth = Math.max(diameter, 5);
    const crownWidth = Math.max(diameter * 2, 30);

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-100, 0, 200, 10);

    // Draw trunk
    const trunkGradient = ctx.createLinearGradient(-trunkWidth/2, 0, trunkWidth/2, 0);
    trunkGradient.addColorStop(0, '#654321');
    trunkGradient.addColorStop(0.5, '#8B4513');
    trunkGradient.addColorStop(1, '#654321');
    
    ctx.fillStyle = trunkGradient;
    ctx.fillRect(-trunkWidth/2, -trunkHeight, trunkWidth, trunkHeight);

    // Draw trunk texture
    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = 1;
    for (let i = 0; i < trunkHeight; i += 10) {
      ctx.beginPath();
      ctx.moveTo(-trunkWidth/2, -i);
      ctx.lineTo(trunkWidth/2, -i);
      ctx.stroke();
    }

    // Draw crown (leaves)
    const leafColor = getLeafColor(healthScore);
    const crownGradient = ctx.createRadialGradient(0, -trunkHeight - crownHeight/2, 0, 0, -trunkHeight - crownHeight/2, crownWidth/2);
    crownGradient.addColorStop(0, leafColor);
    crownGradient.addColorStop(1, darkenColor(leafColor, 0.3));

    ctx.fillStyle = crownGradient;
    ctx.beginPath();
    ctx.ellipse(0, -trunkHeight - crownHeight/2, crownWidth/2, crownHeight/2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw individual leaves for detail
    if (zoomLevel > 1.5) {
      drawDetailedLeaves(ctx, crownWidth, crownHeight, trunkHeight, leafCount, leafColor);
    }

    // Draw branches
    drawBranches(ctx, trunkWidth, trunkHeight, crownWidth);

    // Draw fruits/flowers if tree is mature
    if (height > 100) {
      drawFruits(ctx, crownWidth, crownHeight, trunkHeight);
    }
  };

  const draw3DTree = (ctx: CanvasRenderingContext2D, treeData: TreeGrowthData) => {
    const { height, diameter, leafCount, healthScore } = treeData;
    
    // 3D perspective calculations
    const perspective = 0.8;
    const trunkHeight = height * 0.6;
    const crownHeight = height * 0.4;
    const trunkWidth = Math.max(diameter, 5);
    const crownWidth = Math.max(diameter * 2, 30);

    // Draw 3D trunk
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(-trunkWidth/2, 0);
    ctx.lineTo(-trunkWidth/2 * perspective, -trunkHeight);
    ctx.lineTo(trunkWidth/2 * perspective, -trunkHeight);
    ctx.lineTo(trunkWidth/2, 0);
    ctx.closePath();
    ctx.fill();

    // Draw 3D crown
    const leafColor = getLeafColor(healthScore);
    ctx.fillStyle = leafColor;
    
    // Front face of crown
    ctx.beginPath();
    ctx.ellipse(0, -trunkHeight - crownHeight/2, crownWidth/2, crownHeight/2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Back face of crown (darker)
    ctx.fillStyle = darkenColor(leafColor, 0.4);
    ctx.beginPath();
    ctx.ellipse(-crownWidth * 0.1, -trunkHeight - crownHeight/2 - crownHeight * 0.1, 
                crownWidth/2 * perspective, crownHeight/2 * perspective, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawBranches = (ctx: CanvasRenderingContext2D, trunkWidth: number, trunkHeight: number, crownWidth: number) => {
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;

    const branchCount = Math.min(8, Math.floor(trunkHeight / 20));
    for (let i = 0; i < branchCount; i++) {
      const y = -trunkHeight * (0.3 + (i / branchCount) * 0.7);
      const angle = (i * Math.PI * 2) / branchCount;
      const branchLength = crownWidth * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(Math.cos(angle) * branchLength, y + Math.sin(angle) * branchLength * 0.3);
      ctx.stroke();
    }
  };

  const drawDetailedLeaves = (ctx: CanvasRenderingContext2D, crownWidth: number, crownHeight: number, trunkHeight: number, leafCount: number, leafColor: string) => {
    ctx.fillStyle = leafColor;
    const leaves = Math.min(leafCount, 50); // Limit for performance
    
    for (let i = 0; i < leaves; i++) {
      const angle = (i / leaves) * Math.PI * 2;
      const radius = (Math.random() * crownWidth) / 2;
      const x = Math.cos(angle) * radius;
      const y = -trunkHeight - crownHeight/2 + Math.sin(angle) * (crownHeight/2);
      
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 6, angle, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawFruits = (ctx: CanvasRenderingContext2D, crownWidth: number, crownHeight: number, trunkHeight: number) => {
    ctx.fillStyle = '#FF6B6B';
    const fruitCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < fruitCount; i++) {
      const angle = (i / fruitCount) * Math.PI * 2;
      const radius = (Math.random() * crownWidth * 0.8) / 2;
      const x = Math.cos(angle) * radius;
      const y = -trunkHeight - crownHeight/2 + Math.sin(angle) * (crownHeight/2);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const getLeafColor = (healthScore: number): string => {
    if (healthScore >= 80) return '#228B22'; // Forest blue
    if (healthScore >= 60) return '#32CD32'; // Lime blue
    if (healthScore >= 40) return '#ADFF2F'; // blue Yellow
    return '#DAA520'; // Goldenrod (unhealthy)
  };

  const darkenColor = (color: string, factor: number): string => {
    // Simple color darkening function
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  const exportVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `tree-growth-${treeId}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No growth data available</p>
        </div>
      </div>
    );
  }

  const currentData = data[currentIndex];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TreePine className="w-5 h-5 mr-2 text-blue-600" />
              Tree Growth Visualization
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date(currentData.date).toLocaleDateString()} • 
              Day {currentIndex + 1} of {data.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {viewMode.toUpperCase()}
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visualization Canvas */}
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-b from-sky-200 to-blue-100 dark:from-sky-900 dark:to-blue-900 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full h-auto"
              />
              
              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={exportVisualization}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-lg"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / data.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="mt-4">
              <input
                type="range"
                min="0"
                max={data.length - 1}
                value={currentIndex}
                onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{new Date(data[0].date).toLocaleDateString()}</span>
                <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          {showDetails && (
            <div className="space-y-4">
              {/* Current Stats */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Measurements</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Ruler className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Height</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{currentData.height}cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TreePine className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Diameter</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{currentData.diameter}cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Health Score</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{currentData.healthScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Weather Data */}
              {currentData.weather && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Weather Conditions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Thermometer className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{currentData.weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Droplets className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Humidity</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{currentData.weather.humidity}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Sun className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rainfall</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{currentData.weather.rainfall}mm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Chart */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Growth Trend</h4>
                <div className="h-32 flex items-end justify-between space-x-1">
                  {data.slice(Math.max(0, currentIndex - 9), currentIndex + 1).map((item, index) => (
                    <div
                      key={index}
                      className="bg-blue-600 rounded-t-sm flex-1 transition-all duration-300"
                      style={{ height: `${(item.height / Math.max(...data.map(d => d.height))) * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Speed Control */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Animation Speed</h4>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Fast</span>
                  <span>Slow</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeGrowthVisualization;
