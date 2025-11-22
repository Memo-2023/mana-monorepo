import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  TextInput as RNTextInput,
} from 'react-native';
import { useTheme } from '@/components/theme';
import { TagElementList } from '@/components/features/tags/TagElementList';
import { Stack } from 'expo-router';
import ModalTagCreateAndEdit from '@/components/features/tags/ModalTagCreateAndEdit';
import CommonHeader from '@/components/organisms/CommonHeader';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import useProjectStore from '@/stores/projectStore';
import useUserStore from '@/stores/userStore';
import ProjectModel from '@/models/ProjectModel';
import ProjectService from '@/services/ProjectService';
import useSettingsStore from '@/stores/settingsStore';
import { usePostHog } from 'posthog-react-native';
import { useRouter } from 'expo-router';

// Definieren Sie einen Typ für die zulässigen Farbwerte
type TagColor = 'red' | 'green' | 'blue' | 'orange' | 'purple' | 'teal' | 'pink' | 'gray';

// Fügen Sie diese Typdefinition hinzu oder aktualisieren Sie sie in der Datei, in der ModalTagCreateAndEdit definiert ist
type ExtendedModalTagCreateAndEditProps = {
  isVisible: boolean;
  isEditing: boolean;
  tagName: string;
  tagColor: TagColor;
  onChangeTagName: (name: string) => void;
  onChangeTagColor: (color: TagColor) => void;
  onCancel: () => void;
  onSave: () => void;
  onTagNameChange: (name: string) => void;
  onTagColorChange: (color: TagColor) => void;
};

const ModalTagCreateAndEditWithTypes = ModalTagCreateAndEdit as React.ComponentType<ExtendedModalTagCreateAndEditProps>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  tagListContainer: {
    flex: 1,
  },
});

export default function TagsScreen() {
  const { i18n } = useLingui();
  const { theme } = useTheme();
  const posthog = usePostHog();
  const { showDebugBorders } = useSettingsStore();
  const [viewingTagId, setViewingTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef<RNTextInput>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState<ProjectModel | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState<TagColor>('gray');
  const { currentUser } = useUserStore();
  const { items: projects, filterProjectsByUserRef } = useProjectStore();
  const projectService = useMemo(() => new ProjectService(), []);
  const router = useRouter();

  // Handler-Funktionen
  const handleTagPress = (project: ProjectModel) => {
    console.debug('Tag pressed:', project.id);
    // Zur MyMemos-Seite navigieren und das Tag dort filtern
    if (project.id) {
      router.push({
        pathname: '/(protected)/(tabs)/mymemos',
        params: { tagId: project.id }
      });
    }
    posthog?.capture('tag_pressed', {
      tag_id: project.id,
      tag_name: project.projectName,
    });
  };

  const handleEditTag = (project: ProjectModel) => {
    console.debug('Edit tag:', project.id);
    setIsEditing(true);
    setEditingTag(project);
    setTagName(project.projectName || '');
    setTagColor(project.color as TagColor);
    setIsModalVisible(true);
    posthog?.capture('tag_edit', {
      tag_id: project.id,
      tag_name: project.projectName,
    });
  };

  const handleTagView = async (project: ProjectModel) => {
    console.debug('View tag:', project.id);
    try {
      if (!project.id) return;
      
      const updatedProject = {
        ...project,
        isVisible: !project.isVisible
      };
      
      await projectService.update(project.id, updatedProject);
      
      if (currentUser?.docRef) {
        await filterProjectsByUserRef(currentUser.docRef);
      }
      posthog?.capture('tag_view', {
        tag_id: project.id,
        tag_name: project.projectName,
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Tag-Sichtbarkeit:', error);
    }
  };

  // Filteredtags-Logik mit Suchfunktion
  const filteredTags = useMemo(() => {
    if (!currentUser?.docRef) return [];
    const userProjects = filterProjectsByUserRef(currentUser.docRef);
    
    if (!searchQuery) return userProjects;
    
    return userProjects.filter(project => 
      project.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentUser, projects, searchQuery, filterProjectsByUserRef]);

  const handleCreateTag = () => {
    setIsEditing(false);
    setTagName('');
    setTagColor('gray');
    setIsModalVisible(true);
    posthog?.capture('tag_create', {
      tag_name: tagName,
      tag_color: tagColor,
    });
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingTag(null);
    setTagName('');
    setTagColor('gray');
  };

  const handleSaveTag = async () => {
    console.debug('handleSaveTag, isEditing:', isEditing, 'editingTag:', editingTag);
    if (isEditing && editingTag) {
      // Tag bearbeiten
      if (!editingTag.id) return;
      
      const updatedProject = {
        ...editingTag,
        projectName: tagName,
        color: tagColor,
      };
      
      try {
        await projectService.update(editingTag.id, updatedProject);
        if (currentUser?.docRef) {
          await filterProjectsByUserRef(currentUser.docRef);
        }
        posthog?.capture('tag_updated', {
          tag_id: editingTag.id,
          tag_name: tagName,
          tag_color: tagColor,
        });
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Tags:', error);
      }
    } else {
      // Neuen Tag erstellen
      console.debug('currentUser?.docRef:', currentUser?.docRef);
      if (!currentUser?.docRef) return;
      let newProject;
      try {
        // Ensure properly formatted initialization with consistent indentation
        newProject = new ProjectModel({
          projectName: tagName,
          color: tagColor,
          user: currentUser.docRef,
          isVisible: true,
        });
      } catch (error) {
        console.error('Fehler beim Erstellen des Tags:', error);
        return; // Exit early if we can't create the project
      }
      try {
        const createdProject = await projectService.add(newProject);
        if (createdProject.id) {
          // Track tag_created event
          posthog?.capture('tag_created', {
            tag_id: createdProject.id,
            tag_name: tagName,
            tag_color: tagColor,
          });
        }
      } catch (error) {
        console.error('Fehler beim Erstellen des Tags:', error);
      }
    }
    setIsModalVisible(false);
    setEditingTag(null);
    setTagName('');
    setTagColor('gray');
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  const handleTagNameChange = (name: string) => {
    setTagName(name);
  };

  const handleTagColorChange = (color: TagColor) => {
    setTagColor(color);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
      <Stack.Screen options={{ 
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }} />
      <CommonHeader
        title={t`Tags`}
        isSearchVisible={isSearchVisible}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        toggleSearch={toggleSearch}
        showAddButton
        onAddPress={handleCreateTag}
        addButtonTitle={t`Create Tag`}
        showBackButton={true}
      />
      <View style={styles.tagListContainer}>
        <TagElementList
          tags={filteredTags}
          onTagPress={handleTagPress}
          onTagEdit={handleEditTag}
          onTagView={handleTagView}
          viewingTagId={viewingTagId}
        />
      </View>
      <ModalTagCreateAndEditWithTypes
        isVisible={isModalVisible}
        isEditing={isEditing}
        tagName={tagName}
        tagColor={tagColor}
        onChangeTagName={handleTagNameChange}
        onChangeTagColor={handleTagColorChange}
        onCancel={handleCancelModal}
        onSave={handleSaveTag}
        onTagNameChange={handleTagNameChange}
        onTagColorChange={handleTagColorChange}
      />
    </View>
  );
}
