import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(null);

  useEffect(() => {
    API.get('/certificates/')
      .then(res => setCertificates(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

const handleDownload = async (courseId, courseTitle) => {
    setGenerating(courseId);
    try {
      const res = await API.post(
        `/courses/${courseId}/certificate/generate/`,
        {},
        { responseType: 'blob' }
      );

      const contentType = res.headers['content-type'];

      // If response is JSON (already exists message), parse and re-request
      if (contentType && contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        console.log(json.message);
      }

      // Download the blob
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `certificate_${courseTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      alert('Could not generate certificate.');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return <p>Loading certificates...</p>;

  return (
    <div>
      <h4 className="mb-3">My Certificates</h4>
      {certificates.length === 0 && (
        <p className="text-muted">No certificates yet. Complete a course to earn one.</p>
      )}
      <div className="row">
        {certificates.map(cert => (
          <div className="col-md-4 mb-4" key={cert.id}>
            <div className="card h-100 shadow-sm border-success">
              <div className="card-body">
                <div className="text-success fs-1 mb-2">🎓</div>
                <h5 className="card-title">{cert.course_title}</h5>
                <p className="text-muted small">
                  Issued to: <strong>{cert.user_name}</strong>
                </p>
                <p className="text-muted small">
                  Version: {cert.course_version}
                </p>
                <p className="text-muted small">
                  Issued: {new Date(cert.issued_at).toLocaleDateString()}
                </p>
                {cert.expires_at && (
                  <p className="text-muted small">
                    Expires: {new Date(cert.expires_at).toLocaleDateString()}
                  </p>
                )}
                <p className="text-muted" style={{ fontSize: '10px' }}>
                  ID: {cert.certificate_id}
                </p>
              </div>
              <div className="card-footer bg-white">
                <button
                  className="btn btn-success btn-sm w-100"
                  onClick={() => handleDownload(cert.course_id, cert.course_title)}
                  disabled={generating === cert.course_id}
                >
                  {generating === cert.course_id ? 'Generating...' : '⬇ Download PDF'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
