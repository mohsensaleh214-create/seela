import { useId, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function FieldWrapper({ label, hint, error, required, children }: FieldWrapperProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-muted">
        {label}
        {required && <span className="text-urgent"> *</span>}
      </label>
      {children(id, describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-[13px] text-urgent" role="alert">
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  'w-full rounded-[8px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-ink disabled:bg-surface-sunken disabled:text-ink-muted min-h-[44px]';

type TextFieldProps = { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, hint, error, required, ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          required={required}
          className={`${inputBase} ${error ? 'border-urgent' : ''}`}
          {...rest}
        />
      )}
    </FieldWrapper>
  );
}

type TextAreaFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  maxLength?: number;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, hint, error, required, maxLength, value, ...rest }: TextAreaFieldProps) {
  const len = typeof value === 'string' ? value.length : 0;
  return (
    <FieldWrapper
      label={label}
      hint={maxLength ? `${hint ? hint + ' — ' : ''}${len}/${maxLength} characters` : hint}
      error={error}
      required={required}
    >
      {(id, describedBy) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          required={required}
          maxLength={maxLength}
          value={value}
          rows={5}
          className={`${inputBase} min-h-[120px] resize-y leading-[1.55]`}
          {...rest}
        />
      )}
    </FieldWrapper>
  );
}

type SelectFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ label, hint, error, required, children, ...rest }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          required={required}
          className={`${inputBase} bg-surface`}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}

export function DateField({ label, hint, error, required, ...rest }: TextFieldProps) {
  return <TextField label={label} hint={hint} error={error} required={required} type="date" {...rest} />;
}
