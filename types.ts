export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency: number; // ms
  uptime: number; // percentage
  icon: string;
  url: string;
  displayMetric?: string;
  enabled: boolean;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
  diskUsage: number;
}

export interface AdGuardStats {
  blockedQueries: number;
  totalQueries: number;
  percentageBlocked: number;
}

export interface SpeedTestResult {
  ping: number;
  download: number;
  upload: number;
  timestamp: string;
  rawDate?: string;
}

export interface DashboardState {
  services: ServiceHealth[];
  system: SystemMetrics;
  adguard: AdGuardStats;
  speedtestHistory: SpeedTestResult[];
  lastUpdated: Date;
  speedtestError?: string;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}