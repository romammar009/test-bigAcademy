import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { BarChart2, BookOpen, Users, AlertTriangle } from 'lucide-react';

export default function HRReports() {
  const [completionData, setCompletionData] = useState([]);
  const [staffData, setStaffData]           = useState([]);
  const [activeReport, setActiveReport]     = useState('completion');
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/completion/'),
      API.get('/reports/staff/')
    ]).then(([comp, staff]) => {
      setCompletionData(comp.data);
      setStaffData(staff.data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const S = {
    title: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
    toggleRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
    toggleBtn: (isActive) => ({
      padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
      cursor: 'pointer', border: 'none', transition: 'all 0.15s',
      background: isActive ? '#1a1f8c' : '#f1f5f9',
      color:      isActive ? '#fff'     : '#64748b',
    }),
    table:  { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    th:     { padding: '12px 16px', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' },
    td:     { padding: '13px 16px', fontSize: '0.875rem', color: '#334155', borderBottom: '1px solid #f8fafc' },
    nameTd: { fontWeight: '600', color: '#0f172a' },
    badge: (type) => {
      const config = {
        success: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
        warning: { bg: '#fefce8', color: '#d97706', border: '#fde68a' },
        neutral: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
        danger:  { bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
      };
      const c = config[type] || config.neutral;
      return { fontSize: '0.78rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}` };
    },
    progressBar: { height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', flex: 1 },
    progressFill: (pct) => ({ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: '10px' }),
    progressRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    progressPct: { fontSize: '0.78rem', fontWeight: '700', color: '#64748b', minWidth: '36px', textAlign: 'right' },
    flagBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '600', padding: '3px 9px', borderRadius: '20px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' },
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading reports...</p>;

  return (
    <div>
      <div style={S.title}>
        <BarChart2 size={18} color="#1a1f8c" />
        Reports
      </div>

      <div style={S.toggleRow}>
        <button style={S.toggleBtn(activeReport === 'completion')} onClick={() => setActiveReport('completion')}>
          <BookOpen size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Course Completion
        </button>
        <button style={S.toggleBtn(activeReport === 'staff')} onClick={() => setActiveReport('staff')}>
          <Users size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Staff Progress
        </button>
      </div>

      {/* Course Completion */}
      {activeReport === 'completion' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Course', 'Total Enrolled', 'Completed', 'In Progress', 'Not Started', 'Completion Rate'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completionData.map(course => (
                <tr key={course.course_id}>
                  <td style={{ ...S.td, ...S.nameTd }}>{course.course_title}</td>
                  <td style={S.td}>{course.total}</td>
                  <td style={S.td}><span style={S.badge('success')}>{course.completed}</span></td>
                  <td style={S.td}><span style={S.badge('warning')}>{course.in_progress}</span></td>
                  <td style={S.td}><span style={S.badge('neutral')}>{course.not_started}</span></td>
                  <td style={S.td}>
                    <div style={S.progressRow}>
                      <div style={S.progressBar}>
                        <div style={S.progressFill(course.completion_rate)} />
                      </div>
                      <span style={S.progressPct}>{course.completion_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Progress */}
      {activeReport === 'staff' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Name', 'Role', 'Email', 'Location', 'Completed', 'In Progress', 'Not Started', 'Flags'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffData.map(staff => (
                <tr key={staff.user_id}>
                  <td style={{ ...S.td, ...S.nameTd }}>{staff.name}</td>
                  <td style={S.td}>
                    <span style={S.badge(staff.role === 'branch_manager' ? 'warning' : 'neutral')}>
                      {staff.role === 'branch_manager' ? 'Branch Manager' : 'Educator'}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: '#64748b', fontSize: '0.82rem' }}>{staff.email}</td>
                  <td style={{ ...S.td, color: '#64748b' }}>{staff.location}</td>
                  <td style={S.td}><span style={S.badge('success')}>{staff.completed}</span></td>
                  <td style={S.td}><span style={S.badge('warning')}>{staff.in_progress}</span></td>
                  <td style={S.td}><span style={S.badge('neutral')}>{staff.not_started}</span></td>
                  <td style={S.td}>
                    {staff.has_locked_quiz ? (
                      <span style={S.flagBadge}>
                        <AlertTriangle size={11} /> Quiz Locked
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}