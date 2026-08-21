const paths = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  emergency: <><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></>,
  bed: <><path d="M3 5v16M21 21v-8H3M7 13V8h6a4 4 0 0 1 4 4v1"/></>,
  clinical: <><path d="M6 3v5a6 6 0 0 0 12 0V3M12 14v3a4 4 0 0 0 8 0v-2"/><circle cx="20" cy="13" r="2"/></>,
  discharge: <><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  account: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  alert: <><path d="M10.3 3.3 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  stock: <><path d="m21 8-9 5-9-5 9-5z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5z"/></>,
  surgery: <><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></>,
  diagnostic: <><path d="M3 3v18h18"/><path d="m7 16 4-5 3 3 5-7"/></>,
  finance: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 15h2M11 11h2M15 8h2M15 15h2"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>
};

export default function Icon({ name, size = 18, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.home}</svg>;
}
