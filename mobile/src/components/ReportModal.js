import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Icon from '../icons/Icon';

const REASONS = [
  { id: 'spam', label: 'Spam or fake content' },
  { id: 'harassment', label: 'Harassment or hate speech' },
  { id: 'impersonation', label: 'Impersonation or stolen identity' },
  { id: 'inappropriate', label: 'Inappropriate or explicit content' },
  { id: 'scam', label: 'Scam, phishing, or fraud' },
  { id: 'other', label: 'Other terms violation' }
];

export default function ReportModal({ visible, targetType = 'post', targetId, onClose }) {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!targetId || loading) return;
    setLoading(true);
    try {
      await api.createReport(targetType, targetId, selectedReason, description.trim());
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.warn('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          {submitted ? (
            <View style={styles.submittedContainer}>
              <View style={[styles.checkCircle, { backgroundColor: theme.colors.success }]}>
                <Icon name="check" size={28} color="#FFFFFF" />
              </View>
              <Text style={[styles.submittedTitle, { color: theme.colors.textPrimary }]}>Report Submitted</Text>
              <Text style={[styles.submittedText, { color: theme.colors.textSecondary }]}>
                Thank you for helping keep Connectly safe. Our moderation team will investigate this report.
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Report {targetType.toUpperCase()}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Why are you reporting this content?
              </Text>

              {/* Reasons List */}
              <ScrollView style={styles.reasonsList}>
                {REASONS.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: selectedReason === r.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        borderColor: selectedReason === r.id ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => setSelectedReason(r.id)}
                  >
                    <Text style={[styles.reasonText, { color: selectedReason === r.id ? theme.colors.primary : theme.colors.textPrimary }]}>
                      {r.label}
                    </Text>
                    {selectedReason === r.id && (
                      <Icon name="check" size={16} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Optional Description */}
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                placeholder="Additional details (optional)..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.danger }, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 17,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16
  },
  reasonsList: {
    maxHeight: 220,
    marginBottom: 14
  },
  reasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8
  },
  reasonText: {
    fontSize: 13.5,
    fontWeight: '500'
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    marginBottom: 16,
    textAlignVertical: 'top'
  },
  submitBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  submittedContainer: {
    alignItems: 'center',
    paddingVertical: 24
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  submittedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  submittedText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18
  }
});
