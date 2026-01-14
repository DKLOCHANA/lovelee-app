import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useUserStore } from '../../src/store/store';
import CustomAlert from '../../src/components/CustomAlert';
import Header from '../../src/components/Header';

// Music tracks configuration
const MUSIC_TRACKS = [
  {
    id: 1,
    name: 'Lofi',
    url: 'https://cdn.jsdelivr.net/gh/DKLOCHANA/couple-app-audio/1.mp3',
    cost: 0,
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 2,
    name: 'Funky',
    url: 'https://cdn.jsdelivr.net/gh/DKLOCHANA/couple-app-audio/2.mp3',
    cost: 500,
    isPremium: false,
    isUnlocked: false,
  },
  {
    id: 3,
    name: 'Groovy',
    url: 'https://cdn.jsdelivr.net/gh/DKLOCHANA/couple-app-audio/3.mp3',
    cost: 500,
    isPremium: false,
    isUnlocked: false,
  },
  {
    id: 4,
    name: 'Relaxing',
    url: 'https://cdn.jsdelivr.net/gh/DKLOCHANA/couple-app-audio/4.mp3',
    cost: 500,
    isPremium: true,
    isUnlocked: false,
  },
  {
    id: 5,
    name: 'Corporate',
    url: 'https://cdn.jsdelivr.net/gh/DKLOCHANA/couple-app-audio/5.mp3',
    cost: 5000,
    isPremium: true,
    isUnlocked: false,
  },
];

// Cache directory for music files
const CACHE_DIR = FileSystem.cacheDirectory + 'music/';

// Music Track Card Component
function MusicTrackCard({ track, isPlaying, isLoading, isSelected, onPress, onUnlock, hearts }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const canUnlock = hearts >= track.cost;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.trackCard,
          isSelected && styles.trackCardSelected,
        ]}
        onPress={() => track.isUnlocked ? onPress() : onUnlock()}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.trackLeft}>
          {!track.isUnlocked && (
            <Ionicons 
              name="lock-closed" 
              size={18} 
              color={COLORS.textLight} 
              style={styles.lockIcon}
            />
          )}
          <Text style={[
            styles.trackName,
            !track.isUnlocked && styles.trackNameLocked
          ]}>
            {track.name}
          </Text>
        </View>

        <View style={styles.trackRight}>
          {track.isUnlocked ? (
            isSelected ? (
              isLoading ? (
                <ActivityIndicator size="small" color={COLORS.accentPurple} />
              ) : (
                <View style={styles.playButton}>
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={20} 
                    color={COLORS.textWhite} 
                  />
                </View>
              )
            ) : null
          ) : (
            <View style={styles.costBadge}>
              <Text style={styles.heartIcon}>💗</Text>
              <Text style={styles.costText}>
                {track.cost.toLocaleString()}
              </Text>
              {track.isPremium && (
                <Text style={styles.crownIcon}>👑</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MusicScreen() {
  const router = useRouter();
  const hearts = useUserStore((state) => state.hearts);
  const spendHearts = useUserStore((state) => state.spendHearts);
  const isPremium = useUserStore((state) => state.isPremium);

  const [tracks, setTracks] = useState(MUSIC_TRACKS);
  const [selectedTrack, setSelectedTrack] = useState(MUSIC_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState(null);
  
  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  // Show alert helper
  const showAlert = (type, title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };

  // Ensure cache directory exists
  useEffect(() => {
    const setupCacheDir = async () => {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
    };
    setupCacheDir();
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Get cached file path
  const getCachedFilePath = (trackId) => {
    return `${CACHE_DIR}track_${trackId}.mp3`;
  };

  // Check if file is cached
  const isFileCached = async (trackId) => {
    const filePath = getCachedFilePath(trackId);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  };

  // Download and cache music file
  const downloadAndCache = async (track) => {
    const filePath = getCachedFilePath(track.id);
    
    try {
      const downloadResult = await FileSystem.downloadAsync(
        track.url,
        filePath
      );
      
      if (downloadResult.status === 200) {
        console.log('Downloaded and cached:', track.name);
        return filePath;
      }
      throw new Error('Download failed');
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  // Play music
  const playMusic = async (track) => {
    try {
      setIsLoading(true);
      setSelectedTrack(track);

      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Check if cached
      const cached = await isFileCached(track.id);
      let audioSource;

      if (cached) {
        console.log('Playing from cache:', track.name);
        audioSource = { uri: getCachedFilePath(track.id) };
      } else {
        console.log('Downloading:', track.name);
        // Download and cache for next time
        const cachedPath = await downloadAndCache(track);
        audioSource = { uri: cachedPath };
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load and play
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: true, isLooping: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      // Handle playback status updates
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      });

    } catch (error) {
      console.error('Error playing music:', error);
      setIsLoading(false);
      showAlert('error', 'Error', 'Failed to play music. Please try again.');
    }
  };

  // Toggle play/pause
  const togglePlayPause = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  // Handle track selection
  const handleTrackPress = async (track) => {
    if (track.id === selectedTrack?.id) {
      // Toggle play/pause for current track
      if (sound) {
        togglePlayPause();
      } else {
        playMusic(track);
      }
    } else {
      // Play new track
      playMusic(track);
    }
  };

  // Unlock track with hearts
  const handleUnlockTrack = (track) => {
    if (track.isPremium && !isPremium) {
      showAlert(
        'warning',
        'Premium Required 👑',
        'This track requires a premium subscription.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }

    if (hearts < track.cost) {
      showAlert(
        'heart',
        'Not Enough Hearts 💗',
        `You need ${track.cost} hearts to unlock "${track.name}". You have ${hearts} hearts.`
      );
      return;
    }

    showAlert(
      'confirm',
      'Unlock Track 🎵',
      `Spend ${track.cost} hearts to unlock "${track.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: () => {
            spendHearts(track.cost);
            setTracks(prev =>
              prev.map(t =>
                t.id === track.id ? { ...t, isUnlocked: true } : t
              )
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Music" subtitle="Play relaxing tunes together" />

        {/* Tracks List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tracks.map((track) => (
            <MusicTrackCard
              key={track.id}
              track={track}
              isPlaying={isPlaying && selectedTrack?.id === track.id}
              isLoading={isLoading && selectedTrack?.id === track.id}
              isSelected={selectedTrack?.id === track.id}
              onPress={() => handleTrackPress(track)}
              onUnlock={() => handleUnlockTrack(track)}
              hearts={hearts}
            />
          ))}

          {/* Info text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={18} color={COLORS.textLight} />
            <Text style={styles.infoText}>
              Music is cached after first play for faster loading
            </Text>
          </View>
        </ScrollView>

        {/* Now Playing Bar */}
        {selectedTrack && isPlaying && (
          <View style={styles.nowPlayingBar}>
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingLabel}>Now Playing</Text>
              <Text style={styles.nowPlayingTrack}>{selectedTrack.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.nowPlayingButton}
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color={COLORS.textWhite} 
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: SPACING.xl,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  trackCardSelected: {
    borderColor: COLORS.accentPurple,
    backgroundColor: `${COLORS.accentPurple}08`,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: SPACING.md,
  },
  trackName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trackNameLocked: {
    color: COLORS.textLight,
  },
  trackRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  heartIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  costText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  crownIcon: {
    fontSize: 14,
    marginLeft: SPACING.xs,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginLeft: SPACING.sm,
  },
  nowPlayingBar: {
    position: 'absolute',
    bottom: 100,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textWhite,
    opacity: 0.8,
  },
  nowPlayingTrack: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  nowPlayingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
