import type { ComponentProps } from 'react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { ChipGroup, TextField } from '@/components/ui';

type Bound<T extends FieldValues> = { control: Control<T>; name: FieldPath<T> };

/** TextField wired to react-hook-form: value, change, blur, focus-on-error and the error message. */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  onBlur,
  format,
  ...props
}: Bound<T> & Omit<ComponentProps<typeof TextField>, 'value' | 'onChangeText' | 'error'> & { /** Clean input as it's typed, e.g. digits only. */ format?: (text: string) => string }) {
  const {
    field: { ref, value, onChange, onBlur: markTouched },
    fieldState: { error },
  } = useController({ control, name });
  return (
    <TextField
      ref={ref}
      value={value ?? ''}
      onChangeText={(text) => onChange(format ? format(text) : text)}
      onBlur={(e) => {
        markTouched();
        onBlur?.(e);
      }}
      error={error?.message}
      {...props}
    />
  );
}

/** Single-choice ChipGroup wired to react-hook-form. */
export function FormChipGroup<T extends FieldValues, V extends string>({ control, name, ...props }: Bound<T> & Omit<ComponentProps<typeof ChipGroup<V>>, 'value' | 'onChange' | 'error'>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name });
  return <ChipGroup<V> value={value ?? null} onChange={onChange} error={error?.message} {...props} />;
}

/** Multi-choice ChipGroup (toggles values in an array) wired to react-hook-form. */
export function FormMultiChipGroup<T extends FieldValues, V extends string>({ control, name, ...props }: Bound<T> & Omit<ComponentProps<typeof ChipGroup<V>>, 'value' | 'onChange' | 'error'>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name });
  const list: V[] = value ?? [];
  return (
    <ChipGroup<V>
      value={list}
      onChange={(v) => onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])}
      error={error?.message}
      {...props}
    />
  );
}
