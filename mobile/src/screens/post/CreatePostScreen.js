import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Icon from '../../icons/Icon';

const SAMPLE_POST_IMAGES = [
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1080&q=80'
];

export default function CreatePostScreen({ onPostCreated }) {
  const { theme } = useTheme();
  const [selectedImages, setSelectedImages] = useState([SAMPLE_POST_IMAGES[0]]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'followers' | 'close_friends'
  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const toggleImageSelect = (url) => {
    if (selectedImages.includes(url)) {
      if (selectedImages.length > 1) {
        setSelectedImages(prev => prev.filter(item => item !== url));
      }
    } else {
      setSelectedImages(prev => [...prev, url]);
    }
  };

  const handleShare = async () => {
    if (selectedImages.length === 0 || loading) return;
    setLoading(true);
    try {
      const mediaList = selectedImages.map((url, idx) => ({
        url,
        type: 'image',
        orderIndex: idx
      }));

      const res = await api.createPost({
        caption: caption.trim(),
        location: location.trim(),
        privacy,
        media: mediaList
      });

      if (res.success) {
        setSuccessToast(true);
        setTimeout(() => {
          setSuccessToast(false);
          setCaption('');
          setLocation('');
          onPostCreated && onPostCreated();
        }, 1200);
      }
    } catch (err) {
      console.warn('Create post error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>New Post</Text>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: theme.colors.primary }, loading && { opacity: 0.7 }]}
          onPress={handleShare}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Image Preview Area */}
      <View style={styles.previewContainer}>
        <Image source={{ uri: selectedImages[0] }} style={styles.mainPreview} resizeMode="cover" />
        {selectedImages.length > 1 && (
          <View style={styles.carouselCountBadge}>
            <Text style={styles.carouselCountText}>{selectedImages.length} Photos Selected</Text>
          </View>
        )}
      </View>

      {/* Select Photos from Gallery */}
      <View style={styles.gallerySelectArea}>
        <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
          Select Media (Multi-Select for Carousel)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
          {SAMPLE_POST_IMAGES.map((url, idx) => {
            const isSelected = selectedImages.includes(url);
            const selectOrder = selectedImages.indexOf(url) + 1;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbWrapper,
                  isSelected && { borderColor: theme.colors.primary, borderWidth: 3 }
                ]}
                onPress={() => toggleImageSelect(url)}
              >
                <Image source={{ uri: url }} style={styles.thumbImage} />
                {isSelected && (
                  <View style={[styles.orderNumberBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.orderNumberText}>{selectOrder}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Caption Input */}
      <View style={[styles.formSection, { borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.captionInput, { color: theme.colors.textPrimary }]}
          placeholder="Write a caption, #hashtags, @mentions..."
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          numberOfLines={4}
          value={caption}
          onChangeText={setCaption}
        />
      </View>

      {/* Location Input */}
      <View style={[styles.formRow, { borderTopColor: theme.colors.border }]}>
        <Icon name="location" size={18} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.rowInput, { color: theme.colors.textPrimary }]}
          placeholder="Add location..."
          placeholderTextColor={theme.colors.textTertiary}
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Privacy Selector */}
      <View style={[styles.privacySection, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.privacyLabel, { color: theme.colors.textSecondary }]}>Audience</Text>
        <View style={styles.privacyChips}>
          {[
            { id: 'public', label: '🌍 Public' },
            { id: 'followers', label: '👥 Followers Only' },
            { id: 'close_friends', label: '⭐ Close Friends' }
          ].map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.privacyChip,
                {
                  backgroundColor: privacy === p.id ? 'rgba(99, 102, 241, 0.2)' : theme.colors.surfaceElevated,
                  borderColor: privacy === p.id ? theme.colors.primary : theme.colors.border
                }
              ]}
              onPress={() => setPrivacy(p.id)}
            >
              <Text style={[styles.privacyChipText, { color: privacy === p.id ? theme.colors.primary : theme.colors.textPrimary }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {successToast && (
        <View style={[styles.successBanner, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.successBannerText}>✨ Post shared successfully!</Text>
        </View>
      )}
    </ScrollView>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700'
  },
  shareBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative'
  },
  mainPreview: {
    width: '100%',
    height: '100%'
  },
  carouselCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  carouselCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  gallerySelectArea: {
    padding: 16
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10
  },
  galleryRow: {
    gap: 10
  },
  thumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  orderNumberBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  orderNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1
  },
  captionInput: {
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top'
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1
  },
  rowInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14
  },
  privacySection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    paddingBottom: 40
  },
  privacyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10
  },
  privacyChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  privacyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1
  },
  privacyChipText: {
    fontSize: 12.5,
    fontWeight: '600'
  },
  successBanner: {
    margin: 16,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  successBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
