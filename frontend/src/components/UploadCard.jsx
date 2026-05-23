import React, { useState, useRef } from 'react';
import { Upload, Link2, AlertCircle, PlayCircle } from 'lucide-react';

export default function UploadCard({ onImageSelected, onUrlSubmit, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const samples = [
    { name: "Normal Retina", file: "normal.jpg", desc: "Healthy fundus" },
    { name: "Diabetic Retinopathy", file: "diabetic_retinopathy.jpg", desc: "Exudates & hemorrhages" },
    { name: "Glaucoma", file: "glaucoma.jpg", desc: "Severe optic disc cupping" },
    { name: "Cataract", file: "cataract.jpg", desc: "Cloudy lens opacity" }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;
    
    // Check if file is image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }
    
    setError('');
    onImageSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    
    // Simple URL regex check
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?(.*?)$/;
    if (!urlPattern.test(imageUrl.trim())) {
      setError('Please enter a valid image URL.');
      return;
    }
    
    setError('');
    onUrlSubmit(imageUrl.trim());
  };

  const handleSampleClick = async (filename, displayName) => {
    if (isLoading) return;
    setError('');
    try {
      // Fetch the simulated retina image from the public folder
      const response = await fetch(`/samples/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      onImageSelected(file);
    } catch (err) {
      console.error(err);
      setError(`Failed to load sample image "${displayName}". Please upload a file manually.`);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="glass-panel glass-panel-hover w-full rounded-2xl p-6 sm:p-8 flex flex-col items-center transition-all duration-300 animate-slide-up">
      <h3 className="text-xl font-semibold text-white mb-2 self-start">Analyze Retina Fundus</h3>
      <p className="text-gray-400 text-sm mb-6 self-start">
        Upload a retina image, paste a URL, or try one of our pre-generated simulated scans.
      </p>

      {/* Drag and Drop Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full h-56 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
            : 'border-gray-700 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-800/20'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        
        <div className="p-3.5 bg-gray-800/80 rounded-full text-blue-400 mb-3">
          <Upload className="w-7 h-7" />
        </div>
        <p className="text-gray-200 font-medium text-center px-4 text-sm sm:text-base">
          Drag & drop your retina image here, or <span className="text-blue-400 hover:underline">browse</span>
        </p>
        <p className="text-gray-500 text-xs mt-1.5">
          Supports JPG, JPEG, PNG (ODIR fundus scan)
        </p>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleUrlSubmit} className="w-full mt-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Paste image URL (e.g. from Wikimedia)..." 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all duration-200"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !imageUrl.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Analyzing...' : 'Analyze URL'}
          </button>
        </div>
      </form>

      {/* Try a Sample Image Section */}
      <div className="w-full mt-6">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Try a Sample Retina Scan</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {samples.map((sample) => (
            <button
              key={sample.file}
              type="button"
              disabled={isLoading}
              onClick={() => handleSampleClick(sample.file, sample.name)}
              className="p-3 bg-gray-900/60 border border-gray-800 hover:border-gray-700/80 hover:bg-gray-800/10 rounded-xl text-left transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                  {sample.name.split(" ")[0]}
                </span>
                <PlayCircle className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
              </div>
              <span className="text-[10px] text-gray-500 block leading-tight font-medium">
                {sample.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg p-3 text-sm w-full animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
