import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Share,
  Image,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useNotesStore } from '../../src/store/store';
import CustomAlert from '../../src/components/CustomAlert';
import { auth } from '../../src/firebase/config';
import { getUserProfile, updateDisplayName } from '../../src/firebase/services/userService';
import { getCouple, calculateDaysTogether, connectWithPartner } from '../../src/firebase/services/coupleService';
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
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [couple, setCouple] = useState(null);
  const [daysTogether, setDaysTogether] = useState(0);
  const [partnerCode, setPartnerCode] = useState('');
  const [connectingPartner, setConnectingPartner] = useState(false);
  
  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });
  
  const sentNotes = useNotesStore((state) => state.sentNotes);

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
    showToast('Copied!');
  };

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      buttons: [
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
      ],
    });
  };

  const handleDeleteAccount = () => {
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement account deletion
            showToast('Account deletion is not yet implemented');
          }
        }
      ],
    });
  };

  const handleConnectPartner = async () => {
    if (!partnerCode.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Code Required',
        message: 'Please enter your partner\'s invite code.',
        buttons: [{ text: 'OK' }],
      });
      return;
    }

    setConnectingPartner(true);
    try {
      const result = await connectWithPartner(auth.currentUser.uid, partnerCode.trim().toUpperCase());
      
      if (result.success) {
        // Reload profile data
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(userProfile);
        
        if (userProfile?.coupleId) {
          const coupleData = await getCouple(userProfile.coupleId);
          setCouple(coupleData);
          setDaysTogether(calculateDaysTogether(coupleData));
          
          if (userProfile.partnerId) {
            const partnerProfile = await getUserProfile(userProfile.partnerId);
            setPartner(partnerProfile);
          }
        }
        
        setPartnerCode('');
        setAlertConfig({
          visible: true,
          type: 'heart',
          title: 'Connected! 💕',
          message: `You are now connected with ${result.partner?.displayName || 'your partner'}!`,
          buttons: [{ text: 'Yay!' }],
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Connection Failed',
          message: result.error || 'Could not connect with partner. Please check the code and try again.',
          buttons: [{ text: 'OK' }],
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: error.message,
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setConnectingPartner(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showToast('Permission needed to access photos');
      return;
    }

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

  const handleEditName = () => {
    setEditingName(profileData.userName);
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter your name.',
        buttons: [{ text: 'OK' }],
      });
      return;
    }

    setSavingName(true);
    try {
      const result = await updateDisplayName(auth.currentUser.uid, editingName.trim());
      if (result.success) {
        setProfile(prev => ({ ...prev, displayName: editingName.trim() }));
        setShowNameModal(false);
        showToast('Name updated!');
      } else {
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to update name. Please try again.',
          buttons: [{ text: 'OK' }],
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: error.message,
        buttons: [{ text: 'OK' }],
      });
    } finally {
      setSavingName(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.heartsContainer}>
          <Ionicons name="heart" size={18} color={COLORS.secondary} />
          <Text style={styles.heartsCount}>{profileData.hearts}</Text>
        </View>
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
                <TouchableOpacity onPress={handleEditName}>
                  <Ionicons name="pencil" size={12} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Heart in middle */}
            <Ionicons name="heart" size={24} color={COLORS.secondary} style={styles.heartIcon} />

            {/* Partner Avatar */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, styles.avatarPartner]}>
                {partner ? (
                  <Ionicons name="person" size={40} color={COLORS.textWhite} />
                ) : (
                  <Ionicons name="person-add" size={32} color={COLORS.textWhite} />
                )}
              </View>
              <Text style={styles.avatarName}>
                {profileData.hasPartner ? profileData.partnerName : 'Waiting...'}
              </Text>
            </View>
          </View>

          {/* Days Together - only show if connected */}
          {profileData.hasPartner && daysTogether > 0 && (
            <View style={styles.daysTogetherContainer}>
              <Ionicons name="heart" size={14} color={COLORS.secondary} />
              <Text style={styles.daysTogetherText}>{daysTogether} days together</Text>
            </View>
          )}
        </View>

        {/* My Profile Section - Always show */}
        <Text style={styles.sectionLabel}>My Profile</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>{profileData.userName}</Text>
              <TouchableOpacity onPress={handleEditName}>
                <Ionicons name="pencil" size={16} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profileData.userEmail}</Text>
          </View>
        </View>

        {/* Current Heart Section - Only show if connected */}
        {profileData.hasPartner && (
          <>
            <Text style={styles.sectionLabel}>Current Heart</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Partner</Text>
                <Text style={styles.infoValue}>{profileData.partnerName}</Text>
              </View>
             
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hearts</Text>
                <View style={styles.infoValueRow}>
                  <Ionicons name="heart" size={16} color={COLORS.secondary} />
                  <Text style={[styles.infoValue, { marginLeft: 4 }]}>{profileData.hearts}</Text>
                </View>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Love Notes</Text>
                <Text style={styles.infoValue}>{sentNotes.length}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Connected</Text>
                <Text style={styles.infoValue}>
                  {couple?.connectedAt?.toDate ? 
                    new Date(couple.connectedAt.toDate()).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    }) : '-'
                  }
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Invite Your Partner Section - Only show if NOT connected */}
        {!profileData.hasPartner && (
          <>
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
                <Text style={styles.codeLabel}>Your Invite Code</Text>
                <Text style={styles.codeText}>{profileData.inviteCode}</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                  <Ionicons name="copy-outline" size={18} color={COLORS.textWhite} />
                  <Text style={styles.copyButtonText}>Copy Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={18} color={COLORS.secondary} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Enter Partner Code Section - Only show if NOT connected */}
        {!profileData.hasPartner && (
          <>
            <Text style={styles.sectionLabel}>Have a Code?</Text>
            <View style={styles.inviteCard}>
              <View style={styles.inviteHeader}>
                <View style={[styles.waitingIcon, { backgroundColor: COLORS.secondaryLight }]}>
                  <Ionicons name="link" size={24} color={COLORS.secondary} />
                </View>
                <View style={styles.inviteTextContainer}>
                  <Text style={styles.inviteTitle}>Enter Partner's Code</Text>
                  <Text style={styles.inviteSubtitle}>Connect using your partner's invite code</Text>
                </View>
              </View>

              <View style={styles.codeInputContainer}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Enter code"
                  placeholderTextColor={COLORS.textLight}
                  value={partnerCode}
                  onChangeText={(text) => setPartnerCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <TouchableOpacity 
                  style={[styles.connectButton, connectingPartner && { opacity: 0.6 }]}
                  onPress={handleConnectPartner}
                  disabled={connectingPartner}
                >
                  <Text style={styles.connectButtonText}>
                    {connectingPartner ? 'Connecting...' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Subscription Section - Always show */}
        <Text style={styles.sectionLabel}>Subscription</Text>
        <TouchableOpacity 
          style={styles.premiumCard}
          onPress={() => router.push('/premium')}
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

        {/* Account Section - Always show */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.infoRow} onPress={handleLogout}>
            <Text style={[styles.infoLabel, styles.dangerText]}>Log Out</Text>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity style={styles.infoRow} onPress={handleDeleteAccount}>
            <Text style={[styles.infoLabel, styles.dangerText]}>Delete Account</Text>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoText}>Lovelee v1.0.0</Text>
          
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Name Edit Modal */}
      <Modal
        visible={showNameModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.nameModalOverlay}>
          <View style={styles.nameModalContent}>
            <Text style={styles.nameModalTitle}>Edit Name</Text>
            <TextInput
              style={styles.nameInput}
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textLight}
              autoFocus
              maxLength={30}
            />
            <View style={styles.nameModalButtons}>
              <TouchableOpacity 
                style={styles.nameModalCancelButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.nameModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.nameModalSaveButton, savingName && { opacity: 0.6 }]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                <Text style={styles.nameModalSaveText}>
                  {savingName ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Toast */}
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onHide={() => setToastVisible(false)} 
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
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
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
  },
  heartsCount: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  // Couple Card
  coupleCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  coupleNameRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  coupleName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
  daysTogetherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  daysTogetherText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  // Section Label
  sectionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    marginLeft: SPACING.xs,
  },
  // Info Card (for My Profile, Current Heart, Account)
  infoCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  infoLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dangerText: {
    color: COLORS.error,
  },
  // Invite Card
  inviteCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
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
  // Code Input
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  codeInput: {
    flex: 1,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  connectButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: FONTS.sizes.md,
  },
  // Premium Card
  premiumCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.secondaryLight,
    ...SHADOWS.small,
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
  // App Info
  appInfoContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  appInfoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  appInfoSubtext: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  // Name Edit Modal
  nameModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  nameModalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
    ...SHADOWS.medium,
  },
  nameModalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  nameInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  nameModalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
  },
  nameModalCancelText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nameModalSaveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
  },
  nameModalSaveText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
});
