export interface Announcement {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  accentColor?: string; // default = accent, pass CSS var for others
}

export interface VideoClip {
  id: string;
  tag: string;
  title: string;
  meta: string;
  url?: string;
}

export interface Supplement {
  id: string;
  icon: string;
  name: string;
  description: string;
  essential: boolean;
  url?: string;
}

export interface Recommendation {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export interface Webinar {
  id: string;
  month: string;
  day: string;
  title: string;
  meta: string;
  recorded?: boolean;
  recordedDate?: string;
  tag?: string;
  url?: string;
}

export interface PdfResource {
  id: string;
  title: string;
  meta: string;
  url?: string;
}

export interface CoachMessage {
  id: string;
  fromInitials: string;
  from: string;
  time: string;
  body: string;
  unread: boolean;
}

export type PaymentStatus = 'Paid' | 'Due' | 'Overdue';
export type ClientStatus = 'Active' | 'Paused';

export interface Client {
  id: string;
  name: string;
  initials: string;
  since: string;
  goal: string;
  duration: string;
  status: ClientStatus;
  payment: PaymentStatus;
  lastLogin: string;
  msgRead: boolean;
  healthScore: number;
  referrals: number;
  notes: string;
}

export interface RevenueRow {
  id: string;
  month: string;
  clients: number;
  mrr: string;
  status: 'In progress' | 'Complete';
}

export type OnboardingStepType = 'video' | 'doc' | 'action';

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  description: string;
  duration?: string;
  actionLabel?: string;
}
