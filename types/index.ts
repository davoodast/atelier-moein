export interface User {
  id: number;
  username: string;
  email: string | null;
  phone?: string | null;
  role: string;
  isSystem?: boolean;
  bankAccount?: string | null;
  permissions?: string[];
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface Ceremony {
  id: number;
  type: string | null;
  groom_name: string | null;
  bride_name: string | null;
  date_jalali: string | null;
  time: string | null;
  address: string | null;
  plan_details: string | null;
  total_amount: number | null;
  advance_paid: number | null;
  status: string;
  plan_id: number | null;
  ceremony_mode: string | null;
  created_at?: string;
}

export interface Employee {
  id: number;
  user_id: number;
  username: string;
  email: string | null;
  phone: string | null;
  bank_account: string | null;
  position: string | null;
  salary: number | null;
  status: string;
  start_date: string | null;
  role?: string | null;
}

export interface Plan {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  features: string;
  is_active: number;
}

export interface SiteSettings {
  company_name: string;
  about_us: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  logo: string | null;
}
