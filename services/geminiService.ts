import { GoogleGenAI } from "@google/genai";
import { DashboardState, GeminiModel } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert DevOps engineer and System Administrator for a Raspberry Pi 5 Homelab.
You are monitoring a dashboard containing: Uptime Kuma, AdGuard, Glances, etc.
Your goal is to provide a brief, witty, but insightful "System Health Report" based on the provided JSON metrics.
- Highlight any anomalies (high CPU, degraded services).
- Compliment high internet speeds or good ad-blocking rates.
- Keep it under 100 words.
- Use markdown for formatting.
`;

export const analyzeSystemMetrics = async (data: DashboardState): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "Error: API Key is missing. Please check your environment configuration.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Convert data to a simplified string to save tokens and focus on important metrics
    const context = JSON.stringify({
      cpu: `${data.system.cpuUsage}%`,
      temp: `${data.system.temperature}C`,
      adblock: `${data.adguard.percentageBlocked}%`,
      downSpeed: `${data.speedtestHistory[data.speedtestHistory.length - 1]?.download} Mbps`,
      servicesDown: data.services.filter(s => s.status !== 'up').map(s => s.name)
    }, null, 2);

    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: `Here is the current system snapshot:\n${context}\n\nProvide the health report.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Unable to connect to AI System Analyst. Please try again later.";
  }
};