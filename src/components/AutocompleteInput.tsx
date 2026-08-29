import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { matchesSearchQuery } from '../utils/normalizer';

interface AutocompleteInputProps {
  id?: string;
  label?: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  icon?: React.ElementType;
  className?: string;
  countBadge?: number;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  onSelect,
  icon: Icon = Search,
  className = '',
  countBadge
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on input value
  const filteredOptions = options.filter(opt => matchesSearchQuery(opt, value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onSelect(filteredOptions[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    onSelect(opt);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    onSelect('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          {countBadge !== undefined && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {countBadge} disponibles
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Icon className="w-4 h-4 text-cyan-700" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all shadow-xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1 text-slate-400">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-sm">
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 50).map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(opt)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                  idx === highlightedIndex
                    ? 'bg-cyan-50 text-cyan-950 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{opt}</span>
                {opt === value && (
                  <span className="text-[11px] bg-cyan-600 text-white px-2 py-0.5 rounded-full font-medium ml-2 shrink-0">
                    Seleccionado
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">
              No se encontraron coincidencias para &quot;{value}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};
