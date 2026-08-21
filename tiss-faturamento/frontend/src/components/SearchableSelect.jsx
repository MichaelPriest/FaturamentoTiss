import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { filterSearchOptions } from '../lib/optionSearch';

export default function SearchableSelect({ label, value, onChange, options = [], required = false, placeholder = 'Digite para localizar...', getLabel = option => option.label ?? option.nome ?? '', emptyMessage = 'Nenhum registro localizado.' }) {
  const getValue = option => option.value ?? option.id;
  const legacyEventMode = options.some(option => Object.hasOwn(option, 'value'));
  const selected = options.find(option => String(getValue(option)) === String(value));
  const [query, setQuery] = useState(selected ? getLabel(selected) : '');
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  useEffect(() => { setQuery(selected ? getLabel(selected) : ''); }, [value, selected?.id]);
  useEffect(() => { const close = event => { if (!container.current?.contains(event.target)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const filtered = useMemo(() => filterSearchOptions(options, selected && query === getLabel(selected) ? '' : query, getLabel).slice(0, 30), [options, query, selected?.id, getLabel]);

  const emit = nextValue => onChange(legacyEventMode ? { target: { value: nextValue } } : String(nextValue));
  const choose = option => { emit(getValue(option)); setQuery(getLabel(option)); setOpen(false); };
  const clear = () => { emit(''); setQuery(''); setOpen(true); };

  return <label className="block text-sm dark:text-gray-200" ref={container}>{label}{required && <span className="text-red-500"> *</span>}
    <div className="relative mt-1">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); emit(''); setOpen(true); }} placeholder={placeholder} required={required} pattern={required&&!value?'(?!)':undefined} title={required&&!value?'Selecione um registro na lista de resultados.':undefined} autoComplete="off" className="input !mt-0 !pl-9 !pr-16" />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">{value&&<button type="button" onClick={clear} className="rounded p-1 text-slate-400 hover:bg-slate-100"><XMarkIcon className="h-4 w-4"/></button>}<button type="button" onClick={() => setOpen(current => !current)} className="rounded p-1 text-slate-400"><ChevronUpDownIcon className="h-4 w-4"/></button></div>
      {open&&<div className="absolute z-[70] mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">{filtered.map(option=><button type="button" key={getValue(option)} onClick={() => choose(option)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-cyan-50 dark:text-gray-200 dark:hover:bg-gray-700"><span>{getLabel(option)}</span>{String(getValue(option))===String(value)&&<CheckIcon className="h-4 w-4 text-cyan-600"/>}</button>)}{!filtered.length&&<p className="px-3 py-6 text-center text-xs text-slate-500">{emptyMessage}</p>}</div>}
    </div>
  </label>;
}
