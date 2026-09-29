import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Image, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import Icon from '../icons/Icon';

const GRADIENTS = [
  { name: 'Aurora', bg: 'linear-gradient(135deg, #6366F1, #EC4899)' },
  { name: 'Midnight', bg: 'linear-gradient(135deg, #1E1B4B, #312E81)' },
  { name: 'Cyber Neon', bg: 'linear-gradient(135deg, #06B6D4, #7C3AED)' },
  { name: 'Emerald', bg: 'linear-gradient(135deg, #059669, #10B981)' },
  { name: 'Sunset Flame', bg: 'linear-gradient(135deg, #D97706, #EF4444)' },
  { name: 'Monochrome', bg: 'linear-gradient(135deg, #18181B, #3F3F46)' }
];

const SAMPLE_MEDIA = [
  'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
];

export default function StoryCreator({ visible, onClose, onPublished }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState('text'); // 'text' | 'gallery' | 'camera'
  const [caption, setCaption] = useState('');
  const [selectedBg, setSelectedBg] = useState(GRADIENTS[0].bg);
  const [selectedImage, setSelectedImage] = useState(SAMPLE_MEDIA[0]);
  const [selectedSticker, setSelectedSticker] = useState('✨');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (mode === 'text' && !caption.trim()) return;
    setPublishing(true);
    try {
      const payload = {
        caption: caption.trim() || 'My 24h Story',
        backgroundStyle: selectedBg,
        privacy: 'everyone',
        media: mode === 'text' ? [] : [{ url: selectedImage, type: 'image', duration: 5 }]
      };
      const res = await api.createStory(payload);
      if (res.success) {
        onPublished && onPublished();
        onClose();
      }
    } catch (err) {
      console.warn('Publish story error:', err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Controls */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Mode Selector */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              onPress={() => setMode('text')}
              style={[styles.modeTab, mode === 'text' && styles.activeModeTab]}
            >
              <Text style={[styles.modeTabText, mode === 'text' && styles.activeModeText]}>Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('gallery')}
              style={[styles.modeTab, mode === 'gallery' && styles.activeModeTab]}
            >
              <Text style={[styles.modeTabText, mode === 'gallery' && styles.activeModeText]}>Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Sticker / Sparkle Overlay */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setSelectedSticker(selectedSticker === '✨' ? '🔥' : selectedSticker === '🔥' ? '🎨' : '✨')}
          >
            <Text style={{ fontSize: 20 }}>{selectedSticker}</Text>
          </TouchableOpacity>
        </View>

        {/* Story Canvas Preview */}
        <View style={styles.canvasContainer}>
          {mode === 'gallery' ? (
            <View style={styles.imageCanvas}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.stickerBadge}>
                <Text style={{ fontSize: 36 }}>{selectedSticker}</Text>
              </View>
              <TextInput
                style={styles.imageCaptionInput}
                placeholder="Add caption to story..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={caption}
                onChangeText={setCaption}
              />
            </View>
          ) : (
            <View style={[styles.textCanvas, { background: selectedBg }]}>
              <View style={styles.stickerBadge}>
                <Text style={{ fontSize: 36 }}>{selectedSticker}</Text>
              </View>
              <TextInput
                style={styles.largeTextInput}
                placeholder="Tap to type your story..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
                value={caption}
                onChangeText={setCaption}
                maxLength={180}
              />
            </View>
          )}
        </View>

        {/* Customization Options Bar */}
        <View style={styles.controlsBar}>
          {mode === 'text' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradientsRow}>
              {GRADIENTS.map((g, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.gradientBubble,
                    { background: g.bg },
                    selectedBg === g.bg && styles.selectedBubble
                  ]}
                  onPress={() => setSelectedBg(g.bg)}
                />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradientsRow}>
              {SAMPLE_MEDIA.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.mediaThumb,
                    selectedImage === url && { borderColor: theme.colors.primary, borderWidth: 2.5 }
                  ]}
                  onPress={() => setSelectedImage(url)}
                >
                  <Image source={{ uri: url }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Bottom Publish Bar */}
          <View style={styles.publishRow}>
            <View style={styles.expirationNotice}>
              <Icon name="shield" size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.expirationText}>Expires in 24 hours</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.publishBtn,
                { backgroundColor: theme.colors.primary },
                publishing && { opacity: 0.7 }
              ]}
              onPress={handlePublish}
              disabled={publishing}
            >
              <Text style={styles.publishBtnText}>
                {publishing ? 'Publishing...' : 'Share to Story →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    zIndex: 20
  },
  headerBtn: {
    padding: 8
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 3
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16
  },
  activeModeTab: {
    backgroundColor: '#6366F1'
  },
  modeTabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600'
  },
  activeModeText: {
    color: '#FFFFFF'
  },
  canvasContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden'
  },
  textCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative'
  },
  largeTextInput: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    lineHeight: 38
  },
  imageCanvas: {
    flex: 1,
    position: 'relative'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  imageCaptionInput: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  stickerBadge: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center'
  },
  controlsBar: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  gradientsRow: {
    gap: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  gradientBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedBubble: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }]
  },
  mediaThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  publishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  expirationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  expirationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12
  },
  publishBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
