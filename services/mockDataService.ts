/// <reference types="vite/client" />
import { DashboardState, ServiceHealth, SpeedTestResult } from '../types';

// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
  // Base URLs - Using proxies defined in vite.config.ts where applicable
  GLANCES_URL: 'http://glances.home',
  ADGUARD_URL: import.meta.env.VITE_ADGUARD_URL || '/adguard-api',
  SPEEDTEST_URL: '/speedtest-api',

  // AdGuard Authentication (Leave empty if none)
  ADGUARD_USERNAME: import.meta.env.VITE_ADGUARD_USERNAME || '',
  ADGUARD_PASSWORD: import.meta.env.VITE_ADGUARD_PASSWORD || '',

  // Set to true to force simulated data if testing offline
  FORCE_MOCK: false,
};

// Internal state to track detected API versions and capabilities
let GLANCES_API_VERSION: '2' | '3' | '4' | null = null;
let DOCKER_PLUGIN_AVAILABLE = true; // Assume true until it fails

// ==========================================
// API CLIENT
// ==========================================

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 3000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Helper to determine Glances API version dynamically
const fetchGlances = async (endpoint: string, suppressErrors = false) => {
  // If we already know the version, use it
  if (GLANCES_API_VERSION) {
    const url = `${CONFIG.GLANCES_URL}/api/${GLANCES_API_VERSION}/${endpoint}`;
    return fetchWithTimeout(url).then(r => {
      // For v4, some endpoints might return 400 if plugin is disabled; handle gracefully
      if (!r.ok) {
        if (suppressErrors) throw new Error("suppressed");
        throw new Error(`${r.status} ${r.statusText} at ${url}`);
      }
      return r.json();
    });
  }

  // Otherwise, try v3 first (most common), then v4, then v2
  const versions: ('3' | '4' | '2')[] = ['3', '4', '2'];

  for (const v of versions) {
    try {
      const url = `${CONFIG.GLANCES_URL}/api/${v}/${endpoint}`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        GLANCES_API_VERSION = v; // Cache the working version
        console.log(`Detected Glances API Version: ${v}`);
        return await res.json();
      }
    } catch (e) {
      // Continue to next version
    }
  }
  throw new Error("Could not detect Glances API version");
};

const getSystemStats = async () => {
  try {
    // Fetch core metrics using the version-aware fetcher
    const [cpuRes, memRes, sensorsRes, fsRes] = await Promise.allSettled([
      fetchGlances('cpu/total'),
      fetchGlances('mem'),
      fetchGlances('sensors'),
      fetchGlances('fs'),
    ]);

    // 1. CPU
    let cpuUsage = 0;
    if (cpuRes.status === 'fulfilled') {
      const c = cpuRes.value;
      // Handle: { total: 10 } OR 10 (v2 vs v3 differences)
      cpuUsage = typeof c === 'number' ? c : (c.total || (c.user + c.system) || 0);
    }

    // 2. Memory
    let memoryUsage = 0;
    if (memRes.status === 'fulfilled') {
      memoryUsage = memRes.value.percent || 0;
    }

    // 3. Disk
    let diskUsage = 0;
    if (fsRes.status === 'fulfilled' && Array.isArray(fsRes.value)) {
      // Find root or largest partition
      const fs = fsRes.value;
      const root = fs.find((f: any) => f.mnt_point === '/' || f.mnt_point === '/etc/hosts') || fs[0];
      diskUsage = root?.percent || 0;
    }

    // 4. Temperature
    let tempValue = 0;
    if (sensorsRes.status === 'fulfilled' && Array.isArray(sensorsRes.value)) {
      // Filter for likely CPU sensors
      const tempSensor = sensorsRes.value.find((s: any) => {
        const label = (s.label || '').toLowerCase();
        return label.includes('cpu') || label.includes('soc') || label.includes('package') || label.includes('thermal') || label.includes('tctl');
      });
      // Some sensors return value in 'value', others in 'current'
      tempValue = tempSensor ? (tempSensor.value || tempSensor.current || 0) : 0;
    }

    return {
      cpuUsage: Math.round(cpuUsage),
      memoryUsage: Math.round(memoryUsage),
      temperature: Math.round(tempValue),
      diskUsage: Math.round(diskUsage),
    };
  } catch (e) {
    console.warn("Glances fetch failed (all versions):", e);
    return null;
  }
};

const getAdGuardStats = async () => {
  try {
    const headers: HeadersInit = {};
    if (CONFIG.ADGUARD_USERNAME && CONFIG.ADGUARD_PASSWORD) {
      headers['Authorization'] = 'Basic ' + btoa(CONFIG.ADGUARD_USERNAME + ":" + CONFIG.ADGUARD_PASSWORD);
    }

    const response = await fetchWithTimeout(`${CONFIG.ADGUARD_URL}/control/stats`, { headers });

    if (!response.ok) {
      // If local proxy path returns 404, it means proxy is missing
      if (response.status === 404 && CONFIG.ADGUARD_URL.startsWith('/')) {
        return { error: 'proxy_missing' };
      }
      if (response.status === 403) return { error: 'auth_required' };
      // Don't throw, just return error
      return { error: `http_${response.status}` };
    }

    // Robust content checking
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return { error: 'proxy_missing' };
    }

    // Try text first to be safe
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // If it looks like HTML but wasn't flagged by headers
      if (text.trim().startsWith('<')) return { error: 'proxy_missing' };
      return { error: 'invalid_format' };
    }

    const total = data.num_dns_queries || 0;
    const blocked = data.num_blocked_filtering || 0;
    const percent = total > 0 ? ((blocked / total) * 100).toFixed(1) : "0.0";

    return {
      blockedQueries: blocked,
      totalQueries: total,
      percentageBlocked: parseFloat(percent)
    };
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
      return { error: 'cors' };
    }
    return { error: 'fetch_failed' };
  }
};

const getSpeedtest = async (): Promise<{ result: SpeedTestResult | null; error?: string }> => {
  try {
    const response = await fetchWithTimeout(`${CONFIG.SPEEDTEST_URL}/api/speedtest/latest`);

    if (!response.ok) {
      if (response.status === 404 && CONFIG.SPEEDTEST_URL.startsWith('/')) {
        return { result: null, error: 'proxy_missing' };
      }
      return { result: null, error: `http_${response.status}` };
    }

    // Content Type Check
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      return { result: null, error: 'proxy_missing' };
    }

    // Parse safely
    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (parseError) {
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        return { result: null, error: 'proxy_missing' };
      }
      console.warn("Speedtest: Failed to parse JSON", parseError);
      return { result: null, error: 'invalid_format' };
    }

    // Support multiple API structures
    const data = json.data || json;

    if (!data || (data.download === undefined && data.ping === undefined)) {
      return { result: null, error: 'invalid_format' };
    }

    const parseNum = (n: any) => Math.round(parseFloat(n) || 0);

    const result = {
      ping: parseNum(data.ping),
      download: parseNum(data.download),
      upload: parseNum(data.upload),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      rawDate: data.updated_at || new Date().toISOString()
    };

    return { result };
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
      return { result: null, error: 'cors' };
    }
    console.warn("Speedtest Fetch Error:", e.message);
    return { result: null, error: 'fetch_failed' };
  }
};

const getDockerContainers = async () => {
  // If we already know the Docker plugin is not available on this Glances instance, skip to avoid 400 errors
  if (!DOCKER_PLUGIN_AVAILABLE) return null;

  try {
    let containers = null;

    try {
      containers = await fetchGlances('docker/containers', true);
    } catch (e) {
      // Fallback for API v4 or missing docker plugin
      try {
        containers = await fetchGlances('containers', true);
      } catch (e2) {
        DOCKER_PLUGIN_AVAILABLE = false;
      }
    }

    if (!Array.isArray(containers)) return null;

    return containers.map((c: any) => ({
      name: c.name,
      status: (c.Status === 'running' || (c.Status && c.Status.toLowerCase().includes('up'))) ? 'up' : 'down',
      icon: getIconForService(c.name),
      url: getUrlForService(c.name),
      uptime: 100
    }));
  } catch (e) {
    DOCKER_PLUGIN_AVAILABLE = false;
    return null;
  }
};

const getIconForService = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('adguard')) return 'Shield';
  if (n.includes('kuma')) return 'Activity';
  if (n.includes('speed')) return 'Wifi';
  if (n.includes('glances')) return 'Monitor';
  if (n.includes('npm') || n.includes('nginx')) return 'Globe';
  if (n.includes('watchtower')) return 'RefreshCw';
  if (n.includes('grafana')) return 'PieChart';
  if (n.includes('pihole')) return 'Shield';
  if (n.includes('plex') || n.includes('jellyfin')) return 'Play';
  if (n.includes('homeassistant')) return 'Home';
  return 'Box';
};

const getUrlForService = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('kuma')) return 'http://kuma.home';
  if (n.includes('adguard')) return CONFIG.ADGUARD_URL;
  if (n.includes('glances')) return CONFIG.GLANCES_URL;
  if (n.includes('npm')) return 'http://npm.home';
  if (n.includes('speed')) return CONFIG.SPEEDTEST_URL;
  return `http://${n}.home`;
};


// ==========================================
// MAIN DATA FUNCTION
// ==========================================

export const fetchDashboardData = async (
  prevHistory: SpeedTestResult[] = [],
  currentServices: ServiceHealth[] = []
): Promise<DashboardState> => {

  if (CONFIG.FORCE_MOCK) {
    return generateMockData(prevHistory, currentServices);
  }

  // 1. Fetch System Stats
  const systemData = await getSystemStats();
  const system = systemData || {
    cpuUsage: 0,
    memoryUsage: 0,
    temperature: 0,
    diskUsage: 0
  };

  // 2. Fetch AdGuard
  const adguardData: any = await getAdGuardStats();
  const adguard = !adguardData || adguardData.error ? {
    blockedQueries: 0,
    totalQueries: 0,
    percentageBlocked: 0,
    error: adguardData?.error // Pass error state to UI
  } : adguardData;

  // 3. Fetch Speedtest
  const { result: speedData, error: speedError } = await getSpeedtest();
  let speedtestHistory = [...prevHistory];
  let latestSpeed: SpeedTestResult | null = speedData;

  if (speedData) {
    const entryToAdd = {
      ...speedData,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    };

    speedtestHistory.push(entryToAdd);
    if (speedtestHistory.length > 20) speedtestHistory.shift();

  } else if (prevHistory.length > 0) {
    // Extend history for graph continuity if fetch fails
    const last = prevHistory[prevHistory.length - 1];
    speedtestHistory.push({
      ...last,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    });
    if (speedtestHistory.length > 20) speedtestHistory.shift();
    latestSpeed = last;
  }

  // 4. Fetch Services (Docker containers)
  const dockerServices = await getDockerContainers();

  let finalServices: ServiceHealth[] = [];

  if (dockerServices && dockerServices.length > 0) {
    finalServices = dockerServices.map((ds: any) => {
      const existing = currentServices.find(cs => cs.name === ds.name);
      return {
        ...ds,
        enabled: existing ? existing.enabled : true,
        latency: Math.floor(Math.random() * 15) + 2
      };
    });
  } else {
    finalServices = currentServices.length > 0 ? currentServices : DEFAULT_MOCK_SERVICES;
  }

  // Update Display Metrics on Cards
  finalServices = finalServices.map(service => {
    let displayMetric = undefined;
    const n = service.name.toLowerCase();

    if (n.includes('speed') && latestSpeed) {
      displayMetric = `↓ ${latestSpeed.download} Mbps`;
    } else if (n.includes('adguard')) {
      if (adguard.error) displayMetric = "Connection Error";
      else if (adguard.totalQueries > 0) displayMetric = `${adguard.percentageBlocked}% Blocked`;
    } else if (n.includes('glances') && systemData) {
      displayMetric = `CPU: ${system.cpuUsage}%`;
    } else if (n.includes('kuma')) {
      displayMetric = "Monitoring";
    }

    return { ...service, displayMetric };
  });

  return {
    services: finalServices,
    system,
    adguard,
    speedtestHistory,
    speedtestError: speedError,
    lastUpdated: new Date()
  };
};

// ==========================================
// MOCK FALLBACK
// ==========================================

const DEFAULT_MOCK_SERVICES: ServiceHealth[] = [
  { name: 'Uptime Kuma', icon: 'Activity', url: 'http://kuma.home', enabled: true, status: 'up', latency: 12, uptime: 100 },
  { name: 'Watchtower', icon: 'RefreshCw', url: 'http://watchtower.home', enabled: true, status: 'up', latency: 0, uptime: 100 },
  { name: 'Speedtest Tracker', icon: 'Wifi', url: 'http://speedometer.home', enabled: true, status: 'up', latency: 5, uptime: 100 },
  { name: 'AdGuard Home', icon: 'Shield', url: 'http://adguard.home', enabled: true, status: 'up', latency: 8, uptime: 100 },
  { name: 'NPM', icon: 'Globe', url: 'http://npm.home', enabled: true, status: 'up', latency: 15, uptime: 100 },
  { name: 'Glances', icon: 'Monitor', url: 'http://glances.home', enabled: true, status: 'up', latency: 4, uptime: 100 },
];

function generateMockData(prevHistory: SpeedTestResult[], currentServices: ServiceHealth[]): DashboardState {
  const newSpeedTest: SpeedTestResult = {
    ping: Math.floor(Math.random() * 20) + 10,
    download: Math.floor(Math.random() * 150) + 800,
    upload: Math.floor(Math.random() * 100) + 400,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    rawDate: new Date().toISOString()
  };

  const adguard = {
    blockedQueries: 23400,
    totalQueries: 85000,
    percentageBlocked: 12.5
  };

  // @ts-ignore
  const services = (currentServices.length > 0 ? currentServices : DEFAULT_MOCK_SERVICES).map(s => {
    return { ...s, displayMetric: 'Mock Data' };
  });

  const system = {
    cpuUsage: Math.floor(Math.random() * 30) + 10,
    memoryUsage: Math.floor(Math.random() * 40) + 30,
    temperature: Math.floor(Math.random() * 20) + 40,
    diskUsage: 45
  };

  return {
    services,
    system,
    adguard,
    speedtestHistory: [...prevHistory, newSpeedTest].slice(-20),
    lastUpdated: new Date()
  };
}