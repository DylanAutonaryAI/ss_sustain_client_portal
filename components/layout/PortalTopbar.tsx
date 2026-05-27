'use client';

import Topbar from './Topbar';
import { useMyPhaseWeek } from '@/lib/my-client';

// Portal-only Topbar: same look as Topbar, but the status pill is the signed-in
// client's real "<phase> · Week N" — derived once from their own record instead
// of being hardcoded on every page. While it loads, the pill is simply hidden.
export default function PortalTopbar({ title }: { title: string }) {
  const { statusLabel } = useMyPhaseWeek();
  return <Topbar title={title} statusLabel={statusLabel} />;
}
