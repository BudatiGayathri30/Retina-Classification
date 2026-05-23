import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, ChevronDown, ChevronUp, Sparkles, Info } from 'lucide-react';

export default function ResultCard({ result, previewUrl, onReset }) {
  const [showAllProbs, setShowAllProbs] = useState(false);
  const { prediction, confidence, top3, all_predictions, prediction_raw, quality_check } = result;

  // Format confidence to percentage
  const confidencePercent = (confidence * 100).toFixed(1);

  // Set color styling based on prediction class
  const getThemeByClass = (rawClass) => {
    switch (rawClass) {
      case 'normal':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          text: 'text-emerald-400',
          icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
          accent: 'from-emerald-500 to-teal-400',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
        };
      case 'others':
        return {
          bg: 'bg-gray-500/10 border-gray-500/30',
          text: 'text-gray-300',
          icon: <AlertTriangle className="w-6 h-6 text-gray-300" />,
          accent: 'from-gray-500 to-slate-400',
          shadow: 'shadow-[0_0_15px_rgba(156,163,175,0.15)]'
        };
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          icon: <ShieldAlert className="w-6 h-6 text-amber-400" />,
          accent: 'from-amber-500 to-orange-400',
          shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
        };
    }
  };

  const getSuggestionsByClass = (rawClass) => {
    switch (rawClass) {
      case 'normal':
        return {
          title: "Routine Care Recommended",
          items: [
            "Encourage regular comprehensive eye exams every 1-2 years.",
            "Maintain general cardiovascular health and balanced nutrition.",
            "Wear UV-protective sunglasses during outdoor activities."
          ]
        };
      case 'diabetes':
        return {
          title: "Immediate Clinical Actions",
          items: [
            "Refer to an endocrinologist for strict glycemic, blood pressure, and lipid control.",
            "Schedule a dilated ophthalmoscopic eye exam within 3 months.",
            "Recommend patient education on diabetes-related vision loss risks."
          ]
        };
      case 'glaucoma':
        return {
          title: "Urgent Glaucoma Management",
          items: [
            "Refer to a glaucoma specialist for intraocular pressure (IOP) measurement.",
            "Conduct visual field (perimetry) testing and optical coherence tomography (OCT).",
            "Discuss initiation of pressure-lowering therapeutic eye drops if confirmed."
          ]
        };
      case 'cataract':
        return {
          title: "Ophthalmic Surgery Consultation",
          items: [
            "Refer to an ophthalmologist to evaluate visual acuity degradation.",
            "Assess impact on daily activities (driving, reading, glare at night).",
            "Discuss outpatient phacoemulsification surgery with intraocular lens (IOL) implant."
          ]
        };
      case 'myopia':
        return {
          title: "High Myopia Monitoring",
          items: [
            "Perform peripheral retinal examination to screen for lattice degeneration or tears.",
            "Educate patient on warning signs of retinal detachment (sudden flashes, floaters).",
            "Prescribe appropriate corrective lenses and monitor changes annually."
          ]
        };
      case 'hypertension':
        return {
          title: "Cardiovascular Health Management",
          items: [
            "Refer to primary care physician for blood pressure optimization.",
            "Monitor patient for hypertensive target organ damage.",
            "Advise low-sodium diet, regular exercise, and smoking cessation."
          ]
        };
      case 'ageDegeneration':
        return {
          title: "Macular Degeneration Care",
          items: [
            "Refer to retina specialist for optical coherence tomography (OCT) and Amsler grid self-tests.",
            "Recommend high-dose antioxidant vitamins (AREDS-2 formulation) if appropriate.",
            "Evaluate for wet AMD conversion (sudden vision distortions) which requires anti-VEGF therapy."
          ]
        };
      default:
        return {
          title: "Specialist Evaluation Required",
          items: [
            "Refer to a general ophthalmologist for comprehensive diagnostic evaluation.",
            "Take repeat high-resolution fundus photographs or OCT scans.",
            "Review medical history for systemic comorbidities and inflammatory conditions."
          ]
        };
    }
  };

  const theme = getThemeByClass(prediction_raw);
  const suggestions = getSuggestionsByClass(prediction_raw);
  
  const isLowConfidence = confidence < 0.60;
  const isImproper = quality_check && !quality_check.is_proper_fundus;
  const isBlurry = quality_check && quality_check.is_blurry;

  return (
    <div className="glass-panel w-full rounded-2xl p-6 sm:p-8 flex flex-col items-center animate-slide-up">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Analysis Results</h3>
          <p className="text-gray-400 text-sm">Deep learning neural network inference details</p>
        </div>
        <button 
          onClick={onReset}
          className="p-2.5 bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-all duration-150"
          title="Analyze another image"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Quality Warning Callouts */}
      {isImproper && (
        <div className="w-full bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 mb-6 animate-pulse">
          <AlertTriangle className="w-5.5 h-5.5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Critical Warning: Incorrect/Improper Scan</h5>
            <p className="text-xs text-red-200 leading-normal">
              {quality_check.warning_message || "The uploaded image does not match a typical reddish-orange retinal fundus scan profile. The classification is highly likely to be incorrect."}
            </p>
          </div>
        </div>
      )}

      {isBlurry && !isImproper && (
        <div className="w-full bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Quality Warning: Blurry Scan</h5>
            <p className="text-xs text-amber-200 leading-normal">
              {quality_check.warning_message || "The image appears blurry or unclear. This might degrade classification accuracy."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        {/* Left Side: Image Preview & Primary Output */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-800 bg-gray-950/60 flex items-center justify-center group mb-4">
            <img 
              src={previewUrl} 
              alt="Uploaded Retina Scan" 
              className="max-w-full max-h-full object-contain"
            />
            {isLowConfidence && !isImproper && (
              <div className="absolute inset-0 bg-yellow-950/20 backdrop-blur-xs flex items-end p-3">
                <div className="w-full bg-amber-950/90 border border-amber-900/80 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-amber-200 leading-tight">
                    Low prediction confidence. Ensure scan is clear, centered, and fully covers the fundus.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Prediction Details */}
          <div className={`w-full rounded-xl border p-4 flex flex-col items-center ${theme.bg} ${theme.shadow}`}>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Primary Diagnosis</span>
            <div className="flex items-center gap-2 mb-1.5 text-center">
              {theme.icon}
              <span className={`text-xl font-bold ${theme.text}`}>{prediction}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{confidencePercent}%</span>
              <span className="text-xs text-gray-500">Confidence score</span>
            </div>
          </div>
        </div>

        {/* Right Side: Probability Distribution Bar Chart & suggestions */}
        <div className="md:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white text-sm uppercase tracking-wider">
              {showAllProbs ? 'Full Class Probabilities' : 'Top Disease Probabilities'}
            </h4>
            <button
              onClick={() => setShowAllProbs(!showAllProbs)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              {showAllProbs ? (
                <>Show Top 3 <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show All 8 Classes <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          {/* Bar Chart Container */}
          <div className="flex flex-col gap-4 bg-gray-900/40 border border-gray-800/80 rounded-xl p-5 mb-4">
            {(showAllProbs ? all_predictions : top3).map((item, idx) => {
              const itemPercent = (item.confidence * 100).toFixed(1);
              const isTop = idx === 0 && !showAllProbs;
              return (
                <div key={item.class_raw} className="flex flex-col w-full animate-fade-in">
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className={`font-medium ${isTop ? theme.text : 'text-gray-300'}`}>
                      {item.class_name}
                    </span>
                    <span className={`font-semibold ${isTop ? theme.text : 'text-gray-400'}`}>
                      {itemPercent}%
                    </span>
                  </div>
                  
                  {/* Bar Background Track */}
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    {/* Animated Fill Bar */}
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out`}
                      style={{ 
                        width: `${itemPercent}%`,
                        backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                        '--tw-gradient-from': isTop ? (prediction_raw === 'normal' ? '#10b981' : '#f59e0b') : '#3b82f6',
                        '--tw-gradient-to': isTop ? (prediction_raw === 'normal' ? '#34d399' : '#fb923c') : '#8b5cf6',
                        '--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clinical Suggestions Checklist */}
          <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 mb-4 animate-fade-in">
            <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI Clinician Suggestions: {suggestions.title}
            </h5>
            <ul className="flex flex-col gap-2">
              {suggestions.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinician Advice Notice */}
          <div className="bg-gray-950/40 border border-gray-800/80 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider shrink-0 mt-0.5">Note:</span>
            <p className="text-xs text-gray-400 leading-normal">
              This application is an AI demonstration trained on a subset of the ODIR dataset. The predictions are for educational purposes and should not be used as a final clinical diagnosis. Always seek the advice of a qualified ophthalmologist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
