// Shared Indian mobile input: fixed +91 prefix, digits only, max 10 digits.
// Visual style matches the public form inputs (h-12, rounded, focus ring).
export default function PhoneInput({ value, onChange, className = '', placeholder = '98200 12345', label = 'Phone number' }) {
  const digits = String(value ?? '').replace(/\D+/g, '');
  const shown = digits.length > 10 ? digits.replace(/^(91|0)/, '').slice(0, 10) : digits;
  return (
    <div className={`flex items-stretch h-12 rounded-lg bg-surface-container-low border-[1.5px] border-outline-variant focus-within:border-secondary transition-colors overflow-hidden ${className}`}>
      <span aria-hidden="true" className="flex items-center pl-4 pr-3 font-label-lg text-label-lg text-on-surface-variant border-r border-outline-variant select-none shrink-0">+91</span>
      <input
        value={shown}
        onChange={(e) => onChange(e.target.value.replace(/\D+/g, '').slice(0, 10))}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={10}
        aria-label={label}
        className="w-full min-w-0 bg-transparent px-4 outline-none border-0 font-body-md text-body-md placeholder:text-outline"
      />
    </div>
  );
}
