import React from 'react';
import GlassCard from './GlassCard';
import { Cloud, CloudLightning, CloudRain, Sun, Wind } from 'lucide-react';
import { ServiceHealth } from '../types';

interface WeatherWidgetProps {
    services: ServiceHealth[];
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ services }) => {
    // Logic to determine "weather"
    // Filter out services that shouldn't affect the weather (e.g. intermittent ones like Watchtower)
    const ignoredServices = services.filter(s => s.name.toLowerCase().includes('watchtower'));
    const activeServices = services.filter(s => !s.name.toLowerCase().includes('watchtower'));

    const totalServices = activeServices.length;
    const downServices = activeServices.filter(s => s.status === 'down').length;
    const degradedServices = activeServices.filter(s => s.status === 'degraded').length;

    // Specific check for critical services (if they exist)
    const internetService = activeServices.find(s => s.name.toLowerCase().includes('speed') || s.name.toLowerCase().includes('internet'));
    const isInternetDown = internetService?.status === 'down';

    let weatherIcon = <Sun size={48} className="text-yellow-400 animate-pulse" />;
    let weatherTitle = "Sunny";
    let weatherDesc = "All systems operational";
    let weatherClass = "weather-shiny";
    let bgGradient = "from-blue-400/10 to-yellow-400/10";

    if (isInternetDown || downServices >= 3) {
        weatherIcon = <CloudLightning size={48} className="text-purple-400 animate-bounce" />;
        weatherTitle = "Stormy";
        weatherDesc = "Critical systems offline";
        bgGradient = "from-gray-900/50 to-purple-900/50";
        weatherClass = "weather-storm";
    } else if (downServices > 0) {
        weatherIcon = <CloudRain size={48} className="text-blue-400" />;
        weatherTitle = "Rainy";
        weatherDesc = `${downServices} service${downServices > 1 ? 's' : ''} down`;
        bgGradient = "from-slate-800/50 to-blue-900/50";
        weatherClass = "weather-rain";
    } else if (degradedServices > 0) {
        weatherIcon = <Cloud size={48} className="text-gray-400" />;
        weatherTitle = "Cloudy";
        weatherDesc = "Some services degraded";
        bgGradient = "from-slate-700/30 to-gray-600/30";
        weatherClass = "";
    }

    return (
        <GlassCard className={`h-full bg-gradient-to-br ${bgGradient} transition-all duration-500 ${weatherClass}`}>
            <div className="flex items-center justify-between h-full px-2">
                <div className="flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-white mb-1">{weatherTitle}</h3>
                    <p className="text-sm text-blue-200/70">{weatherDesc}</p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-black/20 px-2 py-1 rounded w-fit">
                        <Wind size={12} />
                        <span>{totalServices} Active Monitors</span>
                    </div>

                    {ignoredServices.length > 0 && (
                        <div className="mt-2 text-[10px] text-white/30">
                            Ignored: {ignoredServices.map(s => s.name).join(', ')}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-white/5 rounded-full backdrop-blur-sm shadow-xl border border-white/10">
                    {weatherIcon}
                </div>
            </div>
        </GlassCard>
    );
};

export default WeatherWidget;
