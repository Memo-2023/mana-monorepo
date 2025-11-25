import React, { useState } from 'react';
import { Alert, Share, Vibration } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';
import Clipboard from '@react-native-clipboard/clipboard';
import { MealWithItems } from '../../types/Database';
import { MealCard } from './MealCard';
import { EditMealModal } from './EditMealModal';
import { useMealStore } from '../../store/MealStore';

interface MealCardContextMenuProps {
  meal: MealWithItems;
  onPress: () => void;
}

export const MealCardContextMenu: React.FC<MealCardContextMenuProps> = ({ meal, onPress }) => {
  const { deleteMeal, updateMeal } = useMealStore();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Mahlzeit löschen',
      'Möchtest du diese Mahlzeit wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal(meal.id);
            } catch {
              Alert.alert('Fehler', 'Die Mahlzeit konnte nicht gelöscht werden.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleShare = async () => {
    try {
      const nutritionInfo = `🍽️ ${meal.food_items?.map((item) => item.name).join(', ') || 'Mahlzeit'}

📊 Nährwerte:
• Kalorien: ${meal.total_calories || '--'} kcal
• Protein: ${meal.total_protein || '--'}g
• Kohlenhydrate: ${meal.total_carbs || '--'}g
• Fett: ${meal.total_fat || '--'}g

💚 Gesundheitsscore: ${meal.health_score ? Math.round(meal.health_score) : '--'}/100

Getrackt mit Nutriphi 🤖`;

      await Share.share({
        message: nutritionInfo,
        title: 'Meine Mahlzeit',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleRating = (rating: number) => {
    updateMeal(meal.id, { user_rating: rating });
  };

  const handleReanalyze = () => {
    Alert.alert(
      'Erneut analysieren',
      'Die Funktion zur erneuten Analyse wird in einer zukünftigen Version verfügbar sein.',
      [{ text: 'OK' }]
    );
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleCopyNutrition = () => {
    const nutritionText = `${meal.food_items?.map((item) => item.name).join(', ') || 'Mahlzeit'}
Kalorien: ${meal.total_calories || '--'} kcal
Protein: ${meal.total_protein || '--'}g
Kohlenhydrate: ${meal.total_carbs || '--'}g
Fett: ${meal.total_fat || '--'}g
Ballaststoffe: ${meal.total_fiber || '--'}g
Zucker: ${meal.total_sugar || '--'}g
Gesundheitsscore: ${meal.health_score ? Math.round(meal.health_score) : '--'}/100`;

    Clipboard.setString(nutritionText);
    Alert.alert('Kopiert', 'Nährwerte wurden in die Zwischenablage kopiert.');
  };

  // Build context menu actions
  const actions = [
    {
      title: 'Bearbeiten',
      systemIcon: 'pencil',
    },
    {
      title: 'Bewerten',
      systemIcon: 'star',
      inlineChildren: true,
      actions: [
        { title: '⭐', systemIcon: 'star.fill' },
        { title: '⭐⭐', systemIcon: 'star.fill' },
        { title: '⭐⭐⭐', systemIcon: 'star.fill' },
        { title: '⭐⭐⭐⭐', systemIcon: 'star.fill' },
        { title: '⭐⭐⭐⭐⭐', systemIcon: 'star.fill' },
      ],
    },
    {
      title: 'Teilen',
      systemIcon: 'square.and.arrow.up',
    },
    {
      title: 'Nährwerte kopieren',
      systemIcon: 'doc.on.doc',
    },
  ];

  // Add conditional actions
  if (meal.analysis_status === 'failed') {
    actions.push({
      title: 'Erneut analysieren',
      systemIcon: 'arrow.clockwise',
    });
  }

  // Add destructive action at the end
  actions.push({
    title: 'Löschen',
    systemIcon: 'trash',
    destructive: true,
  });

  const handlePress = (event: any) => {
    const { index, name } = event.nativeEvent;

    // Haptic feedback
    Vibration.vibrate(10);

    switch (name || actions[index]?.title) {
      case 'Bearbeiten':
        handleEdit();
        break;
      case 'Löschen':
        handleDelete();
        break;
      case 'Teilen':
        handleShare();
        break;
      case 'Nährwerte kopieren':
        handleCopyNutrition();
        break;
      case 'Erneut analysieren':
        handleReanalyze();
        break;
      case '⭐':
        handleRating(1);
        break;
      case '⭐⭐':
        handleRating(2);
        break;
      case '⭐⭐⭐':
        handleRating(3);
        break;
      case '⭐⭐⭐⭐':
        handleRating(4);
        break;
      case '⭐⭐⭐⭐⭐':
        handleRating(5);
        break;
    }
  };

  return (
    <>
      <ContextMenu actions={actions} onPress={handlePress} previewBackgroundColor="transparent">
        <MealCard meal={meal} onPress={onPress} />
      </ContextMenu>

      <EditMealModal meal={meal} visible={showEditModal} onClose={() => setShowEditModal(false)} />
    </>
  );
};
