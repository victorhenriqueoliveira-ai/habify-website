import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { passwordStrength } from './checkoutFields';

interface CheckoutFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  /** Mensagem de erro, ou null quando válido. Só exibida depois de tocado. */
  error: string | null;
  hint: string;
  touched: boolean;
  type?: string;
  inputMode?: 'text' | 'email' | 'numeric' | 'tel';
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  showStrength?: boolean;
}

export function CheckoutField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  touched,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  disabled,
  className,
  showStrength,
}: CheckoutFieldProps) {
  const showError = touched && !!error;
  const showOk = !error && value.trim() !== '';
  const strength = showStrength ? passwordStrength(value) : 0;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[13.5px] font-semibold tracking-[-0.01em]">
        {label} <span className="text-primary">*</span>
      </label>

      <div className="relative flex items-center">
        <input
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={showError}
          aria-describedby={`${id}-msg`}
          className={cn(
            'w-full rounded-[10px] border-[1.5px] bg-background px-3.5 py-3 text-[15.5px] transition-[border-color,box-shadow]',
            'placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
            showError
              ? 'border-destructive bg-destructive/5 focus:shadow-[0_0_0_3px_hsl(var(--destructive)/0.16)]'
              : 'border-input hover:border-muted-foreground/40 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]',
            showOk && !showError && 'border-success/45 pr-10',
          )}
        />
        {showOk && !showError && (
          <span className="absolute right-3 grid h-[17px] w-[17px] place-items-center rounded-full bg-success text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden="true" />
          </span>
        )}
      </div>

      {showStrength && value && (
        <div className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((level) => (
            <span
              key={level}
              className={cn(
                'h-[3px] flex-1 rounded-full transition-colors',
                strength >= level
                  ? strength === 1
                    ? 'bg-destructive'
                    : strength === 2
                      ? 'bg-warning'
                      : 'bg-success'
                  : 'bg-muted',
              )}
            />
          ))}
        </div>
      )}

      <p
        id={`${id}-msg`}
        className={cn(
          'min-h-[17px] text-[12.5px] leading-snug',
          showError ? 'font-medium text-destructive' : 'text-muted-foreground',
        )}
      >
        {showError ? error : hint}
      </p>
    </div>
  );
}
