'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 105, background: 'rgba(26,16,64,0.15)' }}
          onClick={onClose}
        />
      )}
      <div className={`drawer${open ? ' open' : ''}`}>
        {title && (
          <div className="drawer-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px', borderBottom: '1px solid var(--app-border)', position: 'sticky', top: 0, background: 'var(--app-surface)', zIndex: 2 }}>
            <h3 style={{ fontSize: 17 }}>{title}</h3>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
