import { Link, Stack } from 'expo-router';

import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('errors.oops') }} />
      <View className={styles.container}>
        <Text className={styles.title}>{t('errors.pageNotFound')}</Text>
        <Link href="/" className={styles.link}>
          <Text className={styles.linkText}>{t('errors.goHome')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = {
  container: `items-center flex-1 justify-center p-5`,
  title: `text-xl font-bold`,
  link: `mt-4 pt-4`,
  linkText: `text-base text-[#2e78b7]`,
};
