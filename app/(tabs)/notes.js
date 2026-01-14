import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useNotesStore, useUserStore } from '../../src/store/store';
import Header from '../../src/components/Header';
import CustomAlert from '../../src/components/CustomAlert';
import { auth } from '../../src/firebase/config';
import { getUserProfile } from '../../src/firebase/services/userService';
import { 
  sendNote as firebaseSendNote, 
  subscribeToNotes,
  markNoteAsRead,
  toggleNoteLike,
  deleteNote 
} from '../../src/firebase/services/notesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NotesScreen() {
  const router = useRouter();
  const { compose } = useLocalSearchParams();
  const [showCompose, setShowCompose] = useState(false);

  // Auto-open compose modal if coming from shortcut
  useEffect(() => {
    if (compose === 'true') {
      setShowCompose(true);
    }
  }, [compose]);
  const [noteType, setNoteType] = useState('doodle'); // 'doodle' is now default
  const [noteContent, setNoteContent] = useState('');
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [strokeColor, setStrokeColor] = useState(COLORS.primary);
  const [activeTab, setActiveTab] = useState('all');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showNoteView, setShowNoteView] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const strokeColorRef = useRef(COLORS.primary);
  
  // Firebase state
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [firebaseNotes, setFirebaseNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Local store for doodle limits
  const incrementDoodleCount = useNotesStore((state) => state.incrementDoodleCount);
  const canDoodle = useNotesStore((state) => state.canDoodle);
  const getDoodlesRemaining = useNotesStore((state) => state.getDoodlesRemaining);
  const addHearts = useUserStore((state) => state.addHearts);
  const isPremium = useUserStore((state) => state.isPremium);

  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (type, title, message, buttons = [{ text: 'OK' }]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };

  // Load profile and subscribe to notes
  useEffect(() => {
    let unsubscribe = null;
    
    const init = async () => {
      if (!auth.currentUser) return;
      
      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      
      // Load partner profile for name display
      if (userProfile?.partnerId) {
        const partner = await getUserProfile(userProfile.partnerId);
        setPartnerProfile(partner);
      }
      
      if (userProfile?.coupleId) {
        // Subscribe to real-time notes
        unsubscribe = subscribeToNotes(userProfile.coupleId, (notes) => {
          setFirebaseNotes(notes);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Computed values from Firebase notes
  const sentNotes = firebaseNotes.filter(n => n.senderId === auth.currentUser?.uid);
  const receivedNotes = firebaseNotes.filter(n => n.receiverId === auth.currentUser?.uid);

  // Helper function to format date - show time if same day, otherwise show date
  const formatNoteDate = (noteDate) => {
    if (!noteDate) return '';
    
    // Handle Firestore Timestamp
    let date;
    if (noteDate?.toDate) {
      date = noteDate.toDate();
    } else if (noteDate?.seconds) {
      date = new Date(noteDate.seconds * 1000);
    } else {
      date = new Date(noteDate);
    }
    
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // Show time for today
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Show date for older notes
      return date.toLocaleDateString();
    }
  };

  // Helper to get sender name
  const getSenderName = (note) => {
    const isSent = note.senderId === auth.currentUser?.uid;
    if (isSent) {
      return profile?.displayName || 'Me';
    } else {
      return partnerProfile?.displayName || 'Partner';
    }
  };

  // Update ref when strokeColor changes
  const handleColorChange = (color) => {
    setStrokeColor(color);
    strokeColorRef.current = color;
  };

  // Doodle colors
  const doodleColors = [
    COLORS.primary,
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#95E1D3',
    '#A855F7',
    '#000000',
  ];

  // Pan responder for drawing - using ref for strokeColor
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX.toFixed(0)},${locationY.toFixed(0)}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(prev => prev ? `${prev} L${locationX.toFixed(0)},${locationY.toFixed(0)}` : `M${locationX.toFixed(0)},${locationY.toFixed(0)}`);
      },
      onPanResponderRelease: () => {
        setCurrentPath(prev => {
          if (prev) {
            setPaths(oldPaths => [...oldPaths, { path: prev, color: strokeColorRef.current }]);
          }
          return '';
        });
      },
    })
  ).current;

  const handleSendNote = async () => {
    if (!profile?.coupleId || !profile?.partnerId) {
      setShowCompose(false);
      setTimeout(() => {
        showAlert('warning', 'Connect First', 'You need to connect with your partner before sending notes.');
      }, 300);
      return;
    }

    if (noteType === 'doodle' && paths.length > 0) {
      // Check doodle limit for free users
      if (!isPremium && !canDoodle()) {
        setShowPremiumModal(true);
        return;
      }
      
      // Send to Firebase
      const result = await firebaseSendNote(
        profile.coupleId,
        auth.currentUser.uid,
        profile.partnerId,
        {
          type: 'doodle',
          content: JSON.stringify(paths),
        }
      );
      
      if (result.success) {
        // Increment doodle count for free users
        if (!isPremium) {
          incrementDoodleCount();
        }
        addHearts(5);
        setPaths([]);
        setCurrentPath('');
        setShowCompose(false);
      } else {
        setShowCompose(false);
        setTimeout(() => {
          showAlert('error', 'Error', 'Failed to send note. Please try again.');
        }, 300);
      }
    } else if (noteType === 'text' && noteContent.trim()) {
      // Send to Firebase
      const result = await firebaseSendNote(
        profile.coupleId,
        auth.currentUser.uid,
        profile.partnerId,
        {
          type: 'text',
          content: noteContent.trim(),
        }
      );
      
      if (result.success) {
        addHearts(5);
        setNoteContent('');
        setShowCompose(false);
      } else {
        setShowCompose(false);
        setTimeout(() => {
          showAlert('error', 'Error', 'Failed to send note. Please try again.');
        }, 300);
      }
    }
  };

  const handleClearDoodle = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const handleUndoDoodle = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleDeleteNote = (noteId) => {
    showAlert(
      'confirm',
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteNote(noteId);
        }}
      ]
    );
  };

  // Open note and mark as read
  const handleOpenNote = async (note) => {
    setSelectedNote(note);
    setShowNoteView(true);
    
    // Mark as read if it's a received unread note
    if (note.receiverId === auth.currentUser?.uid && !note.isRead) {
      await markNoteAsRead(note.id);
    }
  };

  const handleCloseNoteView = () => {
    setShowNoteView(false);
    setSelectedNote(null);
  };

  const handleLikeNote = async (noteId) => {
    const note = firebaseNotes.find(n => n.id === noteId);
    if (note) {
      await toggleNoteLike(noteId, !note.isLiked);
    }
  };

  const handleMarkAsRead = async (noteId) => {
    await markNoteAsRead(noteId);
  };

  // Filter notes based on active tab
  const getFilteredNotes = () => {
    switch (activeTab) {
      case 'unread':
        return receivedNotes.filter(n => !n.isRead);
      case 'received':
        return receivedNotes;
      case 'sent':
        return sentNotes;
      case 'all':
      default:
        // Firebase notes are already sorted by createdAt desc from subscription
        return firebaseNotes;
    }
  };

  const filteredNotes = getFilteredNotes();
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'received', label: 'Received' },
    { key: 'sent', label: 'Sent' },
  ];

  const canSend = noteType === 'doodle' ? paths.length > 0 : noteContent.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Love Notes" 
        showHearts={false}
        rightComponent={
          <TouchableOpacity 
            style={styles.composeButton}
            onPress={() => setShowCompose(true)}
          >
            <Text style={styles.composeButtonText}>+ New</Text>
          </TouchableOpacity>
        }
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notes List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notes */}
        <View style={styles.section}>
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={60} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'unread' ? 'No unread notes' : 
                 activeTab === 'received' ? 'No received notes' :
                 activeTab === 'sent' ? 'No sent notes' : 'No notes yet'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all' ? 'Start expressing your love with beautiful notes!' : 
                 `No ${activeTab} notes to display`}
              </Text>
            </View>
          ) : (
            filteredNotes.map((note, index) => (
              <TouchableOpacity 
                key={note.id || index} 
                style={styles.noteCard}
                onPress={() => handleOpenNote(note)}
                activeOpacity={0.7}
              >
                <View style={styles.noteHeader}>
                  <View style={styles.senderContainer}>
                    <Ionicons 
                      name={note.senderId === auth.currentUser?.uid ? 'arrow-up-circle' : 'arrow-down-circle'} 
                      size={16} 
                      color={note.senderId === auth.currentUser?.uid ? COLORS.primary : COLORS.secondary} 
                    />
                    <Text style={styles.senderName}>
                      {getSenderName(note)}
                    </Text>
                    {!note.isRead && note.receiverId === auth.currentUser?.uid && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>New</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.noteMetaRight}>
                    <View style={styles.noteTypeContainer}>
                      <Ionicons 
                        name={note.type === 'doodle' ? 'brush-outline' : 'document-text-outline'} 
                        size={14} 
                        color={COLORS.textLight} 
                      />
                    </View>
                    <Text style={styles.noteTime}>
                      {formatNoteDate(note.createdAt)}
                    </Text>
                  </View>
                </View>
                {note.type === 'doodle' ? (
                  <View style={styles.doodlePreview}>
                    <Svg height="100" width="100%" viewBox="0 0 300 200">
                      {(() => {
                        try {
                          const doodlePaths = JSON.parse(note.content);
                          return doodlePaths.map((pathItem, idx) => (
                            <Path
                              key={idx}
                              d={pathItem.path}
                              stroke={pathItem.color || COLORS.primary}
                              strokeWidth={3}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ));
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </Svg>
                  </View>
                ) : (
                  <Text style={styles.noteContent}>{note.content}</Text>
                )}
                <View style={styles.noteActions}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity 
                    style={styles.noteAction}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Compose Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompose(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Love Note</Text>
              <TouchableOpacity onPress={() => {
                setShowCompose(false);
                setPaths([]);
                setCurrentPath('');
                setNoteContent('');
              }}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Note Type Selector - Doodle first */}
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, noteType === 'doodle' && styles.typeButtonActive]}
                onPress={() => setNoteType('doodle')}
              >
                <Ionicons 
                  name="brush-outline" 
                  size={20} 
                  color={noteType === 'doodle' ? COLORS.primaryDark : COLORS.textSecondary} 
                />
                <Text style={[styles.typeLabel, noteType === 'doodle' && styles.typeLabelActive]}>
                  Doodle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, noteType === 'text' && styles.typeButtonActive]}
                onPress={() => setNoteType('text')}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={noteType === 'text' ? COLORS.primaryDark : COLORS.textSecondary} 
                />
                <Text style={[styles.typeLabel, noteType === 'text' && styles.typeLabelActive]}>
                  Text
                </Text>
              </TouchableOpacity>
            </View>

            {/* Note Input */}
            {noteType === 'text' ? (
              <TextInput
                style={styles.noteInput}
                placeholder="Write your love note..."
                placeholderTextColor={COLORS.textLight}
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <View style={styles.doodleSection}>
                {/* Color Picker */}
                <View style={styles.colorPicker}>
                  {doodleColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        strokeColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => handleColorChange(color)}
                    />
                  ))}
                </View>

                {/* Doodle Canvas */}
                <View style={styles.doodleCanvas} {...panResponder.panHandlers}>
                  <Svg style={styles.svgCanvas}>
                    {paths.map((item, index) => (
                      <Path
                        key={index}
                        d={item.path}
                        stroke={item.color}
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {currentPath && (
                      <Path
                        d={currentPath}
                        stroke={strokeColor}
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </Svg>
                  {paths.length === 0 && !currentPath && (
                    <View style={styles.doodlePlaceholderContainer}>
                      <Ionicons name="brush" size={32} color={COLORS.textLight} />
                      <Text style={styles.doodlePlaceholder}>Draw here!</Text>
                    </View>
                  )}
                </View>

                {/* Doodle Actions */}
                <View style={styles.doodleActions}>
                  <TouchableOpacity 
                    style={[styles.doodleAction, paths.length === 0 && styles.doodleActionDisabled]} 
                    onPress={handleUndoDoodle}
                    disabled={paths.length === 0}
                  >
                    <Ionicons name="arrow-undo-outline" size={18} color={paths.length === 0 ? COLORS.border : COLORS.textSecondary} />
                    <Text style={[styles.doodleActionText, paths.length === 0 && styles.doodleActionTextDisabled]}>Undo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.doodleAction, paths.length === 0 && styles.doodleActionDisabled]} 
                    onPress={handleClearDoodle}
                    disabled={paths.length === 0}
                  >
                    <Ionicons name="trash-outline" size={18} color={paths.length === 0 ? COLORS.border : COLORS.textSecondary} />
                    <Text style={[styles.doodleActionText, paths.length === 0 && styles.doodleActionTextDisabled]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Doodle Limit Indicator */}
            {noteType === 'doodle' && !isPremium && (
              <View style={styles.doodleLimitContainer}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.doodleLimitText}>
                  {getDoodlesRemaining()} / 2 doodles remaining today
                </Text>
              </View>
            )}

            {/* Send Button */}
            <TouchableOpacity 
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={handleSendNote}
              disabled={!canSend}
            >
              <Ionicons name="send" size={18} color={COLORS.textWhite} style={{ marginRight: SPACING.sm }} />
              <Text style={styles.sendButtonText}>Send Note</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Premium Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.premiumModalOverlay}>
          <View style={styles.premiumModal}>
            <View style={styles.premiumIconCircle}>
              <Ionicons name="brush" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.premiumModalTitle}>Daily Limit Reached 🎨</Text>
            <Text style={styles.premiumModalSubtitle}>
              Free users can send 2 doodles per day. Upgrade to Pro for unlimited love notes!
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                setShowPremiumModal(false);
                router.push('/premium');
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note View Modal */}
      <Modal
        visible={showNoteView}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseNoteView}
      >
        <View style={styles.noteViewOverlay}>
          <View style={styles.noteViewModal}>
            {/* Header */}
            <View style={styles.noteViewHeader}>
              <View style={styles.noteViewSenderInfo}>
                <Ionicons 
                  name={selectedNote?.senderId === auth.currentUser?.uid ? 'arrow-up-circle' : 'arrow-down-circle'} 
                  size={20} 
                  color={selectedNote?.senderId === auth.currentUser?.uid ? COLORS.primary : COLORS.secondary} 
                />
                <Text style={styles.noteViewSenderName}>
                  {selectedNote ? getSenderName(selectedNote) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseNoteView} style={styles.noteViewCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Note Type & Time */}
            <View style={styles.noteViewMeta}>
              <View style={styles.noteViewTypeTag}>
                <Ionicons 
                  name={selectedNote?.type === 'doodle' ? 'brush-outline' : 'document-text-outline'} 
                  size={14} 
                  color={COLORS.textSecondary} 
                />
                <Text style={styles.noteViewTypeText}>
                  {selectedNote?.type === 'doodle' ? 'Doodle' : 'Text Note'}
                </Text>
              </View>
              <Text style={styles.noteViewTime}>
                {selectedNote ? formatNoteDate(selectedNote.createdAt) : ''}
              </Text>
            </View>

            {/* Content */}
            <View style={styles.noteViewContent}>
              {selectedNote?.type === 'doodle' ? (
                <View style={styles.noteViewDoodle}>
                  <Svg height="250" width="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
                    {(() => {
                      try {
                        const doodlePaths = JSON.parse(selectedNote?.content || '[]');
                        return doodlePaths.map((pathItem, idx) => (
                          <Path
                            key={idx}
                            d={pathItem.path}
                            stroke={pathItem.color || COLORS.primary}
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ));
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </Svg>
                </View>
              ) : (
                <ScrollView style={styles.noteViewTextScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.noteViewText}>{selectedNote?.content}</Text>
                </ScrollView>
              )}
            </View>

            
          </View>
        </View>
      </Modal>

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
  composeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  composeButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: FONTS.sizes.md,
  },
  tabContainer: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabScroll: {
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textWhite,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteType: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  noteTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  noteMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  unreadBadgeText: {
    color: COLORS.textWhite,
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  doodlePreview: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteActions: {
    flexDirection: 'row',
  },
  noteAction: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textLight,
    padding: SPACING.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.borderLight,
    marginRight: SPACING.md,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  typeEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  typeLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    minHeight: 150,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doodleSection: {
    marginBottom: SPACING.md,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: SPACING.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: COLORS.textPrimary,
    transform: [{ scale: 1.2 }],
  },
  doodleCanvas: {
    height: 250,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  svgCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  doodlePlaceholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doodlePlaceholder: {
    textAlign: 'center',
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  doodleActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  doodleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.sm,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
  },
  doodleActionDisabled: {
    opacity: 0.5,
  },
  doodleActionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  doodleActionTextDisabled: {
    color: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: FONTS.sizes.lg,
  },
  // Doodle limit styles
  doodleLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundPink,
    borderRadius: RADIUS.lg,
  },
  doodleLimitText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  // Premium modal styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    width: '80%',
    ...SHADOWS.large,
  },
  premiumIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.backgroundPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  premiumModalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  premiumModalSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  upgradeButtonText: {
    color: COLORS.textWhite,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  // Note View Modal styles
  noteViewOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noteViewModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    width: '100%',
    maxHeight: '80%',
    ...SHADOWS.large,
    overflow: 'hidden',
  },
  noteViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  noteViewSenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteViewSenderName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  noteViewCloseBtn: {
    padding: SPACING.sm,
  },
  noteViewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noteViewTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPink,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  noteViewTypeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  noteViewTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  noteViewContent: {
    padding: SPACING.xl,
    minHeight: 150,
  },
  noteViewDoodle: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteViewTextScroll: {
    maxHeight: 300,
  },
  noteViewText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  noteViewFooter: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  noteViewFooterText: {
    fontSize: 24,
  },
});
