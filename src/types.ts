/**
 * Shared Type Definitions for MediSense AI
 */

export interface NavItem {
  name: string;
  path: string;
  icon: string; // we translate this to Lucide icons
  description: string;
}

export interface HealthMetric {
  id: string;
  name: string;
  value: string;
  change: string;
  status: 'optimal' | 'warning' | 'critical';
  unit: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
