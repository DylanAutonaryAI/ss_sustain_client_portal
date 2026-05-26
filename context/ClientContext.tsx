'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clients as seedClients } from '@/lib/mock-data/clients';
import type { Client, PaymentStatus } from '@/lib/types';

// ─── Payment status derived from date ────────────────────────────────────────

export function calcPaymentStatus(nextPaymentDate?: string): PaymentStatus {
  if (!nextPaymentDate) return 'Paid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextPaymentDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'Overdue';
  if (diffDays <= 3) return 'Due';
  return 'Paid';
}

export function daysUntilPayment(nextPaymentDate?: string): number | null {
  if (!nextPaymentDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextPaymentDate);
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Advance the date by 30 days
export function nextMonthDate(from?: string): string {
  const base = from ? new Date(from) : new Date();
  base.setDate(base.getDate() + 30);
  return base.toISOString().slice(0, 10);
}

// ─── Health score ─────────────────────────────────────────────────────────────

export function calcHealthScore(c: Client): number {
  let score = 0;
  const login = c.lastLogin.toLowerCase();
  if (login === 'today' || login === '1 day ago') score += 40;
  else if (login.includes('days') && parseInt(login) < 7) score += 20;
  if (c.msgRead) score += 30;
  const pay = calcPaymentStatus(c.nextPaymentDate);
  if (pay === 'Paid') score += 30;
  else if (pay === 'Due') score += 15;
  return score;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ClientContextValue {
  clients: Client[];
  addClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  markPaid: (id: string) => void;
}

const ClientContext = createContext<ClientContextValue | null>(null);

const STORAGE_KEY = 'ss-clients-v1';

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setClients(stored ? JSON.parse(stored) : seedClients);
    } catch {
      setClients(seedClients);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients, initialized]);

  const addClient = (c: Client) => setClients(prev => [...prev, c]);

  const updateClient = (id: string, patch: Partial<Client>) =>
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const markPaid = (id: string) =>
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = nextMonthDate(c.nextPaymentDate);
      return { ...c, nextPaymentDate: next, payment: 'Paid' };
    }));

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, markPaid }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClients must be inside ClientProvider');
  return ctx;
}
