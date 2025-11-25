import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Settings } from 'lucide-react';
import { fetchDashboardData } from './services/mockDataService';
import { DashboardState, ServiceHealth } from './types';
import ServiceStatus from './components/ServiceStatus';
import SystemHealth from './components/SystemHealth';
import NetworkGraph from './components/NetworkGraph';
import AdGuardWidget from './components/AdGuardWidget';
import AiAnalyst from './components/AiAnalyst';
import WeatherWidget from './components/WeatherWidget';
import UptimeKumaWidget from './components/UptimeKumaWidget';
import CollapsibleSection from './components/CollapsibleSection';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef<DashboardState | null>(null);

  const [serviceOrder, setServiceOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('serviceOrder');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    stateRef.current = data;
  }, [data]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const newData = await fetchDashboardData([], []);
        setData(newData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load initial data", error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleReorder = (newOrder: string[]) => {
    setServiceOrder(newOrder);
    localStorage.setItem('serviceOrder', JSON.stringify(newOrder));
  };

  const getSortedServices = (services: ServiceHealth[]) => {
    if (serviceOrder.length === 0) return services;

    return [...services].sort((a, b) => {
      const indexA = serviceOrder.indexOf(a.name);
      const indexB = serviceOrder.indexOf(b.name);

      // If both are in the order list, sort by index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;

      // If only one is in the list, put it first (or last, depending on preference - let's put known ones first)
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither, alphabetical fallback
      return a.name.localeCompare(b.name);
    });
  };

  const toggleService = (serviceName: string) => {
    if (!data) return;
    setData({
      ...data,
      services: data.services.map(s =>
        s.name === serviceName ? { ...s, enabled: !s.enabled } : s
      )
    });
  };

  const handleAddService = (newService: { name: string; url: string; icon: string }) => {
    if (!data) return;
    const serviceToAdd: ServiceHealth = {
      name: newService.name,
      url: newService.url,
      icon: newService.icon,
      status: 'up',
      latency: 0,
      uptime: 100,
      enabled: true
    };

    setData({
      ...data,
      services: [...data.services, serviceToAdd]
    });

    // Add to order list
    const newOrder = [...serviceOrder, newService.name];
    setServiceOrder(newOrder);
    localStorage.setItem('serviceOrder', JSON.stringify(newOrder));
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-blue-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm tracking-wider animate-pulse">CONNECTING TO RASPBERRY PI...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-8 flex flex-col gap-4 md:gap-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
            GlassPi Monitor
          </h1>
          <p className="text-blue-200/60 text-xs md:text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Online • Raspberry Pi 5
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-300">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </div>
          <div className="glass-panel p-2 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-colors">
            <Settings size={20} />
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-4 md:gap-8">
        <CollapsibleSection title="Active Services" defaultOpen={true}>
          <ServiceStatus
            services={getSortedServices(data.services)}
            onToggleService={toggleService}
            onAddService={handleAddService}
            onReorder={handleReorder}
          />
        </CollapsibleSection>

        <CollapsibleSection title="System Overview" defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-8 lg:col-span-8 min-h-[320px] md:h-[350px]">
              <NetworkGraph history={data.speedtestHistory} error={data.speedtestError} />
            </div>
            <div className="md:col-span-4 lg:col-span-4 min-h-[200px] md:h-[350px]">
              <WeatherWidget services={data.services} />
            </div>

            <div className="md:col-span-4 lg:col-span-4 min-h-[250px] md:h-[300px]">
              <AdGuardWidget stats={data.adguard} />
            </div>
            <div className="md:col-span-4 lg:col-span-4 min-h-[250px] md:h-[300px]">
              <UptimeKumaWidget monitors={data.kuma} />
            </div>
            <div className="md:col-span-4 lg:col-span-4 min-h-[250px] md:h-[300px]">
              <SystemHealth metrics={data.system} />
            </div>

            <div className="md:col-span-12 lg:col-span-12 min-h-[300px]">
              <AiAnalyst data={data} />
            </div>
          </div>
        </CollapsibleSection>
      </main>

      <footer className="text-center text-gray-500 text-xs py-4">
        <p>GlassPi Monitor v1.3 • Powered by React, Tailwind & Gemini API</p>
      </footer>
    </div>
  );
};

export default App;