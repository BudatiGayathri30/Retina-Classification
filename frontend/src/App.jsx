import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  Heart, 
  Info, 
  RefreshCw, 
  Sparkles, 
  BrainCircuit, 
  Database, 
  Trash2, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  Search, 
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import UploadCard from './components/UploadCard';
import ResultCard from './components/ResultCard';
import DiseaseInfo from './components/DiseaseInfo';

// Mapping of classification codes to index tabs in DiseaseInfo catalog
const CLASS_TO_TAB_INDEX = {
  'normal': 0,
  'diabetes': 1,
  'glaucoma': 2,
  'cataract': 3,
  'myopia': 4,
  'hypertension': 5,
  'ageDegeneration': 6,
  'others': 7
};

// Friendly disease labels corresponding to index
const TAB_INDEX_TO_NAME = [
  'Normal Retina',
  'Diabetic Retinopathy',
  'Glaucoma',
  'Cataract',
  'Myopia',
  'Hypertensive Retinopathy',
  'Age-related Degeneration (AMD)',
  'Other Retinal Anomalies'
];

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);

  // Encyclopedia selection state (synchronized with predictions)
  const [activeDiseaseTab, setActiveDiseaseTab] = useState(0);

  // SQLite Scan History Registry state
  const [scanRecords, setScanRecords] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbSearch, setDbSearch] = useState('');
  const [dbFilter, setDbFilter] = useState('ALL'); // 'ALL' or disease class name
  const [dbQualityFilter, setDbQualityFilter] = useState('ALL'); // 'ALL', 'CLEAR', 'WARNING'

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch scan records from backend SQLite database
  const fetchScanRecords = async () => {
    setIsDbLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/database`);
      if (response.ok) {
        const data = await response.json();
        setScanRecords(data);
      } else {
        console.error("Server returned error when fetching scan history.");
      }
    } catch (err) {
      console.error("Failed to fetch scan registry database:", err);
    } finally {
      setIsDbLoading(false);
    }
  };

  // Fetch scans on component mount
  useEffect(() => {
    fetchScanRecords();
  }, []);

  // Handle local image file selected via file-picker or drop-zone
  const handleImageSelected = async (file) => {
    setSelectedFile(file);
    setError(null);
    setPredictionResult(null);

    // Create a local object URL for previewing
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Trigger prediction
    await uploadAndPredict(file);
  };

  // Handle image URL submitted by user
  const handleUrlSubmit = async (url) => {
    setSelectedFile(null);
    setError(null);
    setPredictionResult(null);
    setPreviewUrl(url);

    // Trigger URL-based prediction
    await fetchUrlAndPredict(url);
  };

  // Upload file and call prediction API
  const uploadAndPredict = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      setPredictionResult(data);

      // Auto-update encyclopedia selection tab
      if (data && data.prediction_raw) {
        const tabIndex = CLASS_TO_TAB_INDEX[data.prediction_raw];
        if (tabIndex !== undefined) {
          setActiveDiseaseTab(tabIndex);
        }
      }

      // Refresh scan registry logs
      fetchScanRecords();
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message || "Failed to analyze image. Please verify backend is running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  // Request backend to download URL and analyze it
  const fetchUrlAndPredict = async (url) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/predict-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      setPredictionResult(data);

      // Auto-update encyclopedia selection tab
      if (data && data.prediction_raw) {
        const tabIndex = CLASS_TO_TAB_INDEX[data.prediction_raw];
        if (tabIndex !== undefined) {
          setActiveDiseaseTab(tabIndex);
        }
      }

      // Refresh scan registry logs
      fetchScanRecords();
    } catch (err) {
      console.error("URL Prediction error:", err);
      setError(err.message || "Failed to analyze URL. Please check network connectivity and backend status.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state to select another image
  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPredictionResult(null);
    setError(null);
    setIsLoading(false);
  };

  // Delete scan from the database
  const handleDeleteScan = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setScanRecords(prev => prev.filter(scan => scan.id !== id));
      } else {
        alert("Failed to delete record from the server.");
      }
    } catch (err) {
      console.error("Failed to delete scan record:", err);
    }
  };

  // Clear all scans from the database
  const handleClearDatabase = async () => {
    if (!window.confirm("Are you sure you want to clear all patient retinal scan history logs? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/clear`, {
        method: 'POST',
      });
      if (response.ok) {
        setScanRecords([]);
      } else {
        alert("Failed to clear database logs from the server.");
      }
    } catch (err) {
      console.error("Failed to clear scan records database:", err);
    }
  };

  // Helper: Format date string nicely
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Filter scan records based on search and filters
  const filteredRecords = scanRecords.filter(record => {
    // 1. Search Query
    const searchMatch = record.filename.toLowerCase().includes(dbSearch.toLowerCase()) ||
                        record.prediction.toLowerCase().includes(dbSearch.toLowerCase());
    
    // 2. Class Diagnosis Filter
    const classMatch = dbFilter === 'ALL' || record.prediction === dbFilter;

    // 3. Quality Filter
    let qualityMatch = true;
    if (dbQualityFilter === 'CLEAR') {
      qualityMatch = record.is_proper_fundus && !record.is_blurry;
    } else if (dbQualityFilter === 'WARNING') {
      qualityMatch = !record.is_proper_fundus || record.is_blurry;
    }

    return searchMatch && classMatch && qualityMatch;
  });

  // Calculate statistics from the database
  const totalScans = scanRecords.length;
  const abnormalScans = scanRecords.filter(r => r.prediction_raw !== 'normal').length;
  const flaggedScans = scanRecords.filter(r => !r.is_proper_fundus || r.is_blurry).length;

  return (
    <div className="relative min-h-screen bg-[#07080e] overflow-x-hidden flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Premium glowing background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '3s' }}></div>

      {/* Top Navbar */}
      <header className="w-full border-b border-gray-800/60 bg-[#07080e]/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleReset}>
            <div className="relative p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Eye className="w-5.5 h-5.5 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-xl filter blur-[1px] opacity-0 hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base sm:text-lg tracking-tight">OcuSight</span>
                <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] uppercase font-bold tracking-wider">AI Suite</span>
              </div>
              <span className="text-[10px] text-gray-500 block font-medium">Retinal Pathology Diagnostics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Local Model Active
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">
              <Database className="w-3.5 h-3.5" />
              SQLite Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full flex flex-col gap-8 relative z-10">
        
        {/* Page Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-4 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 px-3.5 py-1.5 rounded-full text-xs text-blue-400 font-semibold mb-4 tracking-wide uppercase">
            <BrainCircuit className="w-3.5 h-3.5" />
            ResNet-50 Deep Learning Model
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight leading-tight mb-4">
            Retinal Disease Classification
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Upload fundus photographs to instantaneously classify into 8 diagnostic classes (cataract, glaucoma, diabetic retinopathy, myopia, hypertension, AMD, or healthy).
          </p>
        </div>

        {/* Dashboard Grid / Workspace */}
        <div className="w-full flex flex-col gap-8">
          
          {/* Main workspace (Input / Output state) */}
          <div className="w-full max-w-3xl mx-auto">
            {isLoading ? (
              /* Loading Analysis Card */
              <div className="glass-panel w-full rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-pulse">
                <div className="relative w-16 h-16 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                  <Eye className="w-6 h-6 text-blue-400 absolute" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Analyzing Retinal Image...</h3>
                <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
                  Processing pixels through deep convolutional layers and evaluating feature maps...
                </p>
              </div>
            ) : error ? (
              /* Error Display State */
              <div className="glass-panel w-full rounded-2xl p-8 flex flex-col items-center justify-center text-center border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <div className="p-4 bg-red-500/10 rounded-full text-red-400 mb-4 border border-red-500/20">
                  <ShieldCheck className="w-8 h-8 rotate-180" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Inference Failed</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-md">{error}</p>
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            ) : predictionResult ? (
              /* Prediction Result Card */
              <ResultCard 
                result={predictionResult} 
                previewUrl={previewUrl} 
                onReset={handleReset} 
              />
            ) : (
              /* Upload / Input Card */
              <UploadCard 
                onImageSelected={handleImageSelected} 
                onUrlSubmit={handleUrlSubmit}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Persistent Scan History Registry Database (SQLite Logs Visualization) */}
          <div className="glass-panel w-full rounded-2xl p-6 sm:p-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Retinal Pathology Scan Registry</h3>
                  <p className="text-xs text-gray-400">Clinical patient records database stored locally in SQLite</p>
                </div>
              </div>
              
              {scanRecords.length > 0 && (
                <button
                  onClick={handleClearDatabase}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 rounded-xl flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Records
                </button>
              )}
            </div>

            {/* Statistics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900/30 border border-gray-800/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Total Scans Logged</span>
                  <span className="text-2xl font-bold text-blue-400">{totalScans}</span>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-gray-900/30 border border-gray-800/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Pathologies Detected</span>
                  <span className="text-2xl font-bold text-amber-500">{abnormalScans}</span>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-gray-900/30 border border-gray-800/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Quality Flag Warnings</span>
                  <span className="text-2xl font-bold text-red-500">{flaggedScans}</span>
                </div>
                <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search & Filter Controls */}
            {scanRecords.length > 0 && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search field */}
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by file name or diagnosis..."
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-900/60 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white placeholder-gray-500 text-xs outline-none transition-all"
                  />
                  {dbSearch && (
                    <button 
                      onClick={() => setDbSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                  {/* Diagnosis class filter */}
                  <div className="flex items-center gap-1.5 bg-gray-900/60 border border-gray-800 px-3 py-1.5 rounded-xl text-xs text-gray-300">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">Diagnosis:</span>
                    <select
                      value={dbFilter}
                      onChange={(e) => setDbFilter(e.target.value)}
                      className="bg-transparent text-white outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL" className="bg-gray-950 text-white">All Classes</option>
                      {TAB_INDEX_TO_NAME.map(name => (
                        <option key={name} value={name} className="bg-gray-950 text-white">{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quality Filter */}
                  <div className="flex items-center gap-1.5 bg-gray-900/60 border border-gray-800 px-3 py-1.5 rounded-xl text-xs text-gray-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">Quality:</span>
                    <select
                      value={dbQualityFilter}
                      onChange={(e) => setDbQualityFilter(e.target.value)}
                      className="bg-transparent text-white outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL" className="bg-gray-950 text-white">All Scans</option>
                      <option value="CLEAR" className="bg-gray-950 text-white">Clear Scans Only</option>
                      <option value="WARNING" className="bg-gray-950 text-white">Flagged Warnings Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Scans Data Table */}
            {isDbLoading && scanRecords.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-xs text-gray-400 ml-2">Loading registry database...</span>
              </div>
            ) : scanRecords.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
                <Database className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-300 font-medium text-sm">No Scan Logs Available</p>
                <p className="text-gray-500 text-xs mt-1 max-w-xs mx-auto">
                  Run a prediction above by uploading a retina fundus image. Scans will be logged into the database automatically.
                </p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800/60 rounded-xl">
                <Search className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">No records matches your active search or filter criteria.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto border border-gray-800/80 bg-gray-950/20 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800/80 bg-gray-900/30 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Scan Image Source</th>
                      <th className="px-4 py-3">Diagnosis Prediction</th>
                      <th className="px-4 py-3 text-center">Confidence</th>
                      <th className="px-4 py-3">Scan Quality Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/40 text-xs text-gray-300">
                    {filteredRecords.map((item) => {
                      const isNormal = item.prediction_raw === 'normal';
                      const hasWarning = !item.is_proper_fundus || item.is_blurry;
                      
                      // Diagnosis badge theme
                      const diagnosisBadgeClass = isNormal
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : item.prediction_raw === 'others'
                        ? 'bg-gray-800 text-gray-300 border border-gray-700'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                      // Quality status badge theme
                      let qualityBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <CheckCircle className="w-3 h-3" /> Clear Scan
                        </span>
                      );

                      if (!item.is_proper_fundus) {
                        qualityBadge = (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 font-medium cursor-help"
                            title={item.warning_message || "Incorrect / Non-fundus Scan profile"}
                          >
                            <AlertTriangle className="w-3 h-3 animate-pulse" /> Improper Scan
                          </span>
                        );
                      } else if (item.is_blurry) {
                        qualityBadge = (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium cursor-help"
                            title={item.warning_message || "Blurry / low definition scan"}
                          >
                            <AlertTriangle className="w-3 h-3" /> Blurry Scan
                          </span>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-gray-900/20 transition-colors">
                          {/* Timestamp */}
                          <td className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-600" />
                              {formatDate(item.created_at)}
                            </span>
                          </td>
                          
                          {/* Image source file name */}
                          <td className="px-4 py-3 font-semibold text-gray-200 max-w-[200px] truncate" title={item.filename}>
                            {item.filename}
                          </td>
                          
                          {/* Prediction badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${diagnosisBadgeClass}`}>
                              {item.prediction}
                            </span>
                          </td>
                          
                          {/* Confidence score */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold text-gray-200 text-[11px]">{(item.confidence * 100).toFixed(1)}%</span>
                              <div className="w-12 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${isNormal ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                  style={{ width: `${item.confidence * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Quality check */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {qualityBadge}
                            {item.warning_message && (
                              <span className="text-[10px] text-gray-500 block mt-0.5 max-w-[180px] truncate" title={item.warning_message}>
                                {item.warning_message}
                              </span>
                            )}
                          </td>
                          
                          {/* Delete action */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteScan(item.id)}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                              title="Delete log record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Disease Catalog Reference Section */}
          <div className="w-full">
            <DiseaseInfo activeTab={activeDiseaseTab} setActiveTab={setActiveDiseaseTab} />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800/40 bg-[#07080e]/90 py-6 mt-12 relative z-10 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>© 2026 OcuSight AI</span>
            <span>•</span>
            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-500/70" /> Built for Clinical Informatics Portfolio</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> PyTorch ResNet50 Classifier</span>
            <span>•</span>
            <span>Vite + React + Tailwind v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
