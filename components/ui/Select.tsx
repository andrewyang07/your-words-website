'use client';

import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';

export interface SelectOption<T = string> {
    value: T;
    label: string;
}

interface SelectProps<T = string> {
    value: T;
    onChange: (value: T) => void;
    options: SelectOption<T>[];
    className?: string;
    label?: string;
}

export default function Select<T extends string>({ value, onChange, options, className = '', label }: SelectProps<T>) {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={`relative ${className}`}>
            {label && <label className="block text-xs text-bible-600 dark:text-bible-400 font-chinese mb-1">{label}</label>}
            <Listbox value={value} onChange={onChange}>
                <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm border border-bible-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-bible-500 dark:focus:ring-bible-400 min-h-[44px] touch-manipulation transition-colors hover:bg-bible-50 dark:hover:bg-gray-700">
                        <span className="block truncate font-chinese text-bible-700 dark:text-bible-300 text-sm">{selectedOption?.label}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-4 w-4 text-bible-400 dark:text-gray-500" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={String(option.value)}
                                    value={option.value}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 font-chinese text-sm ${
                                            active
                                                ? 'bg-bible-100 dark:bg-gray-700 text-bible-900 dark:text-bible-100'
                                                : 'text-bible-700 dark:text-bible-300'
                                        }`
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={`block ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                                            {selected && (
                                                <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bible-600 dark:text-bible-400" />
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
}
