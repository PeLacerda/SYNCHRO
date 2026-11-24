import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { api } from './api';
import { Button, Card, ErrorText, Field, Muted, Title } from './ui';
import { colors } from './theme';

export default function SpacesScreen({ user, onOpen, onLogout }) {
  const [spaces, setSpaces] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => api('GET', '/spaces').then(setSpaces).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const run = (fn) => async () => { setError(''); try { await fn(); await load(); } catch (e) { setError(e.message); } };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
      <Title>Olá, {user.name.split(' ')[0]} ✨</Title>
      <Muted style={{ marginBottom: 14 }}>Escolha um espaço compartilhado</Muted>
      <ErrorText>{error}</ErrorText>
      {spaces.length === 0 && <Muted style={{ marginBottom: 14 }}>Você ainda não está em nenhum espaço. Crie um ou entre com um código.</Muted>}
      {spaces.map((sp) => (
        <TouchableOpacity key={sp.id} onPress={() => onOpen(sp.id)}>
          <Card>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>{sp.name}</Text>
            <Muted>{sp.member_count} participante(s) · {sp.role === 'ADMIN' ? 'administrador' : 'membro'}</Muted>
          </Card>
        </TouchableOpacity>
      ))}
      <Title>Criar espaço</Title>
      <Field placeholder="Nome do espaço" value={name} onChangeText={setName} />
      <Button title="Criar" onPress={run(async () => { await api('POST', '/spaces', { name }); setName(''); })} />
      <Title>Entrar com código</Title>
      <Field placeholder="Código de convite" autoCapitalize="characters" value={code} onChangeText={setCode} />
      <Button kind="ghost" title="Entrar" onPress={run(async () => { await api('POST', '/spaces/join', { code }); setCode(''); })} />
      <Button kind="danger" title="Sair da conta" onPress={onLogout} />
    </ScrollView>
  );
}
