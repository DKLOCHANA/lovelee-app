import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import CustomAlert from '../../src/components/CustomAlert';
import Header from '../../src/components/Header';
import { auth } from '../../src/firebase/config';
import { getUserProfile } from '../../src/firebase/services/userService';
import {
  saveAnniversaryDate,
  getAnniversaryDate,
  addImportantDate,
  getImportantDates,
  deleteImportantDate,
  getDaysUntil,
} from '../../src/firebase/services/datesService';

export default function SpecialDatesScreen() {
  const router = useRouter();
  
  // State
  const [profile, setProfile] = useState(null);
  const [anniversaryDate, setAnniversaryDate] = useState(new Date());
  const [hasAnniversary, setHasAnniversary] = useState(false);
  const [importantDates, setImportantDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add Date Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDateTitle, setNewDateTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newDateNote, setNewDateNote] = useState('');
  
  // Date Picker State
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [showNewDatePicker, setShowNewDatePicker] = useState(false);
  
  // Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(userProfile);
        
        if (userProfile?.coupleId) {
          // Load anniversary
          const { date } = await getAnniversaryDate(userProfile.coupleId);
          if (date) {
            setAnniversaryDate(date);
            setHasAnniversary(true);
          }
          
          // Load important dates
          const { dates } = await getImportantDates(userProfile.coupleId);
          setImportantDates(dates);
        }
      } catch (error) {
        console.error('Error loading dates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!profile?.coupleId) {
      showAlertMessage('error', 'Not Connected', 'Please connect with your partner first.');
      return;
    }
    
    setSaving(true);
    
    try {
      // Save anniversary
      const result = await saveAnniversaryDate(profile.coupleId, anniversaryDate);
      
      if (result.success) {
        setHasAnniversary(true);
        showAlertMessage('success', 'Saved!', 'Your important dates have been saved.');
      } else {
        showAlertMessage('error', 'Error', 'Failed to save dates. Please try again.');
      }
    } catch (error) {
      showAlertMessage('error', 'Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle add important date
  const handleAddDate = async () => {
    if (!newDateTitle.trim()) {
      showAlertMessage('warning', 'Title Required', 'Please enter a title for this date.');
      return;
    }
    
    if (!profile?.coupleId) {
      showAlertMessage('error', 'Not Connected', 'Please connect with your partner first.');
      return;
    }
    
    try {
      const result = await addImportantDate(profile.coupleId, {
        title: newDateTitle.trim(),
        date: newDate,
        note: newDateNote.trim(),
      });
      
      if (result.success) {
        // Refresh dates
        const { dates } = await getImportantDates(profile.coupleId);
        setImportantDates(dates);
        
        // Reset form and close modal
        setNewDateTitle('');
        setNewDate(new Date());
        setNewDateNote('');
        setShowAddModal(false);
        
        showAlertMessage('success', 'Added!', 'Important date has been added.');
      } else {
        showAlertMessage('error', 'Error', 'Failed to add date. Please try again.');
      }
    } catch (error) {
      showAlertMessage('error', 'Error', error.message);
    }
  };

  // Handle delete date
  const handleDeleteDate = (dateItem) => {
    setAlertConfig({
      visible: true,
      type: 'confirm',
      title: 'Delete Date?',
      message: `Are you sure you want to delete "${dateItem.title}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteImportantDate(dateItem.id);
              if (result.success) {
                setImportantDates(prev => prev.filter(d => d.id !== dateItem.id));
              }
            } catch (error) {
              showAlertMessage('error', 'Error', error.message);
            }
          },
        },
      ],
    });
  };

  // Show alert helper
  const showAlertMessage = (type, title, message) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttons: [{ text: 'OK' }],
    });
  };

  // Handle anniversary date change
  const onAnniversaryDateChange = (event, selectedDate) => {
    setShowAnniversaryPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setAnniversaryDate(selectedDate);
    }
  };

  // Handle new date change
  const onNewDateChange = (event, selectedDate) => {
    setShowNewDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Header 
          title="Important Dates" 
          subtitle="Never forget your special moments"
          showHearts={false}
          rightComponent={
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.mainSaveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          }
        />

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Anniversary Section */}
          <Text style={styles.sectionLabel}>The day you started dating</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>Anniversary Date</Text>
                  <TouchableOpacity style={styles.infoButton}>
                    <Ionicons name="information-circle-outline" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardSubtitle}>
                  {hasAnniversary ? `${getDaysUntil(anniversaryDate)} days until anniversary` : 'Not set'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowAnniversaryPicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(anniversaryDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Other Important Dates Section */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>Other Important Dates</Text>
          
          {/* List of dates */}
          {importantDates.map((dateItem) => (
            <View key={dateItem.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{dateItem.title}</Text>
                  {dateItem.note && (
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{dateItem.note}</Text>
                  )}
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.dateText}>{formatDate(dateItem.date)}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDate(dateItem)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          
          {/* Add Date Button */}
          <TouchableOpacity 
            style={styles.addCard}
            onPress={() => setShowAddModal(true)}
          >
            <View style={styles.addIconContainer}>
              <Ionicons name="add" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.addText}>Add Important Date</Text>
          </TouchableOpacity>
          
          <Text style={styles.hintText}>
            Add birthdays, anniversaries, and other special dates
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* Anniversary Date Picker */}
      {showAnniversaryPicker && (
        <Modal
          visible={showAnniversaryPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowAnniversaryPicker(false)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowAnniversaryPicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={anniversaryDate}
                mode="date"
                display="spinner"
                onChange={onAnniversaryDateChange}
                style={styles.datePicker}
                themeVariant="light"
                textColor={COLORS.textPrimary}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Add Important Date Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => {
                setShowAddModal(false);
                setNewDateTitle('');
                setNewDateNote('');
              }}
            >
              <Text style={styles.headerButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Add Important Date</Text>
            
            <TouchableOpacity 
              style={[styles.headerButton, !newDateTitle.trim() && styles.headerButtonDisabled]}
              onPress={handleAddDate}
              disabled={!newDateTitle.trim()}
            >
              <Text style={[
                styles.headerButtonText, 
                styles.saveButtonText,
                !newDateTitle.trim() && styles.saveButtonDisabled
              ]}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            <Text style={styles.sectionLabel}>Date Details</Text>
            
            <View style={styles.formCard}>
              {/* Title Input */}
              <TextInput
                style={styles.input}
                placeholder="Title (e.g., Birthday, First Date)"
                placeholderTextColor={COLORS.textLight}
                value={newDateTitle}
                onChangeText={setNewDateTitle}
              />
              
              <View style={styles.divider} />
              
              {/* Date Row */}
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Date</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowNewDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatDate(newDate)}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              
              {/* Note Input */}
              <TextInput
                style={styles.input}
                placeholder="Note (optional)"
                placeholderTextColor={COLORS.textLight}
                value={newDateNote}
                onChangeText={setNewDateNote}
                multiline
              />
            </View>
          </View>
          
          {/* New Date Picker */}
          {showNewDatePicker && (
            <Modal
              visible={showNewDatePicker}
              transparent
              animationType="slide"
            >
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowNewDatePicker(false)}>
                      <Text style={styles.pickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowNewDatePicker(false)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={newDate}
                    mode="date"
                    display="spinner"
                    onChange={onNewDateChange}
                    style={styles.datePicker}
                    themeVariant="light"
                    textColor={COLORS.textPrimary}
                  />
                </View>
              </View>
            </Modal>
          )}
        </SafeAreaView>
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
  saveButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  mainSaveButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: FONTS.sizes.md,
  },
  // Modal Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  saveButtonText: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: COLORS.textLight,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoButton: {
    marginLeft: SPACING.sm,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dateButton: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  dateButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  addCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  hintText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContent: {
    padding: SPACING.lg,
  },
  formCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  input: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    padding: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: SPACING.lg,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  formLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  // Date Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingBottom: SPACING.xxxl,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pickerCancel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  pickerDone: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  datePicker: {
    height: 200,
  },
});
