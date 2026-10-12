import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Caption, Card, GameButton, Label } from '@/components/ui';
import { usePendingChildren, useRespondToChild, type PendingChild } from '@/features/parent/api';
import { friendlyError } from '@/lib/api';
import { palette, roles } from '@/theme';

const theme = roles.parent;

/**
 * A school can say "this account is the parent of X", but only the account holder can confirm it.
 * Until they accept here, the child stays off their account.
 */
export function PendingChildren() {
  const pending = usePendingChildren();
  if (!pending.data?.length) return null;
  return (
    <View className="gap-3">
      {pending.data.map((c) => (
        <PendingCard key={c.studentId} child={c} />
      ))}
    </View>
  );
}

function PendingCard({ child }: { child: PendingChild }) {
  const respond = useRespondToChild();
  const answer = (accept: boolean) =>
    respond.mutate(
      { studentId: child.studentId, accept },
      {
        onSuccess: () => toast.success(accept ? `${child.firstName} is now on your account` : 'Thanks. We’ve removed the link.'),
        onError: (e) => toast.error(friendlyError(e)),
      },
    );
  const relation = child.relationship === 'MOTHER' ? 'mother' : child.relationship === 'FATHER' ? 'father' : 'parent or guardian';
  return (
    <Card className="gap-3" style={{ borderWidth: 2, borderColor: palette.sun[400] }}>
      <View className="flex-row items-center gap-2">
        <Ionicons name="person-add" size={20} color={palette.ink.DEFAULT} />
        <Label className="flex-1">Is {child.firstName} your child?</Label>
      </View>
      <Caption>
        {child.schoolName ?? 'A school'} added you as {child.firstName} {child.lastName}’s {relation} ({child.className}). Accept to see their reports, fees and wallet. If this isn’t your child, tap “Not my child”.
      </Caption>
      <View className="flex-row gap-3">
        <GameButton label="Not my child" variant="outline" size="md" className="flex-1" disabled={respond.isPending} onPress={() => answer(false)} />
        <GameButton label="Accept" color={theme.accent} shadowColor={theme.shadow} size="md" className="flex-1" loading={respond.isPending && respond.variables?.accept} onPress={() => answer(true)} />
      </View>
    </Card>
  );
}
