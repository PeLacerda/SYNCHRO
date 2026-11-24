import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { api } from './api';
import { Card, ErrorText, Muted, Title } from './ui';
import { colors } from './theme';

const kindColor = { memory: colors.champagne, event: colors.rose, discovery: colors.lavender };
const kindLabel = { memory: 'Memória', event: 'Momento', discovery: 'Descoberta' };

export default function UniverseTab({ spaceId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(null);
  const { width } = useWindowDimensions();
  const W = width - 40, H = W * 1.2;

  const load = useCallback(() => api('GET', `/spaces/${spaceId}/universe`).then(setData).catch((e) => setError(e.message)), [spaceId]);
  useEffect(() => { load(); }, [load]);

  const pos = (key) => data.stars.find((s) => s.key === key);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Title>Universo ✨</Title>
      <ErrorText>{error}</ErrorText>
      {data && (<>
        <Muted style={{ marginBottom: 10 }}>
          {data.stats.stars} estrela(s) · {data.stats.memories} memórias · {data.stats.eventsDone}/{data.stats.eventsTotal} momentos realizados · {data.stats.discoveriesDone} descobertas
        </Muted>
        <View style={{ width: W, height: H, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {/* linhas das constelações: segmentos desenhados com View rotacionada */}
          {data.constellations.flatMap((c) => c.edges).map(([a, b]) => {
            const p = pos(a), q = pos(b);
            const x1 = p.x * W, y1 = p.y * H, x2 = q.x * W, y2 = q.y * H;
            const len = Math.hypot(x2 - x1, y2 - y1);
            const ang = Math.atan2(y2 - y1, x2 - x1);
            return <View key={a + b} style={{ position: 'absolute', left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2, width: len, height: 1, backgroundColor: colors.lavender, opacity: 0.4, transform: [{ rotate: `${ang}rad` }] }} />;
          })}
          {data.stars.map((s) => (
            <View key={s.key} onTouchEnd={() => setPicked(s)}
              style={{ position: 'absolute', left: s.x * W - 8, top: s.y * H - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: kindColor[s.kind], opacity: picked?.key === s.key ? 1 : 0.8, borderWidth: picked?.key === s.key ? 2 : 0, borderColor: '#fff' }} />
          ))}
        </View>
        <Muted style={{ marginTop: 6 }}>🟠 memória · 🌸 momento · 🟣 descoberta — toque numa estrela.</Muted>
        {picked && <Card style={{ marginTop: 10 }}><Text style={{ color: colors.text, fontWeight: '700' }}>{picked.title}</Text><Muted>{kindLabel[picked.kind]} · {new Date(picked.date).toLocaleDateString('pt-BR')} · {picked.constellation}</Muted></Card>}
        {data.stars.length === 0 && <Muted style={{ marginTop: 10 }}>Crie memórias ou conclua momentos/descobertas para acender as primeiras estrelas.</Muted>}
      </>)}
    </ScrollView>
  );
}
