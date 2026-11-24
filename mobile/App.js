import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, loadToken, setToken } from './src/api';
import { colors } from './src/theme';
import AuthScreen from './src/AuthScreen';
import SpacesScreen from './src/SpacesScreen';
import SpaceScreen from './src/SpaceScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [spaceId, setSpaceId] = useState(null);

  useEffect(() => {
    (async () => {
      if (await loadToken()) { try { setUser((await api('GET', '/auth/me')).user); } catch { await setToken(null); } }
      setReady(true);
    })();
  }, []);

  const logout = async () => { await setToken(null); setUser(null); setSpaceId(null); };

  let body;
  if (!ready) body = <ActivityIndicator style={{ flex: 1 }} color={colors.lavender} />;
  else if (!user) body = <AuthScreen onLogged={setUser} />;
  else if (!spaceId) body = <SpacesScreen user={user} onOpen={setSpaceId} onLogout={logout} />;
  else body = <SpaceScreen spaceId={spaceId} user={user} onBack={() => setSpaceId(null)} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {body}
    </View>
  );
}
