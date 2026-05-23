import React, { useState } from 'react';
import { Eye, Info, BookOpen } from 'lucide-react';

export default function DiseaseInfo({ activeTab: externalActiveTab, setActiveTab: externalSetActiveTab }) {
  const [localActiveTab, setLocalActiveTab] = useState(0);

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : localActiveTab;
  const setActiveTab = externalSetActiveTab !== undefined ? externalSetActiveTab : setLocalActiveTab;

  const diseases = [
    {
      name: "Normal Retina",
      details: "A healthy retinal fundus exhibits a clear optic disc, well-defined vascular structures, and a healthy macula area without any hemorrhages, exudates, or drusen deposits.",
      symptoms: "Normal, clear, unobstructed vision with normal field of view and acuity.",
      advice: "Maintain regular comprehensive eye checkups (at least once every 1-2 years)."
    },
    {
      name: "Diabetic Retinopathy",
      details: "Caused by diabetes mellitus, this condition damages the microvascular network of the retina, leading to microaneurysms, hemorrhages, cotton wool spots, and hard exudates.",
      symptoms: "Blurry vision, dark spots or empty areas (floaters) in the field of view, impaired color vision.",
      advice: "Strict blood sugar and blood pressure management. Annual dilated retinal examinations are critical."
    },
    {
      name: "Glaucoma",
      details: "Known as the silent thief of sight, glaucoma results in progressive optic nerve degeneration, marked by excavation of the optic disc (increased cup-to-disc ratio).",
      symptoms: "Gradual loss of peripheral vision (tunnel vision) in early stages, leading to severe visual loss if untreated.",
      advice: "Intraocular pressure measurements and visual field testings. Diagnosed early, it can be managed with eye drops."
    },
    {
      name: "Cataract",
      details: "Though primarily a lens clouding disease, in fundus images cataracts create blurriness and visual opacity, reducing details of the retinal vasculature.",
      symptoms: "Clouded or dim vision, difficulty seeing at night, halos around lights, fading colors.",
      advice: "Outpatient cataract surgery is highly effective, replacing the natural lens with a clear artificial lens."
    },
    {
      name: "Myopia",
      details: "Pathologic myopia involves extreme elongation of the eyeball, leading to thinning of the retina, temporal crescent at the optic disc, and macular chorioretinal degeneration.",
      symptoms: "Extremely poor distant vision, flashes of light, floaters, or shadows indicating retinal strain.",
      advice: "Regular monitoring for retinal tears or detachments, which are major risks in high myopia."
    },
    {
      name: "Hypertensive Retinopathy",
      details: "High blood pressure causes changes in retinal vasculature, including arteriole narrowing, copper/silver wiring, arteriovenous (AV) nicking, and flame hemorrhages.",
      symptoms: "Usually asymptomatic in early stages; severe cases cause headaches, blurry vision, or double vision.",
      advice: "Aggressive blood pressure control and cardiovascular risk mitigation."
    },
    {
      name: "Age-related Degeneration (AMD)",
      details: "Affects the macula, the center of the retina. Characterized by drusen deposits (dry AMD) or abnormal neovascularization and bleeding (wet AMD).",
      symptoms: "Distorted central vision (wavy lines), dark spot in the center of the field of view, decreased color brightness.",
      advice: "Intake of specific vitamins (AREDS2 formulation). Wet AMD is treated with anti-VEGF injections."
    },
    {
      name: "Other Retinal Anomalies",
      details: "Encompasses other conditions such as retinal vein occlusion (RVO), retinal artery occlusion, epiretinal membranes, retinitis, or congenital anomalies.",
      symptoms: "Sudden painless vision loss, localized blind spots, or distorted shapes.",
      advice: "Consult an eye care specialist immediately for comprehensive evaluation."
    }
  ];

  return (
    <div className="glass-panel w-full rounded-2xl p-6 sm:p-8 animate-slide-up">
      <div className="flex items-center gap-2.5 mb-6">
        <BookOpen className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Retinal Pathology Database</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation buttons */}
        <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none shrink-0 border-b border-gray-800 lg:border-b-0 lg:border-r lg:border-gray-800/80 pr-0 lg:pr-4">
          {diseases.map((d, idx) => (
            <button
              key={d.name}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap lg:whitespace-normal cursor-pointer transition-all duration-200 ${
                activeTab === idx
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Info detail display */}
        <div className="lg:col-span-8 flex flex-col justify-between min-h-[220px] bg-gray-950/30 border border-gray-800/60 rounded-xl p-5 animate-fade-in" key={activeTab}>
          <div>
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-blue-400" />
              {diseases[activeTab].name}
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              {diseases[activeTab].details}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900/50 rounded-lg p-3.5 border border-gray-800/40">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block mb-1">Common Symptoms</span>
                <p className="text-xs text-gray-400 leading-normal">{diseases[activeTab].symptoms}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3.5 border border-gray-800/40">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block mb-1">Clinical Guidelines</span>
                <p className="text-xs text-gray-400 leading-normal">{diseases[activeTab].advice}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-800/50 pt-3">
            <Info className="w-3.5 h-3.5" />
            <span>Fundus photography allows non-invasive analysis of these structures.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
