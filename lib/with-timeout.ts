// Race a promise against a timeout so a wedged network call can never pin a
// button/spinner forever (the "Signing in…" bug class). The losing branch is
// still observed by Promise.race, so a late rejection can't surface as
// unhandled-rejection noise. NOTE: this does not abort the underlying request —
// it may still complete in the background.
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
