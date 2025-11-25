import React from 'react';
import { AdGuardStats } from '../types';
import { Shield, Ban, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import GlassCard from './GlassCard';

interface AdGuardWidgetProps {
  stats: AdGuardStats & { error?: string };
}

const StatRow: React.FC<{ label: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ label, value, icon, colorClass }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
        {icon}
      </div>
      <span className="text-gray-300 text-sm">{label}</span>
    </div>
    <span className="font-semibold text-white tracking-wide">{value}</span>
  </div>
);

const AdGuardWidget: React.FC<AdGuardWidgetProps> = ({ stats }) => {
  if (stats.error) {
     return (
       <GlassCard title="AdGuard Home" icon={<Shield size={20} />} className="h-full border-red-500/30">
          <div className="flex flex-col h-full items-center justify-center text-center p-4">
             <AlertTriangle size={48} className="text-red-400 mb-3 opacity-80" />
             <h3 className="text-red-200 font-semibold mb-2">Connection Blocked</h3>
             
             {stats.error === 'proxy_missing' ? (
                <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded border border-white/5 text-left w-full">
                  <div className="flex items-center gap-2 mb-2 text-yellow-500">
                    <ShieldAlert size={12} /> <span className="font-bold">Missing Proxy Config</span>
                  </div>
                  <p className="mb-1 text-gray-400">Check <code>vite.config.ts</code></p>
                </div>
             ) : (
                <p className="text-xs text-gray-400 mb-4">
                  {stats.error === 'cors' 
                    ? "The browser blocked the request due to CORS policy." 
                    : "Authentication failed or server is unreachable."}
                </p>
             )}
          </div>
       </GlassCard>
     );
  }

  return (
    <GlassCard title="AdGuard Home" icon={<Shield size={20} />} className="h-full">
      <div className="flex flex-col h-full justify-center">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/30 bg-emerald-500/10 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">{stats.percentageBlocked}%</span>
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider">Blocked</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <StatRow 
            label="Total Queries" 
            value={stats.totalQueries.toLocaleString()} 
            icon={<Activity size={16} />} 
            colorClass="text-blue-400"
          />
          <StatRow 
            label="Ads Blocked" 
            value={stats.blockedQueries.toLocaleString()} 
            icon={<Ban size={16} />} 
            colorClass="text-red-400"
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default AdGuardWidget;