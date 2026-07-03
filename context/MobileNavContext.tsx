'use client';

import { createContext, useContext, useState } from 'react';

// Mobile-only drawer state for the fixed sidebar. Provided by PortalShell /
// CoachShell; consumed by Sidebar (the drawer) and Topbar (the hamburger).
// The default is a safe no-op so Topbar can render on pages without the
// provider (login, onboarding) without crashing.
const MobileNavContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export const useMobileNav = () => useContext(MobileNavContext);
