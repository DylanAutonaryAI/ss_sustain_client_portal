'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CommunityEvent, EventType } from '@/lib/types';

function initials(name: string) {
  return (name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

interface CommunityContextValue {
  events: CommunityEvent[];
  myUserId: string | null;
  loading: boolean;
  rsvp: (eventId: string, status: 'attending' | 'declined', reason?: string) => void;
  addEvent: (event: Omit<CommunityEvent, 'id' | 'rsvps'>) => void;
  updateEvent: (id: string, updates: Partial<Omit<CommunityEvent, 'id' | 'rsvps'>>) => void;
  deleteEvent: (id: string) => void;
  pendingCount: number;
}

const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents]     = useState<CommunityEvent[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName]     = useState<string>('You');
  const [loading, setLoading]   = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/community', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
        setMyUserId(data.myUserId ?? null);
        if (data.myName) setMyName(data.myName);
      }
    } catch {
      /* ignore — keep whatever we have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const today = new Date().toISOString().slice(0, 10);

  const pendingCount = events.filter(ev => {
    if (ev.date < today) return false;
    const mine = myUserId ? ev.rsvps.find(r => r.clientId === myUserId) : null;
    return !mine || mine.status === 'pending';
  }).length;

  function rsvp(eventId: string, status: 'attending' | 'declined', reason?: string) {
    if (!myUserId) return;
    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev;
      const entry = {
        clientId: myUserId!,
        clientName: myName,
        clientInitials: initials(myName),
        status,
        reason: status === 'declined' ? reason : undefined,
      };
      const has = ev.rsvps.some(r => r.clientId === myUserId);
      return {
        ...ev,
        rsvps: has ? ev.rsvps.map(r => r.clientId === myUserId ? entry : r) : [...ev.rsvps, entry],
      };
    }));
    fetch('/api/community', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, status, reason }),
    }).catch(() => {});
  }

  function addEvent(event: Omit<CommunityEvent, 'id' | 'rsvps'>) {
    const id = `ev-${Date.now()}`;
    const newEvent: CommunityEvent = { ...event, id, rsvps: [] };
    setEvents(prev => [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
    fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, id }),
    }).catch(() => {});
  }

  function updateEvent(id: string, updates: Partial<Omit<CommunityEvent, 'id' | 'rsvps'>>) {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
    fetch('/api/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(() => {});
  }

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(ev => ev.id !== id));
    fetch(`/api/community?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  }

  return (
    <CommunityContext.Provider value={{ events, myUserId, loading, rsvp, addEvent, updateEvent, deleteEvent, pendingCount }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be used within CommunityProvider');
  return ctx;
}

export const EVENT_STYLES: Record<EventType, { label: string; color: string }> = {
  'live-call': { label: 'Live Call',  color: '#20B623' },
  'q-and-a':   { label: 'Q&A',       color: '#3b82f6' },
  'workshop':  { label: 'Workshop',  color: '#8b5cf6' },
  'challenge': { label: 'Challenge', color: '#f59e0b' },
  'social':    { label: 'Social',    color: '#ec4899' },
};
