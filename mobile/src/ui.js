import React from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from './theme';

export const Title = ({ children }) => <Text style={s.title}>{children}</Text>;
export const Muted = ({ children, style }) => <Text style={[s.muted, style]}>{children}</Text>;
export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
export const Field = (props) => (
  <TextInput placeholderTextColor={colors.muted} {...props} style={[s.input, props.style]} />
);
export const Button = ({ title, onPress, kind = 'primary', disabled }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}
    style={[s.btn, kind === 'ghost' && s.btnGhost, kind === 'danger' && s.btnDanger, disabled && { opacity: 0.5 }]}>
    <Text style={[s.btnText, kind !== 'primary' && { color: kind === 'danger' ? colors.error : colors.lavender }]}>{title}</Text>
  </TouchableOpacity>
);
export const ErrorText = ({ children }) => (children ? <Text style={s.error}>{children}</Text> : null);

const s = StyleSheet.create({
  title: { color: colors.champagne, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  muted: { color: colors.muted, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, color: colors.text, padding: 12, marginBottom: 10, fontSize: 16 },
  btn: { backgroundColor: colors.lavender, borderRadius: 12, padding: 13, alignItems: 'center', marginBottom: 10 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.lavender },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.error },
  btnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
  error: { color: colors.error, marginBottom: 10 },
});
