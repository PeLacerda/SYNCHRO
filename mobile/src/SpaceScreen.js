import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { api } from './api';
import { Button, Card, ErrorText, Muted, Title } from './ui';
import ItemsTab from './ItemsTab';
import UniverseTab from './UniverseTab';
import { colors } from './theme';

const TABS = ['Início', 'Momentos', 'Memórias', 'Descobertas', 'Universo'];

function Home({ spaceId, user, onBack }) {
  const [sp, setSp] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('GET', `/spaces/${spaceId}`).then(setSp).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [spaceId]);
  const run = (fn) => async () => { try { await fn(); } catch (e) { setError(e.message); } };
  const confirm = (msg, fn) => Alert.alert('Confirmar', msg, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sim', style: 'destructive', onPress: run(fn) }]);
  if (!sp) return <ErrorText>{error}</ErrorText>;
  const admin = sp.role === 'ADMIN';
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Title>{sp.name}</Title>
      <ErrorText>{error}</ErrorText>
      {admin && <Card><Muted>Código de convite</Muted><Text selectable style={{ color: colors.champagne, fontSize: 28, fontWeight: '800', letterSpacing: 6 }}>{sp.invite_code}</Text><Muted>Compartilhe para outras pessoas entrarem.</Muted></Card>}
      <Title>Participantes</Title>
      {sp.members.map((m) => (
        <Card key={m.id}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{m.name} <Muted>{m.role === 'ADMIN' ? '(admin)' : ''}</Muted></Text>
          {admin && m.role !== 'ADMIN' && <Button kind="danger" title="Remover" onPress={() => confirm(`Remover ${m.name}?`, async () => { await api('DELETE', `/spaces/${sp.id}/members/${m.id}`); load(); })} />}
        </Card>
      ))}
      <Button kind="ghost" title="← Trocar de espaço" onPress={onBack} />
      {admin
        ? <Button kind="danger" title="Excluir espaço" onPress={() => confirm('Excluir o espaço e todo o conteúdo?', async () => { await api('DELETE', `/spaces/${sp.id}`); onBack(); })} />
        : <Button kind="danger" title="Sair do espaço" onPress={() => confirm('Sair deste espaço?', async () => { await api('DELETE', `/spaces/${sp.id}/members/${user.id}`); onBack(); })} />}
    </ScrollView>
  );
}

export default function SpaceScreen({ spaceId, user, onBack }) {
  const [tab, setTab] = useState('Início');
  const props = { spaceId };
  return (
    <View style={{ flex: 1, paddingTop: 44 }}>
      <View style={{ flex: 1 }}>
        {tab === 'Início' && <Home spaceId={spaceId} user={user} onBack={onBack} />}
        {tab === 'Momentos' && <ItemsTab key="e" {...props} kind="events" title="Momentos" dateField="starts_at" dateLabel="Data" hasDone hasLocation />}
        {tab === 'Memórias' && <ItemsTab key="m" {...props} kind="memories" title="Memórias" dateField="happened_at" dateLabel="Data" hasLocation />}
        {tab === 'Descobertas' && <ItemsTab key="d" {...props} kind="discoveries" title="Descobertas" hasDone />}
        {tab === 'Universo' && <UniverseTab {...props} />}
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: tab === t ? colors.lavender : colors.muted, fontSize: 11, fontWeight: tab === t ? '800' : '500' }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
