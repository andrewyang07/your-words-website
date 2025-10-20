'use client';

interface SliderProps {
    id: string;
    label?: string;
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    showValue?: boolean;
    className?: string;
}

export default function Slider({ id, label, min, max, value, onChange, showValue = true, className = '' }: SliderProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {label && (
                <label htmlFor={id} className="font-chinese text-bible-700 dark:text-bible-300 whitespace-nowrap text-sm">
                    {label}
                </label>
            )}
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1 h-2 bg-bible-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-bible-600 dark:accent-bible-400 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-bible-600 dark:[&::-webkit-slider-thumb]:bg-bible-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-bible-600 dark:[&::-moz-range-thumb]:bg-bible-400 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110"
                style={{ minWidth: '80px' }}
            />
            {showValue && (
                <span className="font-chinese text-bible-700 dark:text-bible-300 font-semibold min-w-[2ch] text-center text-sm">{value}</span>
            )}
        </div>
    );
}
