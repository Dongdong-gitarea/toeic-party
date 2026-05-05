// Tiny wrapper around navigator.vibrate so call-sites stay readable and
// the no-op fallback is safe for desktop / unsupported browsers.

type Pattern = 'tap' | 'success' | 'error' | 'heavy';

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 10,
  success: [12, 40, 18],
  error: [30, 60, 30],
  heavy: 40,
};

export function haptic(p: Pattern) {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    const pattern = PATTERNS[p];
    if (typeof pattern === 'number') navigator.vibrate(pattern);
    else navigator.vibrate(pattern);
  } catch {
    // Some browsers throw on unsupported patterns
  }
}
