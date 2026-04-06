import React, { useEffect, useState } from 'react';
import API from '../../api/axios';

export default function HRUnlockRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [message, setMessage]   = useState('');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = () => {
    API.get('/unlock-requests/')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleReview = async (requestId, status) => {
    const review_note = status === 'approved'
      ? 'Approved by HR.'
      : prompt('Enter reason for denial:');

    if (status === 'denied' && !review_note) return;

    try {
      await API.patch(`/unlock-requests/${requestId}/`, { status, review_note });
      setMessage(`Request ${status} successfully.`);
      fetchRequests();
    } catch (err) {
      setMessage('Could not process request.');
    }
  };

  if (loading) return <p>Loading requests...</p>;

  return (
    <div>
      <h4 className="mb-3">Quiz Unlock Requests</h4>
      {message && <div className="alert alert-info py-2">{message}</div>}

      {requests.length === 0 ? (
        <div className="alert alert-light border">
          No pending unlock requests at this time.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Staff Member</th>
                <th>Quiz</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td className="fw-semibold">{req.user_name}</td>
                  <td>{req.quiz_title}</td>
                  <td>{req.reason}</td>
                  <td>{new Date(req.requested_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => handleReview(req.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReview(req.id, 'denied')}
                    >
                      Deny
                    </button>
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