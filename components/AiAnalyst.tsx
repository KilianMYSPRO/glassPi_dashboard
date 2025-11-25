import React, { useState } from 'react';
import { DashboardState } from '../types';
import { analyzeSystemMetrics } from '../services/geminiService';
import { Sparkles, Bot, RefreshCw } from 'lucide-react';
import GlassCard from './GlassCard';
import ReactMarkdown from 'react-markdown';

interface AiAnalystProps {
  data: DashboardState;
}

const AiAnalyst: React.FC<AiAnalystProps> = ({ data }) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastRan, setLastRan] = useState<Date | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeSystemMetrics(data);
    setAnalysis(result);
    setLastRan(new Date());
    setLoading(false);
  };

  return (
    <GlassCard 
      className="relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Bot size={120} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-400" size={20} />
            <h3 className="text-lg font-semibold text-white/90">AI System Analyst</h3>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              loading 
                ? 'bg-purple-500/20 text-purple-300 cursor-wait' 
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
            }`}
          >
            {loading ? <RefreshCw className="animate-spin" size={12} /> : <Sparkles size={12} />}
            {loading ? 'Analyzing...' : 'Generate Report'}
          </button>
        </div>

        <div className="flex-1 bg-black/20 rounded-xl p-4 min-h-[100px] text-sm text-gray-300 leading-relaxed border border-white/5">
          {analysis ? (
             <div className="prose prose-invert prose-sm max-w-none">
               <ReactMarkdown>{analysis}</ReactMarkdown>
               <div className="text-[10px] text-gray-500 mt-4 text-right">
                 Generated: {lastRan?.toLocaleTimeString()}
               </div>
             </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 italic">
              Click "Generate Report" to ask Gemini to analyze your system metrics.
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default AiAnalyst;