import { useCallback, useEffect, useState } from 'react';
import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { AuthScreen } from './components/Auth/AuthScreen.jsx';
import { ExplorerScreen } from './pages/ExplorerScreen.jsx';
import { ScreenTransition } from './components/Layout/ScreenTransition.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useColorScheme } from './hooks/useColorScheme.js';
import { services } from './services/container.js';
import './styles/app.css';

/**
 * Root component.
 *
 * Three screens - boot, auth, explorer - are swapped through
 * `ScreenTransition`, which cross-fades them rather than cutting. `boot` exists
 * so the auth screen never flashes at a user whose Firebase session is still
 * being restored from IndexedDB.
 *
 * The catalogue download is kicked off here, before sign-in completes: by the
 * time someone has typed their password the models are usually already cached,
 * which is what makes the explorer appear fully populated.
 */
export default function App() {
  const { user, ready, signOut } = useAuth();
  const [colorScheme, toggleColorScheme] = useColorScheme();
  const [online, setOnline] = useState(services.repository.isOnline);

  useEffect(() => {
    services.start();
    return services.repository.on('network', (state) => setOnline(state.online));
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const screen = !ready ? 'boot' : user ? 'explorer' : 'auth';

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme} locale="en-US" UNSAFE_className="app-provider">
      <ScreenTransition screenKey={screen}>
        {(current) =>
          current === 'boot' ? (
            <BootScreen />
          ) : current === 'explorer' ? (
            <ExplorerScreen
              user={user}
              onSignOut={handleSignOut}
              colorScheme={colorScheme}
              onToggleTheme={toggleColorScheme}
            />
          ) : (
            <AuthScreen online={online} />
          )
        }
      </ScreenTransition>
    </Provider>
  );
}

function BootScreen() {
  return (
    <div className="boot">
      <div className="boot__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="boot__label">Restoring your session…</p>
    </div>
  );
}
