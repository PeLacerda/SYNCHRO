import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { api, setToken } from './api';
import { Button, ErrorText, Field, Muted } from './ui';
import { colors } from './theme';

export default function AuthScreen({ onLogged }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(''); setBusy(true);
    try {
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const r = await api('POST', `/auth/${mode === 'login' ? 'login' : 'register'}`, body);
      await setToken(r.token);
      onLogged(r.user);
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 40, textAlign: 'center' }}>🌙🐈‍⬛</Text>
      <Text style={{ color: colors.champagne, fontSize: 34, fontWeight: '800', textAlign: 'center', letterSpacing: 4 }}>SYNCHRO</Text>
      <Muted style={{ textAlign: 'center', marginBottom: 24 }}>Seus momentos, em sincronia.</Muted>
      {mode === 'register' && <Field placeholder="Nome" value={name} onChangeText={setName} />}
      <Field placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field placeholder="Senha (mín. 6)" secureTextEntry value={password} onChangeText={setPassword} />
      <ErrorText>{error}</ErrorText>
      {busy ? <ActivityIndicator color={colors.lavender} /> : <Button title={mode === 'login' ? 'Entrar' : 'Criar conta'} onPress={submit} />}
      <Button kind="ghost" title={mode === 'login' ? 'Não tenho conta' : 'Já tenho conta'} onPress={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }} />
    </View>
  );
}
