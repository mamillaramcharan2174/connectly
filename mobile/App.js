import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider, useSocket } from './src/context/SocketContext';

// Navigation & Tab Bar
import BottomTabBar from './src/navigation/BottomTabBar';

// Screens
import HomeScreen from './src/screens/feed/HomeScreen';
import SearchScreen from './src/screens/search/SearchScreen';
import CreatePostScreen from './src/screens/post/CreatePostScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';
import ConversationListScreen from './src/screens/chat/ConversationListScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Common Components
import Toast from './src/components/Toast';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = WINDOW_WIDTH > 768;

function MainApp() {
  const { theme, isDark } = useTheme();
  const { user, loading } = useAuth();
  const { toastMessage, clearToast } = useSocket();

  // Navigation state
  const [activeTab, setActiveTab] = useState('home');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [activeSubscreen, setActiveSubscreen] = useState(null); // 'messages' | 'chat' | 'settings' | 'editProfile' | 'admin' | 'userProfile'
  const [chatParams, setChatParams] = useState(null);
  const [targetProfileUsername, setTargetProfileUsername] = useState(null);

  // If session is loading
  if (loading) {
    return <View style={[styles.centerScreen, { backgroundColor: theme.colors.background }]} />;
  }

  // If user is not authenticated -> show Auth Flows
  if (!user) {
    return (
      <SafeAreaView style={[styles.rootContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={IS_DESKTOP ? styles.desktopWrapper : styles.fullWrapper}>
          {authView === 'login' && (
            <LoginScreen
              onNavigateRegister={() => setAuthView('register')}
              onNavigateForgot={() => setAuthView('forgot')}
            />
          )}
          {authView === 'register' && (
            <RegisterScreen
              onNavigateLogin={() => setAuthView('login')}
            />
          )}
          {authView === 'forgot' && (
            <ForgotPasswordScreen
              onNavigateLogin={() => setAuthView('login')}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Navigation handlers
  const handleOpenMessages = () => setActiveSubscreen('messages');
  const handleOpenNotifications = () => setActiveTab('activity');
  const handleOpenAdmin = () => setActiveSubscreen('admin');
  const handleOpenUserProfile = (username) => {
    setTargetProfileUsername(username);
    setActiveSubscreen('userProfile');
  };
  const handleOpenDirectChat = (convId, partner) => {
    setChatParams({ conversationId: convId, partnerInfo: partner });
    setActiveSubscreen('chat');
  };
  const handleCloseSubscreen = () => {
    setActiveSubscreen(null);
    setChatParams(null);
    setTargetProfileUsername(null);
  };

  return (
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Floating Real-Time Toast */}
      <Toast toast={toastMessage} onDismiss={clearToast} onPress={handleOpenMessages} />

      <View style={IS_DESKTOP ? styles.desktopWrapper : styles.fullWrapper}>
        {/* Subscreens Overlays */}
        {activeSubscreen === 'messages' && (
          <ConversationListScreen
            onBack={handleCloseSubscreen}
            onOpenChat={(convId, partner) => {
              setChatParams({ conversationId: convId, partnerInfo: partner });
              setActiveSubscreen('chat');
            }}
          />
        )}

        {activeSubscreen === 'chat' && chatParams && (
          <ChatScreen
            conversationId={chatParams.conversationId}
            partnerInfo={chatParams.partnerInfo}
            onBack={handleCloseSubscreen}
            onOpenUserProfile={handleOpenUserProfile}
          />
        )}

        {activeSubscreen === 'editProfile' && (
          <EditProfileScreen
            onBack={handleCloseSubscreen}
            onSaved={handleCloseSubscreen}
          />
        )}

        {activeSubscreen === 'settings' && (
          <SettingsScreen
            onBack={handleCloseSubscreen}
            onOpenAdmin={() => setActiveSubscreen('admin')}
          />
        )}

        {activeSubscreen === 'admin' && (
          <AdminDashboardScreen
            onBack={handleCloseSubscreen}
          />
        )}

        {activeSubscreen === 'userProfile' && (
          <ProfileScreen
            targetUsername={targetProfileUsername}
            onBack={handleCloseSubscreen}
            onOpenDirectChat={handleOpenDirectChat}
          />
        )}

        {/* Primary Tab Screens (when no subscreen is active) */}
        {!activeSubscreen && (
          <View style={styles.tabContentArea}>
            {activeTab === 'home' && (
              <HomeScreen
                onOpenMessages={handleOpenMessages}
                onOpenNotifications={handleOpenNotifications}
                onOpenAdmin={handleOpenAdmin}
                onOpenUserProfile={handleOpenUserProfile}
              />
            )}

            {activeTab === 'search' && (
              <SearchScreen
                onOpenUserProfile={handleOpenUserProfile}
                onOpenPost={() => {}}
              />
            )}

            {activeTab === 'create' && (
              <CreatePostScreen
                onPostCreated={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'activity' && (
              <NotificationsScreen
                onOpenUserProfile={handleOpenUserProfile}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileScreen
                targetUsername={null}
                onOpenSettings={() => setActiveSubscreen('settings')}
                onOpenEditProfile={() => setActiveSubscreen('editProfile')}
                onOpenDirectChat={handleOpenDirectChat}
              />
            )}

            {/* Bottom Tab Bar */}
            <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullWrapper: {
    flex: 1
  },
  desktopWrapper: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)'
  },
  tabContentArea: {
    flex: 1,
    position: 'relative'
  }
});
