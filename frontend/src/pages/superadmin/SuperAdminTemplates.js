import React from 'react';
import { LayoutTemplate } from 'lucide-react';

export default function SuperAdminTemplates() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <LayoutTemplate size={22} color="#1a1f8c" />
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Certificate Templates</h2>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px' }}>
        Create and manage certificate templates for different courses and achievements.
      </p>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '40px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center',
        border: '1px dashed #e2e8f0',
      }}>
        <LayoutTemplate size={40} color="#e2e8f0" style={{ marginBottom: '12px' }} />
        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No templates yet. This section is under construction.</div>
      </div>
    </div>
  );
}
