import React from 'react';
import GlassCard from './GlassCard';
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface UptimeKumaWidgetProps {
    monitors?: any[];
}

const UptimeKumaWidget: React.FC<UptimeKumaWidgetProps> = ({ monitors }) => {
    if (!monitors) {
        return (
            <GlassCard title="Uptime Kuma" icon={<Activity size={20} />} className="h-full">
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                    Loading monitors...
                </div>
            </GlassCard>
        );
    }

    if (monitors.length === 0) {
        return (
            <GlassCard title="Uptime Kuma" icon={<Activity size={20} />} className="h-full">
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                    No monitors found. Check configuration.
                </div>
            </GlassCard>
        );
    }

    // Calculate stats
    const upCount = monitors.filter(m => m.status === 'up').length;
    const downCount = monitors.filter(m => m.status === 'down').length;
    const uptime = monitors.length > 0 ? ((upCount / monitors.length) * 100).toFixed(0) : 0;

    return (
        <GlassCard
            title="Uptime Kuma"
            icon={<Activity size={20} />}
            className="h-full"
            action={
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400 font-bold">{uptime}%</span>
                    <span className="text-gray-500">UP</span>
                </div>
            }
        >
            <div className="flex flex-col gap-2 h-full overflow-y-auto pr-1 custom-scrollbar">
                {monitors.map((monitor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${monitor.status === 'up' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                    monitor.status === 'down' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-gray-500'
                                }`} />
                            <span className="text-xs font-medium text-gray-200 truncate">{monitor.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {monitor.ping && (
                                <span className="text-[10px] text-gray-500 font-mono">{monitor.ping}ms</span>
                            )}
                            {monitor.status === 'up' ? (
                                <CheckCircle size={14} className="text-emerald-500/50" />
                            ) : (
                                <XCircle size={14} className="text-red-500/50" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

export default UptimeKumaWidget;
