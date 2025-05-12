export enum UserRole {
  SUPER_ADMIN = "super_admin",
  SA_MANAGER = "sa_manager",
  PROPERTY_ADMIN = "property_admin",
  ESTATE_MANAGER = "estate_manager",
  HELPDESK = "helpdesk",
  ELECTRICIAN = "electrician",
  FIRE_OPERATOR = "fire_operator",
  GARDENER = "gardener",
  GAS_BANK_OPERATOR = "gas_bank_operator",
  HOUSEKEEPING_STAFF = "housekeeping_staff",
  HOUSEKEEPING_SUPERVISOR = "housekeeping_supervisor",
  LIFT_TECHNICIAN = "lift_technician",
  MC_CORE_TEAM = "mc_core_team",
  MULTI_TECHNICIAN = "multi_technician",
  PEST_CONTROL = "pest_control",
  PLUMBER = "plumber",
  POOL_OPERATOR = "pool_operator",
  SECURITY_STAFF = "security_staff",
  SECURITY_SUPERVISOR = "security_supervisor",
  STP_OPERATOR = "stp_operator",
  STP_SUPERVISOR = "stp_supervisor"
}

export enum TaskStatus {
  ACTIVE = "active",
  COMPLETE = "complete",
  DEFAULT = "default"
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  property_id?: number;
  property_name?: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: number;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Task {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  deadline_time: string;
  description?: string;
  assigned_to?: number;
  assigned_user_name?: string;
  is_daily: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskStatusLog {
  id: number;
  task_id: number;
  task_name: string;
  user_id: number;
  user_name: string;
  status: TaskStatus;
  message?: string;
  image_url?: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  task_id: number;
  task_name: string;
  user_id: number;
  user_name: string;
  status: TaskStatus;
  message?: string;
  image_url?: string;
  timestamp: string;
}

export interface DashboardSummary {
  total_users: number;
  total_companies: number;
  total_tasks: number;
  completed_tasks_today: number;
  pending_tasks_today: number;
  recent_activities: {
    id: number;
    task_name: string;
    status: TaskStatus;
    user_name: string;
    timestamp: string;
  }[];
}