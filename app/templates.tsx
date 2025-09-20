import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Search, Filter, Clock, Dumbbell, Edit, Trash2, Copy, X, Tag } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { WorkoutTemplate } from '@/types/workout';
import { formatDuration } from '@/utils/workoutUtils';
import { supabase } from '@/lib/supabase';
import { getWorkoutTemplates } from '@/lib/workoutTemplates';
import { getValidImageUrl, getWorkoutImageByCategory } from '@/utils/imageUtils';

const categories = ['All', 'Strength', 'Cardio', 'Bodyweight', 'HIIT', 'Flexibility', 'Athletic Performance', 'Rehabilitation'];

export default function TemplatesScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme as 'light' | 'dark' | null);
  const styles = createStyles(colors);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkoutTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTemplates([]);
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError || !profileData) {
        setTemplates([]);
        return;
      }

      // Fetch templates from database
      const { data: templatesData, error: templatesError } = await supabase
        .from('workout_templates')
        .select(`
          *,
          template_exercises (
            *,
            exercise:exercises (*)
          )
        `)
        .or(`is_public.eq.true,created_by.eq.${profileData.id}`)
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('Error loading templates from database:', templatesError);
        setTemplates([]);
        return;
      }

      // Transform the data to match the WorkoutTemplate interface
      const transformedTemplates: WorkoutTemplate[] = (templatesData || []).map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        estimated_duration_minutes: template.estimated_duration_minutes || 60,
        created_by: template.created_by,
        is_public: template.is_public,
        created_at: template.created_at,
        updated_at: template.updated_at,
        thumbnail_url: template.thumbnail_url,
        image_url: template.image_url,
        exercises: (template.template_exercises || []).map((te: any) => ({
          id: te.id,
          template_id: te.template_id,
          exercise_id: te.exercise_id,
          exercise: {
            id: te.exercise?.id || '',
            name: te.exercise?.name || 'Unknown Exercise',
            category: te.exercise?.category || 'Unknown',
            muscle_groups: te.exercise?.muscle_groups || [],
            instructions: te.exercise?.instructions,
            equipment: te.exercise?.equipment,
            image_url: te.exercise?.image_url,
          },
          sets_config: te.sets_config ? JSON.parse(te.sets_config) : [],
          order_index: te.order_index,
          notes: te.notes,
          created_at: te.created_at,
        })),
      }));

      setTemplates(transformedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleDeleteTemplate = async (template: WorkoutTemplate) => {
    try {
      // Check if template is being used in any plans
      const { data: planSessions, error: planError } = await supabase
        .from('plan_sessions')
        .select('id, plan_id')
        .eq('template_id', template.id);

      const { data: trainingSessions, error: trainingError } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('template_id', template.id);

      const isUsedInPlans = planSessions && planSessions.length > 0;
      const isUsedInSessions = trainingSessions && trainingSessions.length > 0;

      let alertMessage = `Are you sure you want to delete "${template.name}"?`;
      
      if (isUsedInPlans || isUsedInSessions) {
        alertMessage += '\n\n⚠️ This template is currently being used in:';
        if (isUsedInPlans) {
          alertMessage += `\n• ${planSessions.length} workout plan(s)`;
        }
        if (isUsedInSessions) {
          alertMessage += `\n• ${trainingSessions.length} training session(s)`;
        }
        alertMessage += '\n\nDeleting this template will remove it from all plans and sessions.';
      }

      Alert.alert(
        'Delete Template',
        alertMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Show loading state for this specific template
                setDeletingTemplateId(template.id);
                
                // Delete in the correct order to avoid foreign key constraint issues
                
                // 1. Delete template_exercises first (due to foreign key constraint)
                console.log('🗑️ Deleting template exercises for template:', template.id);
                const { error: teError } = await supabase
                  .from('template_exercises')
                  .delete()
                  .eq('template_id', template.id);
                
                if (teError) {
                  console.error('❌ Error deleting template exercises:', teError);
                  throw new Error(`Failed to delete template exercises: ${teError.message}`);
                }
                console.log('✅ Template exercises deleted successfully');

                // 2. Delete plan_templates (if they exist)
                const { error: ptError } = await supabase
                  .from('plan_templates')
                  .delete()
                  .eq('template_id', template.id);
                
                if (ptError) {
                  console.error('Error deleting plan templates:', ptError);
                  // Don't throw here as this table might not exist
                }

                // 3. Update workout_sessions to remove template reference
                const { error: wsError } = await supabase
                  .from('workout_sessions')
                  .update({ template_id: null })
                  .eq('template_id', template.id);
                
                if (wsError) {
                  console.error('Error updating workout sessions:', wsError);
                  // Don't throw here as this table might not exist
                }

                // 4. Update training_sessions to remove template reference
                const { error: tsError } = await supabase
                  .from('training_sessions')
                  .update({ template_id: null })
                  .eq('template_id', template.id);
                
                if (tsError) {
                  console.error('Error updating training sessions:', tsError);
                  // Don't throw here as this table might not exist
                }

                // 5. Update plan_sessions to remove template reference
                const { error: psError } = await supabase
                  .from('plan_sessions')
                  .update({ template_id: null })
                  .eq('template_id', template.id);
                
                if (psError) {
                  console.error('Error updating plan sessions:', psError);
                  // Don't throw here as this table might not exist
                }

                // 6. Finally delete the template
                console.log('🗑️ Deleting template:', template.id);
                const { error: templateError } = await supabase
                  .from('workout_templates')
                  .delete()
                  .eq('id', template.id);
                
                if (templateError) {
                  console.error('❌ Error deleting template:', templateError);
                  throw new Error(`Failed to delete template: ${templateError.message}`);
                }
                console.log('✅ Template deleted successfully');

                // Reload templates to update the UI
                await loadTemplates();
                
                // Show success message
                Alert.alert('Success', 'Template deleted successfully');
                
              } catch (error) {
                console.error('Error deleting template:', error);
                Alert.alert(
                  'Error', 
                  error instanceof Error ? error.message : 'Failed to delete template. Please try again.'
                );
              } finally {
                setDeletingTemplateId(null);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error checking template usage:', error);
      Alert.alert('Error', 'Failed to check template usage. Please try again.');
    }
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    router.push(`/create-template?edit=${template.id}`);
  };

  const handleDuplicateTemplate = (template: WorkoutTemplate) => {
    router.push(`/create-template?duplicate=${template.id}`);
  };

  const handleCreateTemplate = () => {
    router.push('/create-template');
  };

  const handleCreateExercise = () => {
    router.push('/create-exercise');
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCustomCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
      setShowCategoryModal(false);
    }
  };

  const allCategories = [...categories, ...customCategories];

  const renderTemplateCard = (template: WorkoutTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={styles.templateCard}
      onPress={() => router.push(`/template-details/${template.id}`)}
    >
      {/* Template Thumbnail */}
      {template.thumbnail_url && (
        <Image 
          source={{ uri: getValidImageUrl(template.thumbnail_url, getWorkoutImageByCategory(template.category)) }} 
          style={styles.templateThumbnail}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          {template.description && (
            <Text style={styles.templateDescription} numberOfLines={2}>
              {template.description}
            </Text>
          )}
        </View>
        <View style={styles.templateActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTemplate(template)}
          >
            <Edit size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDuplicateTemplate(template)}
          >
            <Copy size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, deletingTemplateId === template.id && styles.actionButtonDisabled]}
            onPress={() => handleDeleteTemplate(template)}
            disabled={deletingTemplateId === template.id}
          >
            {deletingTemplateId === template.id ? (
              <Text style={[styles.loadingText, { fontSize: 12 }]}>...</Text>
            ) : (
              <Trash2 size={16} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.templateMeta}>
        <View style={styles.metaItem}>
          <Dumbbell size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{template.exercises.length} exercises</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{template.estimated_duration_minutes} min</Text>
        </View>
        <View style={styles.metaItem}>
          <Tag size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{template.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout Templates</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleCreateExercise}
            style={styles.createExerciseButton}
          >
            <Plus size={16} color={colors.success} />
            <Text style={styles.createExerciseText}>Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateTemplate}
            style={styles.createButton}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={styles.createButtonText}>Template</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {allCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.activeCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.activeCategoryChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addCategoryText}>Add Category</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Templates List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTemplates.length === 0 ? (
          <View style={styles.emptyState}>
            <Dumbbell size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No templates found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search or filter'
                : 'Create your first workout template to get started'}
            </Text>
            {!searchQuery && selectedCategory === 'All' && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreateTemplate}
              >
                <Text style={styles.createFirstButtonText}>Create Template</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredTemplates.map(renderTemplateCard)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="Enter category name"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            
            <TouchableOpacity
              style={[
                styles.modalButton,
                !newCategory.trim() && styles.modalButtonDisabled
              ]}
              onPress={handleAddCategory}
              disabled={!newCategory.trim()}
            >
              <Text style={styles.modalButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  createExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createExerciseText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesContainer: {
    maxHeight: 40,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeCategoryChipText: {
    color: '#FFFFFF',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addCategoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  templateMeta: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  templateDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});