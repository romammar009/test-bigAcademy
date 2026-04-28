import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import {
  ChevronLeft, ChevronDown, ChevronUp, Plus, X,
  BookOpen, PenLine, GraduationCap, Trash2, Edit,
  Video, FileText, FileIcon, BookMarked, Upload,
  CheckCircle, XCircle
} from 'lucide-react';

export default function AdminCourseBuilder({ course, onBack }) {
  const [modules, setModules]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState({ text: '', type: 'success' });
  const [expandedModule, setExpanded] = useState(null);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm]         = useState({ title: '', sort_order: 1 });
  const [savingModule, setSavingModule]     = useState(false);
  const [editingModule, setEditingModule]   = useState(null);

  const [activeLessonModule, setActiveLessonModule] = useState(null);
  const [lessonForm, setLessonForm]                 = useState({
    title: '', content_type: 'video', content_url: '', duration_seconds: '', sort_order: 1
  });
  const [savingLesson, setSavingLesson]   = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [activeQuizModule, setActiveQuizModule] = useState(null);
  const [quizForm, setQuizForm]                 = useState({ title: '', pass_mark_percent: 80, attempt_limit: 3 });
  const [savingQuiz, setSavingQuiz]   = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const [activeQuestionQuiz, setActiveQuestionQuiz] = useState(null);
  const [questionForm, setQuestionForm]             = useState({ question_text: '', question_type: 'mcq', sort_order: 1 });
  const [savingQuestion, setSavingQuestion]   = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [expandedQuiz, setExpandedQuiz]       = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const [activeOptionQuestion, setActiveOptionQuestion] = useState(null);
  const [optionForm, setOptionForm]                     = useState({ option_text: '', is_correct: false, sort_order: 1 });
  const [savingOption, setSavingOption]   = useState(false);
  const [editingOption, setEditingOption] = useState(null);

  useEffect(() => { fetchModules(); }, []);

  const fetchModules = async () => {
    try {
      const res = await API.get(`/courses/${course.id}/`);
      setModules(res.data.modules || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'success' }), 3000);
  };

  const confirmDelete = (label) => window.confirm(`Delete "${label}"? This cannot be undone.`);

  const handleAddModule = async (e) => {
    e.preventDefault(); setSavingModule(true);
    try { await API.post(`/courses/${course.id}/modules/`, moduleForm); showMsg('Module added.'); setModuleForm({ title: '', sort_order: modules.length + 2 }); setShowModuleForm(false); fetchModules(); }
    catch { showMsg('Could not add module.', 'error'); } finally { setSavingModule(false); }
  };

  const handleEditModule = async (e) => {
    e.preventDefault(); setSavingModule(true);
    try { await API.patch(`/modules/${editingModule.id}/edit/`, moduleForm); showMsg('Module updated.'); setEditingModule(null); fetchModules(); }
    catch { showMsg('Could not update module.', 'error'); } finally { setSavingModule(false); }
  };

  const handleDeleteModule = async (module) => {
    if (!confirmDelete(module.title)) return;
    try { await API.delete(`/modules/${module.id}/delete/`); showMsg('Module deleted.'); fetchModules(); }
    catch { showMsg('Could not delete module.', 'error'); }
  };

  const handleFileUpload = async (file, contentType) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content_type', contentType);
      const res = await API.post('/lessons/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setLessonForm(prev => ({ ...prev, content_url: res.data.url }));
      showMsg(`File uploaded: ${res.data.filename}`);
    } catch { showMsg('File upload failed.', 'error'); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault(); setSavingLesson(true);
      try {
        await API.post(`/modules/${activeLessonModule}/lessons/`, {
          ...lessonForm,
          duration_seconds: lessonForm.duration_seconds || null,
        });
        showMsg('Lesson added.');
        setLessonForm({ title: '', content_type: 'video', content_url: '', duration_seconds: '', sort_order: 1 });
        setActiveLessonModule(null);
        fetchModules();
      } catch { showMsg('Could not add lesson.', 'error'); } finally { setSavingLesson(false); }
    };

  const handleEditLesson = async (e) => {
    e.preventDefault(); setSavingLesson(true);
    try {
      await API.patch(`/lessons/${editingLesson.id}/edit/`, {
        ...lessonForm,
        duration_seconds: lessonForm.duration_seconds || null,
      });
      showMsg('Lesson updated.');
      setEditingLesson(null);
      fetchModules();
    } catch { showMsg('Could not update lesson.', 'error'); } finally { setSavingLesson(false); }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!confirmDelete(lesson.title)) return;
    try { await API.delete(`/lessons/${lesson.id}/delete/`); showMsg('Lesson deleted.'); fetchModules(); }
    catch { showMsg('Could not delete lesson.', 'error'); }
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault(); setSavingQuiz(true);
    try {
      await API.post(`/courses/${course.id}/quizzes/`, { ...quizForm, module_id: activeQuizModule });
      showMsg('Quiz added.');
      setQuizForm({ title: '', pass_mark_percent: 80, attempt_limit: 3 });
      setActiveQuizModule(null);
      fetchModules();
    }
    catch { showMsg('Could not add quiz.', 'error'); } finally { setSavingQuiz(false); }
  };

  const handleEditQuiz = async (e) => {
    e.preventDefault(); setSavingQuiz(true);
    try { await API.patch(`/quizzes/${editingQuiz.id}/edit/`, quizForm); showMsg('Quiz updated.'); setEditingQuiz(null); fetchModules(); }
    catch { showMsg('Could not update quiz.', 'error'); } finally { setSavingQuiz(false); }
  };

  const handleDeleteQuiz = async (quiz) => {
    if (!confirmDelete(quiz.title)) return;
    try { await API.delete(`/quizzes/${quiz.id}/delete/`); showMsg('Quiz deleted.'); fetchModules(); }
    catch { showMsg('Could not delete quiz.', 'error'); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault(); setSavingQuestion(true);
    try { await API.post(`/quizzes/${activeQuestionQuiz.id}/questions/`, questionForm); showMsg('Question added.'); setQuestionForm({ question_text: '', question_type: 'mcq', sort_order: 1 }); fetchModules(); }
    catch { showMsg('Could not add question.', 'error'); } finally { setSavingQuestion(false); }
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault(); setSavingQuestion(true);
    try { await API.patch(`/questions/${editingQuestion.id}/edit/`, questionForm); showMsg('Question updated.'); setEditingQuestion(null); fetchModules(); }
    catch { showMsg('Could not update question.', 'error'); } finally { setSavingQuestion(false); }
  };

  const handleDeleteQuestion = async (question) => {
    if (!confirmDelete(question.question_text)) return;
    try { await API.delete(`/questions/${question.id}/delete/`); showMsg('Question deleted.'); fetchModules(); }
    catch { showMsg('Could not delete question.', 'error'); }
  };

  const handleAddOption = async (e) => {
    e.preventDefault(); setSavingOption(true);
    try {
      const payload = { ...optionForm, sort_order: optionForm.sort_order || 1 };
      await API.post(`/questions/${activeOptionQuestion.id}/options/`, payload);
      showMsg('Option added.');
      setOptionForm({ option_text: '', is_correct: false, sort_order: 1 });
      fetchModules();
    } catch { showMsg('Could not add option.', 'error'); } finally { setSavingOption(false); }
  };

  const handleEditOption = async (e) => {
    e.preventDefault(); setSavingOption(true);
    try { await API.patch(`/options/${editingOption.id}/edit/`, optionForm); showMsg('Option updated.'); setEditingOption(null); fetchModules(); }
    catch { showMsg('Could not update option.', 'error'); } finally { setSavingOption(false); }
  };

  const handleDeleteOption = async (option) => {
    if (!confirmDelete(option.option_text)) return;
    try { await API.delete(`/options/${option.id}/delete/`); showMsg('Option deleted.'); fetchModules(); }
    catch { showMsg('Could not delete option.', 'error'); }
  };

  const contentTypeIcon = (type) => {
    if (type === 'video')   return <Video size={14} color="#2563eb" />;
    if (type === 'youtube') return <Video size={14} color="#ef4444" />;
    if (type === 'pdf')     return <FileText size={14} color="#7c3aed" />;
    if (type === 'ppt')     return <FileIcon size={14} color="#d97706" />;
    if (type === 'article') return <BookMarked size={14} color="#059669" />;
    return <FileIcon size={14} color="#94a3b8" />;
  };

  const contentTypeBadgeColor = (type) => {
    const config = {
      video:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
      youtube: { bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
      pdf:     { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
      ppt:     { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
      article: { bg: '#f0fdf4', color: '#059669', border: '#bbf7d0' },
    };
    return config[type] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  };

  const S = {
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#2563eb', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', padding: '0', marginBottom: '20px' },
    header:  { marginBottom: '24px' },
    title:   { fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' },
    sub:     { fontSize: '0.82rem', color: '#94a3b8' },
    message: (type) => ({ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '500', background: type === 'success' ? '#f0fdf4' : '#fef2f2', color: type === 'success' ? '#059669' : '#ef4444', border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}` }),
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    sectionTitle:  { fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' },
    primaryBtn: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: disabled ? '#f1f5f9' : '#2563eb', color: disabled ? '#94a3b8' : '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer' }),
    secondaryBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' },
    dangerBtn:  { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
    warningBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
    outlineBtn: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
    successBtn: (disabled) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: disabled ? '#f1f5f9' : '#059669', color: disabled ? '#94a3b8' : '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer' }),
    formCard: { background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '12px' },
    formTitle: { fontSize: '0.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '14px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' },
    formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' },
    formGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
    label:     { fontSize: '0.75rem', fontWeight: '600', color: '#374151' },
    input:     { padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit' },
    select:    { padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: '#fff' },
    textarea:  { padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: '100px', width: '100%', boxSizing: 'border-box' },
    fileInput: { padding: '8px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#1e293b', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    btnRow:    { display: 'flex', gap: '8px', marginTop: '14px' },
    moduleCard: { background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '10px', overflow: 'hidden' },
    moduleHeader: (isOpen) => ({ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: isOpen ? '#f8fafc' : '#fff', borderBottom: isOpen ? '1px solid #e2e8f0' : 'none', userSelect: 'none' }),
    moduleBadge: { fontSize: '0.7rem', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', flexShrink: 0 },
    moduleTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', flex: 1 },
    moduleMeta:  { fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 },
    moduleBody:  { padding: '18px' },
    moduleActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '16px' },
    subSectionTitle: { fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' },
    lessonItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '6px' },
    lessonTitle: { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', flex: 1 },
    typeBadge: (type) => { const c = contentTypeBadgeColor(type); return { fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }; },
    lessonDuration: { fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 },
    divider: { height: '1px', background: '#f1f5f9', margin: '16px 0' },
    quizCard: { background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', padding: '14px 16px', marginBottom: '10px' },
    quizTitle: { fontSize: '0.875rem', fontWeight: '700', color: '#1e293b', flex: 1 },
    quizMeta:  { fontSize: '0.75rem', color: '#92400e' },
    questionItem: { background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '12px 14px', marginBottom: '8px' },
    questionBadge: (type) => ({ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', flexShrink: 0 }),
    questionText: { fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', flex: 1 },
    optionItem: (isCorrect) => ({ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: isCorrect ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isCorrect ? '#bbf7d0' : '#f1f5f9'}`, marginBottom: '4px' }),
    optionText: (isCorrect) => ({ fontSize: '0.82rem', color: isCorrect ? '#059669' : '#475569', fontWeight: isCorrect ? '600' : '400', flex: 1 }),
    uploadProgress: { height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' },
    uploadFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: '10px', transition: 'width 0.2s' }),
    uploadSuccess: { fontSize: '0.78rem', color: '#059669', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' },
    emptyState: { textAlign: 'center', padding: '32px 24px', color: '#94a3b8', fontSize: '0.875rem' },
  };

  const renderLessonFormFields = () => (
    <div>
      <div style={S.formGrid}>
        <div style={{ ...S.formGroup, gridColumn: '1 / 3' }}>
          <label style={S.label}>Lesson Title</label>
          <input style={S.input} value={lessonForm.title}
            onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
            placeholder="e.g. Introduction Video" required />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Duration (seconds)</label>
          <input type="number" style={S.input} value={lessonForm.duration_seconds}
            onChange={e => setLessonForm({ ...lessonForm, duration_seconds: e.target.value })}
            placeholder="e.g. 300" />
        </div>
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>Content Type</label>
        <select style={S.select} value={lessonForm.content_type}
          onChange={e => setLessonForm({ ...lessonForm, content_type: e.target.value, content_url: '' })}>
          <option value="video">Video (File Upload)</option>
          <option value="youtube">YouTube URL</option>
          <option value="pdf">PDF (File Upload)</option>
          <option value="ppt">PPT (File Upload)</option>
          <option value="article">Article / Text</option>
        </select>
      </div>

      {lessonForm.content_type === 'video' && (
        <div style={S.formGroup}>
          <label style={S.label}>Upload Video File</label>
          <input type="file" style={S.fileInput} accept=".mp4,.mov,.avi,.webm"
            onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')} />
          {uploading && <div style={S.uploadProgress}><div style={S.uploadFill(uploadProgress)} /></div>}
          {lessonForm.content_url && <div style={S.uploadSuccess}><CheckCircle size={13} /> {lessonForm.content_url.split('/').pop()}</div>}
        </div>
      )}

      {lessonForm.content_type === 'youtube' && (
        <div style={S.formGroup}>
          <label style={S.label}>YouTube Embed URL</label>
          <input style={S.input} value={lessonForm.content_url}
            onChange={e => setLessonForm({ ...lessonForm, content_url: e.target.value })}
            placeholder="https://www.youtube.com/embed/..." />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Use embed URL format: youtube.com/embed/VIDEO_ID</span>
        </div>
      )}

      {lessonForm.content_type === 'pdf' && (
        <div style={S.formGroup}>
          <label style={S.label}>Upload PDF File</label>
          <input type="file" style={S.fileInput} accept=".pdf"
            onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0], 'pdf')} />
          {uploading && <div style={S.uploadProgress}><div style={{ ...S.uploadFill(uploadProgress), background: '#7c3aed' }} /></div>}
          {lessonForm.content_url && <div style={S.uploadSuccess}><CheckCircle size={13} /> {lessonForm.content_url.split('/').pop()}</div>}
        </div>
      )}

      {lessonForm.content_type === 'ppt' && (
        <div style={S.formGroup}>
          <label style={S.label}>Upload PowerPoint File</label>
          <input type="file" style={S.fileInput} accept=".ppt,.pptx"
            onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0], 'ppt')} />
          {uploading && <div style={S.uploadProgress}><div style={{ ...S.uploadFill(uploadProgress), background: '#d97706' }} /></div>}
          {lessonForm.content_url && <div style={S.uploadSuccess}><CheckCircle size={13} /> {lessonForm.content_url.split('/').pop()}</div>}
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Displayed using Google Docs Viewer</span>
        </div>
      )}

      {lessonForm.content_type === 'article' && (
        <div style={S.formGroup}>
          <label style={S.label}>Article Content</label>
          <textarea style={S.textarea} value={lessonForm.content_url}
            onChange={e => setLessonForm({ ...lessonForm, content_url: e.target.value })}
            placeholder="Paste HTML content or text here..." />
        </div>
      )}
    </div>
  );

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading course content...</p>;

  return (
    <div>
      <button style={S.backBtn} onClick={onBack}>
        <ChevronLeft size={16} /> Back to Courses
      </button>

      <div style={S.header}>
        <div style={S.title}>{course.title}</div>
        <div style={S.sub}>Course Content Builder</div>
      </div>

      {message.text && <div style={S.message(message.type)}>{message.text}</div>}

      {/* Section Header */}
      <div style={S.sectionHeader}>
        <div style={S.sectionTitle}>Modules</div>
        <button style={S.primaryBtn(false)} onClick={() => { setShowModuleForm(!showModuleForm); setEditingModule(null); setModuleForm({ title: '', sort_order: modules.length + 1 }); }}>
          {showModuleForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Module</>}
        </button>
      </div>

      {/* Add Module Form */}
      {showModuleForm && (
        <div style={S.formCard}>
          <div style={S.formTitle}>New Module</div>
          <form onSubmit={handleAddModule}>
            <div style={S.formGroup}>
              <label style={S.label}>Module Title</label>
              <input
                key={`edit-module-${editingModule?.id}`}
                style={S.input}
                value={moduleForm.title}
                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                autoFocus
                required />
            </div>
            <div style={S.btnRow}>
              <button type="submit" style={S.primaryBtn(savingModule)} disabled={savingModule}>
                {savingModule ? 'Saving...' : 'Add Module'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Module Form */}
      {editingModule && (
        <div style={{ ...S.formCard, border: '1px solid #fde68a' }}>
          <div style={S.formTitle}>Edit Module</div>
          <form onSubmit={handleEditModule}>
            <div style={S.formGroup}>
              <label style={S.label}>Module Title</label>
              <input style={S.input} value={moduleForm.title}
                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required />
            </div>
            <div style={S.btnRow}>
              <button type="submit" style={S.warningBtn} disabled={savingModule}>{savingModule ? 'Saving...' : 'Update Module'}</button>
              <button type="button" style={S.secondaryBtn} onClick={() => setEditingModule(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Modules List */}
      {modules.length === 0 ? (
        <div style={S.emptyState}>
          <BookOpen size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
          <div>No modules yet. Add your first module above.</div>
        </div>
      ) : (
        <div>
          {modules.map((module, index) => (
            <div style={S.moduleCard} key={module.id}>
              <div style={S.moduleHeader(expandedModule === module.id)}
                onClick={() => setExpanded(expandedModule === module.id ? null : module.id)}>
                <span style={S.moduleBadge}>Module {index + 1}</span>
                <span style={S.moduleTitle}>{module.title}</span>
                <span style={S.moduleMeta}>{module.lessons?.length || 0} lesson(s) · {module.quizzes?.length || 0} quiz</span>
                {expandedModule === module.id ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
              </div>

              {expandedModule === module.id && (
                <div style={S.moduleBody}>
                  <div style={S.moduleActions}>
                    <button style={S.warningBtn} onClick={() => { setEditingModule(module); setModuleForm({ title: module.title, sort_order: module.sort_order }); setShowModuleForm(false); }}>
                      <Edit size={13} /> Edit Module
                    </button>
                    <button style={S.dangerBtn} onClick={() => handleDeleteModule(module)}>
                      <Trash2 size={13} /> Delete Module
                    </button>
                  </div>

                  {/* Lessons */}
                  <div style={S.subSectionTitle}>Lessons</div>
                  {module.lessons?.length > 0 ? (
                    <div style={{ marginBottom: '12px' }}>
                      {module.lessons.map(lesson => (
                        <div key={lesson.id}>
                          {editingLesson?.id === lesson.id ? (
                            <div style={{ ...S.formCard, marginBottom: '8px' }}>
                              <form onSubmit={handleEditLesson}>
                                {renderLessonFormFields()}
                                <div style={S.btnRow}>
                                  <button type="submit" style={S.warningBtn} disabled={savingLesson}>{savingLesson ? 'Saving...' : 'Update Lesson'}</button>
                                  <button type="button" style={S.secondaryBtn} onClick={() => setEditingLesson(null)}>Cancel</button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div key={lesson.id}>
                              <div style={S.lessonItem} onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}>
                                  {contentTypeIcon(lesson.content_type)}
                                  <span style={S.lessonTitle}>{lesson.title}</span>
                                  <span style={S.typeBadge(lesson.content_type)}>{lesson.content_type}</span>
                                  {lesson.duration_seconds && (
                                    <span style={S.lessonDuration}>{Math.round(lesson.duration_seconds / 60)} mins</span>
                                  )}
                                  <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                    <button style={S.warningBtn} onClick={() => { setEditingLesson(lesson); setLessonForm({ title: lesson.title, content_type: lesson.content_type, content_url: lesson.content_url || '', duration_seconds: lesson.duration_seconds || '', sort_order: lesson.sort_order }); }}>
                                      <Edit size={12} />
                                    </button>
                                    <button style={S.dangerBtn} onClick={() => handleDeleteLesson(lesson)}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  {expandedLesson === lesson.id ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
                                </div>

                                {expandedLesson === lesson.id && (
                                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '0 0 8px 8px', border: '1px solid #f1f5f9', borderTop: 'none', marginBottom: '6px' }}>
                                    {lesson.content_type === 'video' && (
                                      <video controls style={{ width: '100%', borderRadius: '6px' }} src={lesson.content_url} />
                                    )}
                                    {lesson.content_type === 'youtube' && (
                                      <iframe width="100%" height="250" src={lesson.content_url} frameBorder="0" allowFullScreen style={{ borderRadius: '6px' }} />
                                    )}
                                    {lesson.content_type === 'pdf' && (
                                      <iframe src={lesson.content_url} width="100%" height="400px" style={{ borderRadius: '6px', border: 'none' }} />
                                    )}
                                    {lesson.content_type === 'ppt' && (
                                      <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + lesson.content_url)}&embedded=true`} width="100%" height="400px" style={{ borderRadius: '6px', border: 'none' }} />
                                    )}
                                    {lesson.content_type === 'article' && (
                                      <div style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: lesson.content_url }} />
                                    )}
                                  </div>
                                )}
                          </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '12px' }}>No lessons yet.</div>
                  )}

                  {activeLessonModule === module.id ? (
                    <div style={{ ...S.formCard, border: '1px solid #bfdbfe', marginBottom: '16px' }}>
                      <div style={S.formTitle}>Add Lesson</div>
                      <form onSubmit={handleAddLesson}>
                        {renderLessonFormFields()}
                        <div style={S.btnRow}>
                          <button type="submit" style={S.successBtn(savingLesson)} disabled={savingLesson}>{savingLesson ? 'Saving...' : 'Add Lesson'}</button>
                          <button type="button" style={S.secondaryBtn} onClick={() => setActiveLessonModule(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button style={{ ...S.outlineBtn, marginBottom: '16px' }} onClick={() => { setActiveLessonModule(module.id); setActiveQuizModule(null); setEditingLesson(null); setLessonForm({ title: '', content_type: 'video', content_url: '', duration_seconds: '', sort_order: 1 }); }}>
                      <Plus size={13} /> Add Lesson
                    </button>
                  )}

                  <div style={S.divider} />

                  {/* Quiz */}
                  <div style={S.subSectionTitle}>Quiz</div>
                  {module.quizzes?.length > 0 ? (
                    module.quizzes.map(quiz => (
                      <div key={quiz.id} style={S.quizCard}>
                        {editingQuiz?.id === quiz.id ? (
                          <form onSubmit={handleEditQuiz}>
                            <div style={S.formGrid}>
                              <div style={{ ...S.formGroup, gridColumn: '1 / 2' }}>
                                <label style={S.label}>Quiz Title</label>
                                <input style={S.input} value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required />
                              </div>
                              <div style={S.formGroup}>
                                <label style={S.label}>Pass Mark (%)</label>
                                <input type="number" style={S.input} value={quizForm.pass_mark_percent} onChange={e => setQuizForm({ ...quizForm, pass_mark_percent: e.target.value })} min={1} max={100} />
                              </div>
                              <div style={S.formGroup}>
                                <label style={S.label}>Attempt Limit</label>
                                <input type="number" style={S.input} value={quizForm.attempt_limit} onChange={e => setQuizForm({ ...quizForm, attempt_limit: e.target.value })} min={1} />
                              </div>
                            </div>
                            <div style={S.btnRow}>
                              <button type="submit" style={S.warningBtn} disabled={savingQuiz}>{savingQuiz ? 'Saving...' : 'Update Quiz'}</button>
                              <button type="button" style={S.secondaryBtn} onClick={() => setEditingQuiz(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expandedQuiz === quiz.id ? '14px' : '0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <GraduationCap size={16} color="#d97706" />
                                <span style={S.quizTitle}>{quiz.title}</span>
                                <span style={S.quizMeta}>Pass: {quiz.pass_mark_percent}% · Attempts: {quiz.attempt_limit}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button style={S.outlineBtn} onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}>
                                  {expandedQuiz === quiz.id ? 'Hide' : 'Questions'}
                                </button>
                                <button style={S.warningBtn} onClick={() => { setEditingQuiz(quiz); setQuizForm({ title: quiz.title, pass_mark_percent: quiz.pass_mark_percent, attempt_limit: quiz.attempt_limit }); }}>
                                  <Edit size={12} />
                                </button>
                                <button style={S.dangerBtn} onClick={() => handleDeleteQuiz(quiz)}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {expandedQuiz === quiz.id && (
                              <div>
                                {quiz.questions?.length > 0 ? (
                                  <div style={{ marginBottom: '10px' }}>
                                    {quiz.questions.map((q, qi) => (
                                      <div key={q.id} style={S.questionItem}>
                                        {editingQuestion?.id === q.id ? (
                                          <form onSubmit={handleEditQuestion}>
                                            <div style={S.formGrid2}>
                                              <div style={S.formGroup}>
                                                <label style={S.label}>Question Text</label>
                                                <input style={S.input} value={questionForm.question_text} onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })} required />
                                              </div>
                                              <div style={S.formGroup}>
                                                <label style={S.label}>Type</label>
                                                <select style={S.select} value={questionForm.question_type} onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value })}>
                                                  <option value="single_choice">Single Choice (1 correct answer)</option>
                                                  <option value="mcq">Multiple Choice (multiple correct answers)</option>
                                                  <option value="truefalse">True / False</option>
                                                  <option value="short_answer">Short Answer</option>
                                                </select>
                                              </div>
                                            </div>
                                            <div style={S.btnRow}>
                                              <button type="submit" style={S.warningBtn} disabled={savingQuestion}>{savingQuestion ? 'Saving...' : 'Update'}</button>
                                              <button type="button" style={S.secondaryBtn} onClick={() => setEditingQuestion(null)}>Cancel</button>
                                            </div>
                                          </form>
                                        ) : (
                                          <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                                                <span style={S.questionBadge(q.question_type)}>{q.question_type}</span>
                                                <span style={S.questionText}>Q{qi + 1}: {q.question_text}</span>
                                              </div>
                                              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                {(q.question_type === 'mcq' || q.question_type === 'single_choice' || q.question_type === 'truefalse') && (
                                                  <button style={S.outlineBtn} onClick={() => { setActiveOptionQuestion(activeOptionQuestion?.id === q.id ? null : q); setOptionForm({ option_text: '', is_correct: false, sort_order: (q.options?.length || 0) + 1 }); }}>
                                                    <Plus size={12} /> Option
                                                  </button>
                                                )}
                                                <button style={S.warningBtn} onClick={() => { setEditingQuestion(q); setQuestionForm({ question_text: q.question_text, question_type: q.question_type, sort_order: q.sort_order }); }}>
                                                  <Edit size={12} />
                                                </button>
                                                <button style={S.dangerBtn} onClick={() => handleDeleteQuestion(q)}>
                                                  <Trash2 size={12} />
                                                </button>
                                              </div>
                                            </div>

                                            {q.options?.length > 0 && (
                                              <div style={{ paddingLeft: '8px' }}>
                                                {q.options.map(opt => (
                                                  <div key={opt.id} style={S.optionItem(opt.is_correct)}>
                                                    {editingOption?.id === opt.id ? (
                                                      <form onSubmit={handleEditOption} style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                                                        <input style={{ ...S.input, flex: 1 }} value={optionForm.option_text} onChange={e => setOptionForm({ ...optionForm, option_text: e.target.value })} required />
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#374151', cursor: 'pointer', flexShrink: 0 }}>
                                                          <input type="checkbox" checked={optionForm.is_correct} onChange={e => setOptionForm({ ...optionForm, is_correct: e.target.checked })} style={{ accentColor: '#059669' }} />
                                                          Correct
                                                        </label>
                                                        <button type="submit" style={S.warningBtn} disabled={savingOption}>{savingOption ? '...' : '✓'}</button>
                                                        <button type="button" style={S.secondaryBtn} onClick={() => setEditingOption(null)}>✕</button>
                                                      </form>
                                                    ) : (
                                                      <>
                                                        {opt.is_correct ? <CheckCircle size={13} color="#059669" /> : <XCircle size={13} color="#cbd5e1" />}
                                                        <span style={S.optionText(opt.is_correct)}>{opt.option_text}</span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                          <button style={{ ...S.warningBtn, padding: '3px 8px' }} onClick={() => { setEditingOption(opt); setOptionForm({ option_text: opt.option_text, is_correct: opt.is_correct }); }}>
                                                            <Edit size={11} />
                                                          </button>
                                                          <button style={{ ...S.dangerBtn, padding: '3px 8px' }} onClick={() => handleDeleteOption(opt)}>
                                                            <Trash2 size={11} />
                                                          </button>
                                                        </div>
                                                      </>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {activeOptionQuestion?.id === q.id && (
                                              <form onSubmit={handleAddOption} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                  <input style={{ ...S.input, flex: 1 }} placeholder="Option text" value={optionForm.option_text} onChange={e => setOptionForm({ ...optionForm, option_text: e.target.value })} required />
                                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#374151', cursor: 'pointer', flexShrink: 0 }}>
                                                    <input type="checkbox" checked={optionForm.is_correct} onChange={e => setOptionForm({ ...optionForm, is_correct: e.target.checked })} style={{ accentColor: '#059669' }} />
                                                    Correct
                                                  </label>
                                                  <button type="submit" style={S.successBtn(savingOption)} disabled={savingOption}>{savingOption ? '...' : 'Add'}</button>
                                                  <button type="button" style={S.secondaryBtn} onClick={() => setActiveOptionQuestion(null)}>✕</button>
                                                </div>
                                              </form>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px' }}>No questions yet.</div>
                                )}

                                {activeQuestionQuiz?.id === quiz.id ? (
                                  <div style={{ ...S.formCard, border: '1px solid #e2e8f0' }}>
                                    <div style={S.formTitle}>Add Question</div>
                                    <form onSubmit={handleAddQuestion}>
                                      <div style={S.formGrid2}>
                                        <div style={S.formGroup}>
                                          <label style={S.label}>Question Text</label>
                                          <input style={S.input} placeholder="Question text" value={questionForm.question_text} onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })} required />
                                        </div>
                                        <div style={S.formGroup}>
                                          <label style={S.label}>Type</label>
                                          <select style={S.select} value={questionForm.question_type} onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value })}>
                                            <option value="single_choice">Single Choice (1 correct answer)</option>
                                            <option value="mcq">Multiple Choice (multiple correct answers)</option>
                                            <option value="truefalse">True / False</option>
                                            <option value="short_answer">Short Answer</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div style={S.btnRow}>
                                        <button type="submit" style={S.primaryBtn(savingQuestion)} disabled={savingQuestion}>{savingQuestion ? 'Saving...' : 'Add Question'}</button>
                                        <button type="button" style={S.secondaryBtn} onClick={() => setActiveQuestionQuiz(null)}>Cancel</button>
                                      </div>
                                    </form>
                                  </div>
                                ) : (
                                  <button style={S.outlineBtn} onClick={() => { setActiveQuestionQuiz(quiz); setQuestionForm({ question_text: '', question_type: 'mcq', sort_order: (quiz.questions?.length || 0) + 1 }); }}>
                                    <Plus size={13} /> Add Question
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px' }}>No quiz yet.</div>
                  )}

                  {activeQuizModule === module.id ? (
                    <div style={{ ...S.formCard, border: '1px solid #fde68a', marginTop: '10px' }}>
                      <div style={S.formTitle}>Add Quiz</div>
                      <form onSubmit={handleAddQuiz}>
                        <div style={S.formGrid}>
                          <div style={{ ...S.formGroup, gridColumn: '1 / 2' }}>
                            <label style={S.label}>Quiz Title</label>
                            <input style={S.input} value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="e.g. Module 1 Knowledge Check" required />
                          </div>
                          <div style={S.formGroup}>
                            <label style={S.label}>Pass Mark (%)</label>
                            <input type="number" style={S.input} value={quizForm.pass_mark_percent} onChange={e => setQuizForm({ ...quizForm, pass_mark_percent: e.target.value })} min={1} max={100} />
                          </div>
                          <div style={S.formGroup}>
                            <label style={S.label}>Attempt Limit</label>
                            <input type="number" style={S.input} value={quizForm.attempt_limit} onChange={e => setQuizForm({ ...quizForm, attempt_limit: e.target.value })} min={1} />
                          </div>
                        </div>
                        <div style={S.btnRow}>
                          <button type="submit" style={S.warningBtn} disabled={savingQuiz}>{savingQuiz ? 'Saving...' : 'Add Quiz'}</button>
                          <button type="button" style={S.secondaryBtn} onClick={() => setActiveQuizModule(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <button style={{ ...S.outlineBtn, marginTop: '10px', borderColor: '#fde68a', color: '#d97706' }} onClick={() => { setActiveQuizModule(module.id); setActiveLessonModule(null); setQuizForm({ title: '', pass_mark_percent: 80, attempt_limit: 3 }); }}>
                      <Plus size={13} /> Add Quiz
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}