import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Switch,
  Share,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useNotesStore, useRoomStore } from '../../src/store/store';
import { auth } from '../../src/firebase/config';
import { getUserProfile, uploadProfilePhoto } from '../../src/firebase/services/userService';
import { getCouple, calculateDaysTogether } from '../../src/firebase/services/coupleService';
import { logout } from '../../src/firebase/services/authService';

// Custom Toast Component
function Toast({ visible, message, onHide }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
      <Ionicons name="checkmark-circle" size={20} color={COLORS.textWhite} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [couple, setCouple] = useState(null);
  const [daysTogether, setDaysTogether] = useState(0);
  
  const sentNotes = useNotesStore((state) => state.sentNotes);
  const loveZoneLevel = useRoomStore((state) => state.loveZoneLevel);

  // Load profile data from Firebase
  useEffect(() => {
    const loadProfileData = async () => {
      if (auth.currentUser) {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(userProfile);
        
        if (userProfile?.photoURL) {
          setUserImage(userProfile.photoURL);
        }
        
        if (userProfile?.coupleId) {
          const coupleData = await getCouple(userProfile.coupleId);
          setCouple(coupleData);
          setDaysTogether(calculateDaysTogether(coupleData));
          
          if (userProfile.partnerId) {
            const partnerProfile = await getUserProfile(userProfile.partnerId);
            setPartner(partnerProfile);
          }
        }
      }
    };
    loadProfileData();
  }, []);
  
  // Use data from Firebase profile
  const profileData = {
    userName: profile?.displayName || 'User',
    userEmail: profile?.email || 'user@example.com',
    partnerName: partner?.displayName || 'Partner',
    coupleName: couple?.coupleName || 'Our Story',
    inviteCode: profile?.inviteCode || 'XXXXXX',
    hasPartner: !!profile?.coupleId,
    createdAt: profile?.createdAt?.toDate?.() || new Date(),
    isPremium: profile?.isPremium || false,
    hearts: profile?.hearts || 0,
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(profileData.inviteCode);
    showToast('Invite code copied!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            const { success } = await logout();
            if (success) {
              router.replace('/welcome');
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showToast('Permission needed to access photos');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUserImage(result.assets[0].uri);
      showToast('Photo updated!');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Lovelee! Use my invite code: ${profileData.inviteCode}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Couple Card */}
        <View style={styles.coupleCard}>
          <View style={styles.coupleNameRow}>
            <Text style={styles.coupleName}>{profileData.coupleName}</Text>
            
          </View>
          
          <View style={styles.avatarsRow}>
            {/* User Avatar */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <View style={[styles.avatar, styles.avatarUser]}>
                  {userImage ? (
                    <Image source={{ uri: userImage }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={40} color={COLORS.textWhite} />
                  )}
                  <View style={styles.cameraIcon}>
                    <Ionicons name="camera-outline" size={12} color={COLORS.textWhite} />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.nameRow}>
                <Text style={styles.avatarName}>{profileData.userName}</Text>
                <TouchableOpacity>
                  <Ionicons name="pencil" size={12} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Heart in middle */}
            <Ionicons name="heart" size={24} color={COLORS.textPrimary} style={styles.heartIcon} />

            {/* Partner Avatar */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, styles.avatarPartner]}>
                <Ionicons name="person" size={40} color={COLORS.textWhite} />
              </View>
              <Text style={styles.avatarName}>{profileData.partnerName}</Text>
            </View>
          </View>
        </View>

        {/* Invite Your Partner Section */}
        <Text style={styles.sectionLabel}>Invite Your Partner</Text>
        <View style={styles.inviteCard}>
          <View style={styles.inviteHeader}>
            <View style={styles.waitingIcon}>
              <Ionicons name="heart" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.inviteTextContainer}>
              <Text style={styles.inviteTitle}>Waiting for Partner</Text>
              <Text style={styles.inviteSubtitle}>Share your invite code to connect</Text>
            </View>
          </View>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Invite Code</Text>
            <Text style={styles.codeText}>{profileData.inviteCode}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={18} color={COLORS.textWhite} />
              <Text style={styles.copyButtonText}>Copy Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={COLORS.primary} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        

        
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderSpacer} />
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* My Profile Section */}
              <Text style={styles.settingsSectionLabel}>My Profile</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Name</Text>
                  <View style={styles.settingsValueRow}>
                    <Text style={styles.settingsValue}>{profileData.userName}</Text>
                    <TouchableOpacity>
                      <Ionicons name="pencil" size={16} color={COLORS.accentPurple} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Email</Text>
                  <Text style={styles.settingsValue}>{profileData.userEmail}</Text>
                </View>
              </View>

              {/* Current Heart Section */}
              <Text style={styles.settingsSectionLabel}>Current Heart</Text>
              <View style={styles.settingsCard}>
                
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Invite Code</Text>
                  <View style={styles.settingsValueRow}>
                    <Text style={[styles.settingsValue, styles.codeValue]}>{profileData.inviteCode}</Text>
                    <TouchableOpacity onPress={handleCopyCode}>
                      <Ionicons name="copy-outline" size={16} color={COLORS.accentPurple} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Members</Text>
                  <Text style={styles.settingsValue}>1/2</Text>
                </View>
                
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Hearts</Text>
                  <Text style={styles.settingsValue}>{profileData.hearts}</Text>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Love Notes</Text>
                  <Text style={styles.settingsValue}>{sentNotes.length}</Text>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Created</Text>
                  <Text style={styles.settingsValue}>
                    {new Date(profileData.createdAt).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>

              {/* Notifications Section */}
              <Text style={styles.settingsSectionLabel}>Notifications</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <View style={styles.notificationRow}>
                    <Ionicons name="notifications" size={20} color={COLORS.primary} />
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.settingsLabel}>Notifications</Text>
                      <Text style={styles.notificationSubtext}>Tap to enable notifications</Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                    thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textLight}
                  />
                </View>
              </View>

              {/* Premium Section */}
              <Text style={styles.settingsSectionLabel}>Subscription</Text>
              <TouchableOpacity 
                style={styles.premiumCard}
                onPress={() => {
                  setShowSettings(false);
                  router.push('/premium');
                }}
              >
                <View style={styles.premiumRow}>
                  <View style={styles.premiumIconContainer}>
                    <Ionicons name="diamond" size={24} color={COLORS.secondary} />
                  </View>
                  <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>
                      {profileData.isPremium ? 'Lovelee Pro' : 'Upgrade to Pro'}
                    </Text>
                    <Text style={styles.premiumSubtext}>
                      {profileData.isPremium ? 'You have all premium features!' : 'Unlock unlimited features'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
                </View>
              </TouchableOpacity>

              {/* Love Zone Section */}
              <Text style={styles.settingsSectionLabel}>Love Zone</Text>
              <TouchableOpacity style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>Manage Love Zone</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                </View>
              </TouchableOpacity>

              {/* Danger Zone */}
              <Text style={styles.settingsSectionLabel}>Account</Text>
              <View style={styles.settingsCard}>
                <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
                  <Text style={[styles.settingsLabel, styles.dangerText]}>Log Out</Text>
                </TouchableOpacity>
                <View style={styles.settingsDivider} />
                <TouchableOpacity style={styles.settingsRow}>
                  <Text style={[styles.settingsLabel, styles.dangerText]}>Delete Account</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Toast */}
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onHide={() => setToastVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  toast: {
    position: 'absolute',
    bottom: 120,
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  toastText: {
    color: COLORS.textWhite,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.title,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  coupleCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  coupleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  coupleName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  editIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  avatarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarUser: {
    backgroundColor: COLORS.secondary,
  },
  avatarPartner: {
    backgroundColor: COLORS.accentPurple,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundCard,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  heartIcon: {
    marginHorizontal: SPACING.xl,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  inviteCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  waitingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  inviteTextContainer: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inviteSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  codeContainer: {
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  codeLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  codeText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    marginRight: SPACING.md,
  },
  copyButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  menuCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  modalHeaderSpacer: {
    width: 50,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  doneButton: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  settingsSectionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: SPACING.sm,
  },
  settingsCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.small,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  settingsLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  settingsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  codeValue: {
    color: COLORS.accentPurple,
    fontWeight: '500',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTextContainer: {
    marginLeft: SPACING.md,
  },
  notificationSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  dangerText: {
    color: COLORS.error,
  },
  // Premium card styles
  premiumCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.secondaryLight,
    ...SHADOWS.small,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  premiumIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  premiumSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
