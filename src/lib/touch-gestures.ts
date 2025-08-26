/**
 * Touch gesture utilities for mobile documentation interface
 */

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface TouchGestureOptions {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  minSwipeVelocity?: number;
  preventScroll?: boolean;
}

const DEFAULT_OPTIONS: Required<TouchGestureOptions> = {
  minSwipeDistance: 50,
  maxSwipeTime: 1000,
  minSwipeVelocity: 0.1,
  preventScroll: false
};

/**
 * Hook for handling touch gestures
 */
export function useTouchGestures(
  onSwipe?: (gesture: SwipeGesture) => void,
  onTap?: (point: TouchPoint) => void,
  options: TouchGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let touchStart: TouchPoint | null = null;
  let touchEnd: TouchPoint | null = null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (opts.preventScroll) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    touchEnd = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    if (opts.preventScroll) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    touchEnd = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    if (opts.preventScroll) {
      e.preventDefault();
    }

    const endTime = Date.now();
    const finalTouch = touchEnd || {
      x: touchStart.x,
      y: touchStart.y,
      timestamp: endTime
    };

    const distanceX = touchStart.x - finalTouch.x;
    const distanceY = touchStart.y - finalTouch.y;
    const duration = endTime - touchStart.timestamp;
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const velocity = totalDistance / duration;

    // Check if it's a tap (minimal movement and short duration)
    if (totalDistance < 10 && duration < 300) {
      onTap?.(touchStart);
      return;
    }

    // Check if it's a valid swipe
    if (
      totalDistance >= opts.minSwipeDistance &&
      duration <= opts.maxSwipeTime &&
      velocity >= opts.minSwipeVelocity
    ) {
      let direction: SwipeGesture['direction'];

      // Determine primary direction
      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        direction = distanceX > 0 ? 'left' : 'right';
      } else {
        direction = distanceY > 0 ? 'up' : 'down';
      }

      const gesture: SwipeGesture = {
        direction,
        distance: totalDistance,
        velocity,
        duration
      };

      onSwipe?.(gesture);
    }

    // Reset
    touchStart = null;
    touchEnd = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - legacy property
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get optimal touch target size based on device
 */
export function getTouchTargetSize(): number {
  if (typeof window === 'undefined') return 44;
  
  // iOS recommends 44px, Android recommends 48dp
  // Use 48px as a safe default for mobile
  return isTouchDevice() ? 48 : 32;
}

/**
 * Add touch-friendly CSS classes
 */
export function getTouchClasses(isMobile: boolean = false): string {
  if (!isMobile && typeof window !== 'undefined') {
    isMobile = isTouchDevice();
  }

  return isMobile 
    ? 'touch-manipulation select-none' 
    : '';
}

/**
 * Prevent default touch behaviors for custom gestures
 */
export function preventTouchDefaults(element: HTMLElement) {
  element.style.touchAction = 'none';
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  // @ts-expect-error - legacy property
  element.style.msUserSelect = 'none';
}

/**
 * Restore default touch behaviors
 */
export function restoreTouchDefaults(element: HTMLElement) {
  element.style.touchAction = '';
  element.style.userSelect = '';
  element.style.webkitUserSelect = '';
  // @ts-expect-error - legacy property
  element.style.msUserSelect = '';
}

/**
 * Debounce touch events to prevent excessive firing
 */
export function debounceTouchEvent<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number = 16
): T {
  let timeout: NodeJS.Timeout;
  
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Handle momentum scrolling on iOS
 */
export function enableMomentumScrolling(element: HTMLElement) {
  // @ts-expect-error - webkit property
  element.style.webkitOverflowScrolling = 'touch';
  // @ts-expect-error - non-standard property
  element.style.overflowScrolling = 'touch';
}

/**
 * Disable momentum scrolling on iOS
 */
export function disableMomentumScrolling(element: HTMLElement) {
  // @ts-expect-error - webkit property
  element.style.webkitOverflowScrolling = 'auto';
  // @ts-expect-error - non-standard property
  element.style.overflowScrolling = 'auto';
}