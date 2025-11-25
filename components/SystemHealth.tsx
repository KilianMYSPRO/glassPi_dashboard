import React from 'react';
import { SystemMetrics } from '../types';
import { Cpu, HardDrive, Thermometer, Database } from 'lucide-react';
import GlassCard from './GlassCard';
import { PieChart, Pie, Cell } from 'recharts';

interface SystemHealthProps {
  metrics: SystemMetrics;
}

const MetricRing: React.FC<{ value: number; label: string; icon: React.ReactNode; color: string }> = ({ value, label, icon, color }) => {
  const data = [
    { name: 'Value', value: value },
    { name: 'Remaining', value: 100 - value },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-1">
      <div className="relative w-20 h-20">
        <PieChart width={80} height={80}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={36}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell key="val" fill={color} />
            <Cell key="bg" fill="rgba(255,255,255,0.1)" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex items-center justify-center text-white/90 font-bold text-sm">
          {value}%
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-300">
        {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
        <span>{label}</span>
      </div>
    </div>
  );
};

const SystemHealth: React.FC<SystemHealthProps> = ({ metrics }) => {
  return (
    <GlassCard title="System Resources" icon={<Cpu size={20} />} className="h-full">
      <div className="grid grid-cols-2 gap-2 h-full content-center">
        <MetricRing 
          value={metrics.cpuUsage} 
          label="CPU Load" 
          icon={<Cpu />} 
          color="#3b82f6" 
        />
        <MetricRing 
          value={metrics.memoryUsage} 
          label="RAM Usage" 
          icon={<Database />} 
          color="#8b5cf6" 
        />
        <MetricRing 
          value={metrics.temperature} 
          label="Temp (C)" 
          icon={<Thermometer />} 
          color="#f59e0b" 
        />
        <MetricRing 
          value={metrics.diskUsage} 
          label="Disk" 
          icon={<HardDrive />} 
          color="#10b981" 
        />
      </div>
    </GlassCard>
  );
};

export default SystemHealth;