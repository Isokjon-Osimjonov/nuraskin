import * as React from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
}

export function NumberInput({
  value,
  onChange,
  allowDecimals = false,
  className,
  min,
  max,
  ...props
}: NumberInputProps) {
  // Store as string internally so user can clear and type freely
  const [internal, setInternal] = React.useState<string>(
    value == null || value === 0 ? '' : String(value)
  );

  // Sync external value changes
  React.useEffect(() => {
    if (value == null || value === 0) {
      setInternal(prev => (prev === '' || prev === '0' ? prev : ''));
    } else {
      setInternal(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.'); // Allow comma as decimal separator

    // Allow empty — user is clearing
    if (raw === '' || raw === '-') {
      setInternal(raw);
      onChange(undefined);
      return;
    }

    // Allow partial decimal like "14."
    if (allowDecimals && raw.endsWith('.')) {
      // Prevent multiple dots
      if ((raw.match(/\./g) || []).length > 1) return;
      setInternal(raw);
      return;
    }

    // Basic numeric validation before parsing
    const numericRegex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
    if (!numericRegex.test(raw)) return;

    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);

    if (isNaN(parsed)) return;
    if (min !== undefined && parsed < min) return;
    if (max !== undefined && parsed > max) return;

    setInternal(raw);
    onChange(parsed);
  };

  const handleBlur = () => {
    // Clean up partial decimals on blur
    if (internal === '' || internal === '.' || internal === '-') {
      setInternal('');
      onChange(undefined);
      return;
    }
    const parsed = allowDecimals ? parseFloat(internal) : parseInt(internal, 10);

    if (!isNaN(parsed)) {
      setInternal(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <input
      {...props}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      pattern={allowDecimals ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      value={internal}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    />
  );
}
