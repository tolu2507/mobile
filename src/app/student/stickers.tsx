import { Screen, ScreenHeader } from '@/components/ui';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { StickerBook } from '@/features/student/components/StickerBook';
import { roles } from '@/theme';

/** The sticker book for secondary students (primary pupils have it as a tab). */
export default function StickersScreen() {
  const theme = isPrimary(useStudentHome().data) ? roles.studentPrimary : roles.student;
  return (
    <Screen background={theme.bg} accent={theme.accent} edges={['top', 'bottom']}>
      <ScreenHeader title="My stickers" />
      <StickerBook theme={theme} />
    </Screen>
  );
}
