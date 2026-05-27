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
  nextPaymentDate?: string; // YYYY-MM-DD — drives auto Paid/Due/Overdue
  programStart?: string; // YYYY-MM-DD — start of current phase; drives the portal week count
  // Synced from the client's own profile (profiles table) when they have a login
  avatarUrl?: string;
  nickname?: string;
  birthday?: string; // YYYY-MM-DD
  // Onboarding progress (from onboarding_progress + clients.onboarding_completed_at)
  onboardingCompletedAt?: string; // ISO timestamp; set = fully onboarded
  onboardingStepsDone?: number;   // count of steps finished so far
}

export interface RevenueRow {
  id: string;
  month: string;
  clients: number;
  mrr: string;
  status: 'In progress' | 'Complete';
}

export interface Payment {
  id: string;
  client_id: string | null;
  client_name: string;
  amount: number;
  status: PaymentStatus;
  paid_at: string; // YYYY-MM-DD
}

export interface MindsetTip {
  id: string;
  title: string;
  body: string;
}

export interface GymBagItem {
  id: string;
  name: string;
  desc: string;
  linkLabel: string;
  linkUrl: string;
}

export type ShoppingCategory = 'Protein' | 'Carbs' | 'Fats' | 'Other';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
}

export interface NonNegotiable {
  id: string;
  label: string;
  desc: string;
}

export interface PosingVideo {
  id: string;
  label: string;
  youtubeUrl: string;
}

export interface PosingTip {
  id: string;
  key: string;
  body: string;
}

export type OnboardingStepType = 'video' | 'doc' | 'action';

export interface OnboardingStep {
  id: string; // stable key — referenced by onboarding_progress rows; never rename
  type: OnboardingStepType;
  title: string;
  description: string;
  duration?: string;
  actionLabel?: string;
  url?: string;
  placeholder?: boolean; // true = still needs Sam's real video/link/PDF
}

export type EventType = 'live-call' | 'q-and-a' | 'workshop' | 'challenge' | 'social';

export interface EventRSVP {
  clientId: string;
  clientName: string;
  clientInitials: string;
  status: 'attending' | 'declined' | 'pending';
  reason?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;      // YYYY-MM-DD
  time: string;      // e.g. '7:00 PM BST'
  duration: string;  // e.g. '60 min'
  link?: string;
  rsvps: EventRSVP[];
}
