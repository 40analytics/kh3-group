// Role-based access control
export enum Role {
  CEO = 'CEO',
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  MANAGER = 'MANAGER',
}

// Pipeline stages for lead management
export enum PipelineStage {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost',
}

// Lead risk levels
export enum LeadRisk {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  AT_RISK = 'At Risk',
}

// Activity types
export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'status_change';

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  timestamp: string;
  user: string;
}

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
}

// AI Response Types
export interface ExecutiveSummaryResponse {
  summary: string;
  flags: string[];
}

export interface LeadRiskAnalysis {
  riskLevel: string;
  summary: string;
  recommendations: string[];
}

export interface ClientHealthReport {
  healthScore: number;
  summary: string;
  recommendations: string[];
}

export interface UpsellStrategy {
  strategy: string;
  opportunities: Array<{
    title: string;
    description: string;
    potentialValue: string;
  }>;
}

// Lead interface matching backend schema
export interface Lead {
  id: string;
  contactName: string;
  company: string;
  position?: string;
  email?: string;
  phone?: string;
  value: number;
  stage: string;
  serviceType?: string | null;
  urgency: string;
  source: string;
  channel: string;
  expectedCloseDate?: string | Date | null;
  notes?: string | null;
  aiRiskLevel?: string | null;
  aiSummary?: string | null;
  aiRecommendations?: string | null;

  // Assignment
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;

  // Client relationship (for repeat business)
  clientId?: string | null;
  client?: {
    id: string;
    name: string;
  } | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Metrics and risk flags
  metrics?: {
    daysInPipeline: number;
    daysSinceLastContact: number;
    activityCount: number;
    fileCount: number;
  };
  riskFlags?: Array<{
    type:
      | 'NO_CONTACT'
      | 'LONG_PIPELINE'
      | 'HIGH_VALUE_STALE'
      | 'NO_ACTIVITY';
    severity: 'low' | 'medium' | 'high';
    message: string;
    icon: string;
  }>;
  suggestedActions?: string[];

  // Legacy fields for backward compatibility
  name?: string;
  activities?: Activity[];
  uploads?: FileUpload[];
  aiRiskFlag?: LeadRisk;
}

// Client metrics and health flags
export interface ClientMetrics {
  daysSinceLastContact: number;
  totalActivityCount: number;
  recentActivityCount: number;
  totalProjectCount: number;
  activeProjectCount: number;
  completedProjectCount: number;
  totalRevenue: number;
  recentRevenue: number;
  avgProjectValue: number;
  engagementScore: number;
}

export interface ClientHealthFlag {
  type:
    | 'NO_CONTACT'
    | 'DECLINING_ENGAGEMENT'
    | 'HIGH_VALUE_AT_RISK'
    | 'STRONG_RELATIONSHIP';
  severity: 'low' | 'medium' | 'high' | 'positive';
  message: string;
  icon: string;
}

export interface Project {
  id: string;
  name: string;
  status: string;
  value: number;
  startDate?: string;
  completedDate?: string;
  description?: string;
  projectManager?: {
    id: string;
    name: string;
    email: string;
  };
}

// Client interface matching backend schema
export interface Client {
  id: string;
  name: string;

  // Contact Information
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;

  // Classification
  segment: string;
  industry: string;

  // Financial
  lifetimeRevenue: number;

  // Health Status
  status: string;
  healthScore?: number | null;
  aiHealthSummary?: string | null;
  aiUpsellStrategy?: string | null;

  // Status Management
  statusOverride?: boolean;
  statusOverrideReason?: string | null;
  statusLastCalculated?: string | Date | null;

  // Engagement Metrics
  lastContactDate?: string | Date | null;
  totalProjectCount?: number;
  activeProjectCount?: number;

  // Assignment
  accountManagerId?: string | null;
  accountManager?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;

  // Relationships
  projects?: Project[];
  convertedFromLead?: {
    id: string;
    contactName: string;
    company: string;
    value: number;
    stage: string;
  } | null;
  metrics?: ClientMetrics;
  healthFlags?: ClientHealthFlag[];
  suggestedActions?: string[];

  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Legacy fields for backward compatibility
  totalRevenue?: number;
  lastInteraction?: string;
  uploads?: FileUpload[];
}

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;

  // Team and hierarchy
  teamName?: string | null; // Deprecated
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
  } | null;

  managerId?: string | null;
  manager?: {
    name: string;
    email: string;
  } | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  type: string;
  managerId?: string | null;
  manager?: User | null;
  members?: User[];
  _count?: {
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalRevenue: number;
  pipelineValue: number;
  activeClients: number;
  activeLeads: number;
  conversionRate: string;
  avgDealSize: number;
}

// AI Settings
export interface AISettings {
  id: string;
  defaultProvider: string;
  leadRiskProvider?: string | null;
  clientHealthProvider?: string | null;
  executiveSummaryProvider?: string | null;
  chatProvider?: string | null;
  anthropicKeyValid: boolean;
  openaiKeyValid: boolean;
  geminiKeyValid: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface APIKeyStatus {
  anthropic: boolean;
  openai: boolean;
  gemini: boolean;
}

// Permissions
export interface PermissionDefinition {
  key: string;
  label: string;
  module: string;
}

export interface PermissionMatrix {
  permissions: PermissionDefinition[];
  roles: string[];
  matrix: Record<string, string[]>;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}
