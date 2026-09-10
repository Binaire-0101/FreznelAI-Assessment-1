import {
  ActionButton,
  Flex,
  Item,
  Menu,
  MenuTrigger,
  Text,
  Tooltip,
  TooltipTrigger,
} from '@adobe/react-spectrum';
import { NetworkPill } from './NetworkStatus.jsx';

/**
 * Application header: identity on the left, live state in the middle, account
 * controls on the right. The refresh button is disabled offline rather than
 * hidden, so the affordance stays where the user expects it.
 */
export function AppHeader({
  user,
  online,
  status,
  pointer,
  colorScheme,
  onToggleTheme,
  onRefresh,
  onSignOut,
}) {
  const busy = status === 'loading' || status === 'refreshing';
  const initials = (user && (user.displayName || user.email) ? (user.displayName || user.email) : '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="app-header">
      <Flex alignItems="center" gap="size-150" UNSAFE_className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true" />
        <div>
          <div className="app-header__title">Model Finder</div>
          <div className="app-header__subtitle">
            {pointer && pointer.count ? `${pointer.count.toLocaleString()} models indexed` : 'Loading catalogue…'}
          </div>
        </div>
      </Flex>

      <Flex alignItems="center" gap="size-125" UNSAFE_className="app-header__actions">
        <NetworkPill online={online} />

        <TooltipTrigger delay={300}>
          <ActionButton
            isQuiet
            aria-label="Refresh catalogue"
            isDisabled={!online || busy}
            onPress={onRefresh}
            UNSAFE_className={busy ? 'is-spinning' : ''}
          >
            <span aria-hidden="true">⟳</span>
          </ActionButton>
          <Tooltip>
            {online ? 'Download a fresh catalogue snapshot' : 'Unavailable while offline'}
          </Tooltip>
        </TooltipTrigger>

        <TooltipTrigger delay={300}>
          <ActionButton isQuiet aria-label="Toggle colour scheme" onPress={onToggleTheme}>
            <span aria-hidden="true">{colorScheme === 'dark' ? '☾' : '☀'}</span>
          </ActionButton>
          <Tooltip>Switch to {colorScheme === 'dark' ? 'light' : 'dark'} theme</Tooltip>
        </TooltipTrigger>

        <MenuTrigger align="end">
          <ActionButton isQuiet aria-label="Account menu" UNSAFE_className="app-header__avatar-button">
            <span className="app-header__avatar" aria-hidden="true">
              {initials}
            </span>
            <Text UNSAFE_className="app-header__username">
              {user ? user.displayName || user.email : ''}
            </Text>
          </ActionButton>
          <Menu
            onAction={(key) => {
              if (key === 'signOut') onSignOut();
            }}
          >
            <Item key="signOut" textValue="Sign out">
              <Text>Sign out</Text>
            </Item>
          </Menu>
        </MenuTrigger>
      </Flex>
    </header>
  );
}
