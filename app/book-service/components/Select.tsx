import Icon from '@/app/components/ui/AppIcon';

interface SelectProps {
    id: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    icon?: string;
  }

export const inputCls =
'h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20';
  
export default function Select({ id, value, onChange, options, icon }: SelectProps) {
    return (
      <div className="relative">
        {icon && (
          <Icon name={icon} size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} appearance-none pr-9 ${icon ? 'pl-10' : ''}`}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Icon
          name="ChevronDownIcon"
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  }
  