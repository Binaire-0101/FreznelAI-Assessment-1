import { useEffect, useState } from 'react';

/**
 * Cross-fade between top-level screens.
 *
 * React unmounts the old tree the instant the screen changes, so playing an
 * exit animation means rendering the *previous* screen for a moment longer.
 * Rather than stashing React elements in state (which would go stale), this
 * component takes a render function and simply keeps calling it with the old
 * key until the exit animation has finished.
 *
 * The `screenKey !== shown` check runs during render - the documented React
 * pattern for adjusting state when props change - so the exit starts on the
 * same commit as the prop change, with no extra render pass.
 *
 * `prefers-reduced-motion` is honoured by the stylesheet, which collapses both
 * animations to near-zero duration; the state machine still runs.
 *
 * @param {object} props
 * @param {string} props.screenKey  identifier of the screen to show
 * @param {Function} props.children render function: (key) => ReactNode
 */
export function ScreenTransition({ screenKey, duration = 320, children }) {
  const [shown, setShown] = useState(screenKey);
  const [phase, setPhase] = useState('enter');

  if (screenKey !== shown && phase !== 'exit') {
    setPhase('exit');
  }

  useEffect(() => {
    if (phase !== 'exit') return undefined;
    const timer = setTimeout(() => {
      setShown(screenKey);
      setPhase('enter');
    }, duration);
    return () => clearTimeout(timer);
  }, [phase, screenKey, duration]);

  return (
    <div
      className={`screen-transition screen-transition--${phase}`}
      style={{ '--screen-duration': `${duration}ms` }}
      data-screen={shown}
    >
      {children(shown)}
    </div>
  );
}
