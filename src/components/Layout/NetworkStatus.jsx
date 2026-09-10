import { useEffect, useState } from 'react';
import { Button, Flex, Text } from '@adobe/react-spectrum';

/**
 * Connection indicator + the banner that drops in when the state flips.
 *
 * The brief says the app will be switched between online and offline at random
 * and the UI has to say which it is, so this deliberately does two things:
 * a permanent pill in the header (always answerable at a glance) and a
 * transient banner on *transitions* (impossible to miss). The banner
 * auto-dismisses when we come back online and stays put while offline.
 */
export function NetworkPill({ online }) {
  return (
    <div
      className={`net-pill ${online ? 'net-pill--online' : 'net-pill--offline'}`}
      role="status"
      aria-live="polite"
    >
      <span className="net-pill__dot" aria-hidden="true" />
      <span className="net-pill__label">{online ? 'Online' : 'Offline'}</span>
    </div>
  );
}

export function NetworkBanner({ online, origin, onRetry }) {
  const [visible, setVisible] = useState(!online);
  const [lastOnline, setLastOnline] = useState(online);

  // Adjusting state during render (the React-documented pattern for reacting
  // to a changed prop) rather than in an effect: the banner appears on the same
  // commit as the connectivity flip, with no extra render pass.
  if (lastOnline !== online) {
    setLastOnline(online);
    setVisible(true);
  }

  useEffect(() => {
    // Going offline is a standing condition, so that banner stays until it is
    // resolved. Reconnecting is a one-off event: say it once, then get out of
    // the way.
    if (!visible || !online) return undefined;
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [visible, online]);

  if (!visible) return null;

  return (
    <div className={`net-banner ${online ? 'net-banner--online' : 'net-banner--offline'}`} role="status">
      <Flex alignItems="center" gap="size-150" wrap>
        <span className="net-banner__icon" aria-hidden="true">
          {online ? '↺' : '⚡'}
        </span>
        <Text UNSAFE_className="net-banner__text">
          {online
            ? 'Back online — refreshing the catalogue in the background.'
            : origin === 'cache' || origin === 'network'
              ? 'You are offline. Showing the last verified catalogue snapshot — search, filters and sorting all still work.'
              : 'You are offline and no catalogue has been cached yet. Reconnect once to download it.'}
        </Text>
        {!online && onRetry ? (
          <Button variant="secondary" style="outline" onPress={onRetry}>
            Retry now
          </Button>
        ) : null}
      </Flex>
    </div>
  );
}
