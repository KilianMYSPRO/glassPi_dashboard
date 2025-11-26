import React, { useState } from 'react';
import { SpeedTestResult } from '../types';
import { Wifi, Clock, AlertCircle, Terminal, AlertTriangle, ShieldAlert } from 'lucide-react';
import GlassCard from './GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NetworkGraphProps {
  history: SpeedTestResult[];
  error?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ history, error }) => {
  const [showDebug, setShowDebug] = useState(false);
  const current = history.length > 0 ? history[history.length - 1] : { download: 0, upload: 0, ping: 0, timestamp: '-', rawDate: null };
  const hasData = history.length > 0;

  const getLastRunLabel = () => {
    if (!current.rawDate) return current.timestamp;
    try {
      const date = new Date(current.rawDate);
      const isToday = new Date().toDateString() === date.toDateString();
      return isToday
        ? date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return current.timestamp;
    }
  };

  let chartData = [...history];
  if (hasData && chartData.length === 1) {
    chartData = [{ ...chartData[0], timestamp: ' ' }, ...chartData];
  }

  if (error && !hasData) {
    return (
      <GlassCard title="Network Tracker" icon={<Wifi size={20} />} className="h-full border-red-500/30">
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
          <AlertTriangle size={32} className="text-red-400 mb-3 opacity-80" />
          <h3 className="text-red-200 font-semibold mb-2">Connection Failed</h3>

          {error === 'proxy_missing' || error === 'invalid_format' ? (
            <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded border border-white/5 text-left w-full max-w-sm">
              <div className="flex items-center gap-2 mb-2 text-yellow-500">
                <ShieldAlert size={12} /> <span className="font-bold">Proxy or Config Error</span>
              </div>
              <p className="mb-2 text-gray-400">
                {error === 'invalid_format'
                  ? "Got invalid response from Speedtest API."
                  : "Missing Proxy Config"}
              </p>
              <p className="mb-2 text-gray-400">Check <code>vite.config.ts</code> for /speedtest-api proxy.</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4 max-w-[80%] mx-auto">
              {error === 'cors' ? "Browser blocked the request (CORS). Check Proxy." : `Unable to reach Speedtest API. (${error})`}
            </p>
          )}
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard
      title="Network Tracker"
      icon={<Wifi size={20} />}
      className="h-full"
      action={
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-gray-600 hover:text-blue-400 transition-colors p-1"
          title="Toggle Data Debugger"
        >
          <Terminal size={14} />
        </button>
      }
    >
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div className="flex items-end gap-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Download</div>
            <div className="text-2xl font-bold text-emerald-400">{current.download} <span className="text-sm font-normal text-gray-400">Mbps</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Upload</div>
            <div className="text-2xl font-bold text-blue-400">{current.upload} <span className="text-sm font-normal text-gray-400">Mbps</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Ping</div>
            <div className="text-2xl font-bold text-yellow-400">{current.ping} <span className="text-sm font-normal text-gray-400">ms</span></div>
          </div>
        </div>

        {hasData && (
          <div className="text-[10px] text-gray-500 flex items-center gap-1 mb-1 bg-black/20 px-2 py-1 rounded">
            <Clock size={10} /> Last Test: {getLastRunLabel()}
          </div>
        )}
      </div>

      {showDebug ? (
        <div className="flex-1 bg-black/40 rounded p-2 overflow-auto font-mono text-[10px] text-green-400 whitespace-pre border border-white/10 h-full min-h-[150px]">
          <div>Status: {error ? `Error (${error})` : 'OK'}</div>
          {hasData ? JSON.stringify(history.slice(-3), null, 2) : "No data in history array."}
        </div>
      ) : (
        <div className="flex-1 w-full relative min-h-[180px]">
          {!hasData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-10 bg-slate-900/20 backdrop-blur-sm rounded">
              <AlertCircle className="mb-2 opacity-50" />
              <span className="text-xs">Waiting for speedtest data...</span>
            </div>
          )}
          <div className="w-full h-full absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorDown)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorUp)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default NetworkGraph;