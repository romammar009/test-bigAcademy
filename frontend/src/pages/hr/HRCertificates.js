import React from 'react';
import { Award } from 'lucide-react';

export default function HRCertificates() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Award size={22} color="#b5132a" />
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Certificates</h2>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px' }}>
        Manage and issue certificates to staff members.
      </p>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '40px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center',
        border: '1px dashed #e2e8f0',
      }}>
        <Award size={40} color="#e2e8f0" style={{ marginBottom: '12px' }} />
        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No certificates yet. This section is under construction.</div>
      </div>
    </div>
  );
}
