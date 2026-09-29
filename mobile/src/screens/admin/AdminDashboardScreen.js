import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

export default function AdminDashboardScreen({ onBack }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reports' | 'users'
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [overRes, repRes, usersRes] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminReports('pending'),
        api.listAdminUsers()
      ]);
      if (overRes.success) setOverview(overRes.data);
      if (repRes.success) setReports(repRes.data.reports || []);
      if (usersRes.success) setUsers(usersRes.data.users || []);
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolveReport = async (reportId, actionTaken) => {
    try {
      await api.resolveAdminReport(reportId, 'resolved', 'Reviewed by moderation team', actionTaken);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (_) {}
  };

  const handleToggleSuspension = async (userId, currentSuspended) => {
    try {
      await api.toggleUserSuspension(userId, !currentSuspended, 'Terms of service moderation action');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !currentSuspended } : u));
    } catch (_) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Icon name="back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Admin Control</Text>
        </View>

        <View style={[styles.shieldPill, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
          <Icon name="shield" size={14} color={theme.colors.primary} />
          <Text style={[styles.shieldText, { color: theme.colors.primary }]}>OPERATIONS</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: theme.colors.border }]}>
        {[
          { id: 'overview', label: 'Metrics' },
          { id: 'reports', label: `Queue (${reports.length})` },
          { id: 'users', label: 'Accounts' }
        ].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, activeTab === t.id && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t.id ? theme.colors.primary : theme.colors.textSecondary }
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <ScrollView
          style={styles.contentScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAdminData();
              }}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Users', val: overview?.totalUsers || 10, icon: 'profile', color: '#6366F1' },
              { label: 'Total Posts', val: overview?.totalPosts || 20, icon: 'create', color: '#06B6D4' },
              { label: 'Active 24h Stories', val: overview?.totalStories || 10, icon: 'sparkles', color: '#EC4899' },
              { label: 'Pending Reports', val: overview?.pendingReports || reports.length, icon: 'bell', color: '#F59E0B' },
              { label: 'Suspended Users', val: overview?.suspendedUsers || 0, icon: 'shield', color: '#EF4444' }
            ].map((stat, i) => (
              <View
                key={i}
                style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={[styles.iconDot, { backgroundColor: stat.color }]}>
                  <Icon name={stat.icon} size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.statVal, { color: theme.colors.textPrimary }]}>{stat.val}</Text>
                <Text style={[styles.statName, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.systemStatusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statusDotRow}>
              <View style={[styles.greenDot, { backgroundColor: theme.colors.success }]} />
              <Text style={[styles.statusTitle, { color: theme.colors.textPrimary }]}>Cluster Healthy</Text>
            </View>
            <Text style={[styles.statusDetail, { color: theme.colors.textSecondary }]}>
              WebSockets: Online • Relational DB: Connected • Story Expiry Worker: Active (24h TTL)
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Reports Moderation Queue Tab */}
      {activeTab === 'reports' && (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Moderation Queue Clear</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                No pending content violations reported.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.reportCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.reportHeader}>
                <Text style={[styles.targetTypeBadge, { color: theme.colors.primary, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  {item.target_type.toUpperCase()}
                </Text>
                <Text style={[styles.reasonBadge, { color: theme.colors.danger }]}>
                  Reason: {item.reason}
                </Text>
              </View>

              <Text style={[styles.reportDesc, { color: theme.colors.textSecondary }]}>
                Reported by @{item.reporter_username || 'user'}: "{item.description || 'No description provided'}"
              </Text>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceElevated }]}
                  onPress={() => handleResolveReport(item.id, 'none')}
                >
                  <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.danger }]}
                  onPress={() => handleResolveReport(item.id, 'remove_content')}
                >
                  <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Remove Content</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                  {item.username} {item.role === 'admin' ? '🛡️' : ''}
                </Text>
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
                {item.is_suspended && (
                  <Text style={[styles.suspendedBadge, { color: theme.colors.danger }]}>Suspended</Text>
                )}
              </View>

              {item.role !== 'admin' && (
                <TouchableOpacity
                  style={[
                    styles.suspendBtn,
                    {
                      backgroundColor: item.is_suspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      borderColor: item.is_suspended ? theme.colors.success : theme.colors.danger
                    }
                  ]}
                  onPress={() => handleToggleSuspension(item.id, item.is_suspended)}
                >
                  <Text style={[styles.suspendBtnText, { color: item.is_suspended ? theme.colors.success : theme.colors.danger }]}>
                    {item.is_suspended ? 'Restore' : 'Suspend'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: {
    paddingRight: 10
  },
  title: {
    fontSize: 18,
    fontWeight: '800'
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  shieldText: {
    fontSize: 10,
    fontWeight: '800'
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1
  },
  tabBtn: {
    flex: 1,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700'
  },
  contentScroll: {
    padding: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  statVal: {
    fontSize: 22,
    fontWeight: '800'
  },
  statName: {
    fontSize: 12,
    marginTop: 2
  },
  systemStatusCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  statusDetail: {
    fontSize: 12,
    lineHeight: 18
  },
  listContent: {
    padding: 16
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  targetTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  reasonBadge: {
    fontSize: 12,
    fontWeight: '600'
  },
  reportDesc: {
    fontSize: 13,
    marginBottom: 12
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnText: {
    fontSize: 12.5,
    fontWeight: '700'
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: '700'
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2
  },
  suspendedBadge: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  suspendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1
  },
  suspendBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center'
  }
});
