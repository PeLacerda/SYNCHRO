// Lista + formulário reutilizável para Momentos (eventos), Memórias e Descobertas.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { api } from './api';
import { Button, Card, ErrorText, Field, Muted, Title } from './ui';
import { colors } from './theme';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');
// converte "dd/mm/aaaa" em ISO; aceita também aaaa-mm-dd
function toIso(txt) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(txt.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}T12:00:00.000Z` : txt.trim();
}

export default function ItemsTab({ spaceId, kind, title, dateField, dateLabel, hasDone, hasLocation }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', location: '', date: '', category: '' });
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(() => api('GET', `/spaces/${spaceId}/${kind}`).then(setItems).catch((e) => setError(e.message)), [spaceId, kind]);
  useEffect(() => { load(); }, [load]);
  const run = (fn) => async () => { setError(''); try { await fn(); await load(); } catch (e) { setError(e.message); } };

  const create = run(async () => {
    const body = { title: form.title, description: form.description, category: form.category };
    if (hasLocation) body.location = form.location;
    if (dateField) body[dateField] = toIso(form.date);
    await api('POST', `/spaces/${spaceId}/${kind}`, body);
    setForm({ title: '', description: '', location: '', date: '', category: '' });
  });
  const confirmDelete = (it) => Alert.alert('Excluir', `Excluir "${it.title}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: run(() => api('DELETE', `/${kind}/${it.id}`)) },
  ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Title>{title}</Title>
      <ErrorText>{error}</ErrorText>
      {items.length === 0 && <Muted style={{ marginBottom: 12 }}>Nada por aqui ainda.</Muted>}
      {items.map((it) => (
        <Card key={it.id}>
          <Text style={{ color: it.done ? colors.success : colors.text, fontSize: 16, fontWeight: '700' }}>{it.done ? '✓ ' : ''}{it.title}</Text>
          <Muted>{[dateField && fmt(it[dateField]), it.location, it.category].filter(Boolean).join(' · ')}</Muted>
          {!!it.description && <Text style={{ color: colors.text, marginTop: 6 }}>{it.description}</Text>}
          {!!it.author && <Muted style={{ marginTop: 4 }}>por {it.author}</Muted>}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {hasDone && <View style={{ flex: 1 }}><Button kind="ghost" title={it.done ? 'Reabrir' : 'Concluir'} onPress={run(() => api('PATCH', `/${kind}/${it.id}`, { done: !it.done }))} /></View>}
            {kind === 'discoveries' && it.done && <View style={{ flex: 1 }}><Button kind="ghost" title="Virar memória" onPress={run(() => api('POST', `/discoveries/${it.id}/to-memory`))} /></View>}
            <View style={{ flex: 1 }}><Button kind="danger" title="Excluir" onPress={() => confirmDelete(it)} /></View>
          </View>
        </Card>
      ))}
      <Title>Adicionar</Title>
      <Field placeholder="Título" value={form.title} onChangeText={set('title')} />
      {dateField && <Field placeholder={`${dateLabel} (dd/mm/aaaa)`} value={form.date} onChangeText={set('date')} />}
      {hasLocation && <Field placeholder="Local (opcional)" value={form.location} onChangeText={set('location')} />}
      <Field placeholder="Categoria (ex.: Viagem, Comida)" value={form.category} onChangeText={set('category')} />
      <Field placeholder="Descrição (opcional)" value={form.description} onChangeText={set('description')} multiline />
      <Button title="Salvar" onPress={create} />
    </ScrollView>
  );
}
