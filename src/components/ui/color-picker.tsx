'use client';

import * as React from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

const ColorPicker = React.forwardRef<HTMLButtonElement, ColorPickerProps>(
  ({ value, onChange, onBlur, disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    
    // Fix: Always initialize with a defined value to prevent uncontrolled->controlled switch
    const [internalValue, setInternalValue] = React.useState(value || '#FFFFFF');

    const parsedValue = React.useMemo(() => {
      return value || '#FFFFFF';
    }, [value]);

    React.useEffect(() => {
      // Fix: Always set a defined value
      setInternalValue(value || '#FFFFFF');
    }, [value]);

    const handleColorChange = (newColor: string) => {
      setInternalValue(newColor);
      onChange(newColor);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(newValue) || newValue === '') {
        setInternalValue(newValue);
        onChange(newValue);
      }
    };

    const handleInputBlur = () => {
      // Validate and correct the hex value on blur
      if (!/^#[0-9A-F]{6}$/i.test(internalValue)) {
        setInternalValue(parsedValue);
      }
      onBlur?.();
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <div
              className="w-8 h-8 rounded border border-gray-300 mr-3 flex-shrink-0"
              style={{ backgroundColor: parsedValue }}
            />
            <span className="flex-1 truncate">{parsedValue}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <HexColorPicker
              color={parsedValue}
              onChange={handleColorChange}
              className="w-full !h-32"
            />
            <Input
              value={internalValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="#000000"
              className="font-mono text-sm"
              maxLength={7}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
export type { ColorPickerProps };