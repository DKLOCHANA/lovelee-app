import { View, Text, StyleSheet, ImageBackground, Image, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import Header from '../../src/components/Header';
import { auth } from '../../src/firebase/config';
import { getUserProfile } from '../../src/firebase/services/userService';

const { width, height } = Dimensions.get('window');

// Animated touchable component with zoom effect
function ZoomableItem({ style, imageStyle, source, onNavigate, children }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNavigate();
    });
  };

  return (
    <TouchableOpacity 
      style={style}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.Image 
        source={source}
        style={[imageStyle, { transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(userProfile);
      }
    };
    loadProfile();
  }, []);

  const userName = profile?.displayName || 'Love';

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/background.webp')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <Header 
            title={`Hello, ${userName} 💕`} 
            subtitle="Welcome back to your love zone" 
          />
          
          {/* Room Decorations */}
          <View style={styles.roomContainer}>
            {/* Mood Frame - on top of window */}
            <ZoomableItem
              style={styles.moodFrame}
              imageStyle={styles.moodImage}
              source={require('../../assets/mood.webp')}
              onNavigate={() => router.push('/mood')}
            />

            {/* Gift with Balloon - right side top of window */}
            <ZoomableItem
              style={styles.giftBalloon}
              imageStyle={styles.giftImage}
              source={require('../../assets/gift.webp')}
              onNavigate={() => router.push('/gifts')}
            />

            {/* Letters - on floor bottom of rug */}
            <ZoomableItem
              style={styles.letters}
              imageStyle={styles.lettersImage}
              source={require('../../assets/letters.webp')}
              onNavigate={() => router.push('/notes')}
            />

            {/* Pig - on rug center */}
            <ZoomableItem
              style={styles.pig}
              imageStyle={styles.pigImage}
              source={require('../../assets/pig.webp')}
              onNavigate={() => router.push('/pet')}
            />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  roomContainer: {
    flex: 1,
    position: 'relative',
  },
  // Mood frame - top of window area
  moodFrame: {
    position: 'absolute',
    top: height * 0.14,
    left: width * 0.40,
    zIndex: 10,
  },
  moodImage: {
    width: 120,
    height: 120,
  },
  // Gift balloon - right side top of window
  giftBalloon: {
    position: 'absolute',
    top: height * 0.345,
    left: width * 0.6,
    zIndex: 10,
  },
  giftImage: {
    width: 200,
    height: 200,
  },
  // Letters - bottom of rug on floor
  letters: {
    position: 'absolute',
    bottom: height * 0.16,
    left: width * 0.57,
    zIndex: 10,
  },
  lettersImage: {
    width: 160,
    height: 100,
  },
  // Pig - center on rug
  pig: {
    position: 'absolute',
    bottom: height * 0.25,
    left: width * 0.35,
    zIndex: 15,
  },
  pigImage: {
    width: 140,
    height: 100,
  },
});
