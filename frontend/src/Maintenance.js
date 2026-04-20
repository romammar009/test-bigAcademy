import React from 'react';

const Maintenance = () => {
  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center p-5 shadow-lg rounded bg-white" style={{ maxWidth: '500px' }}>
        <div className="mb-4">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <h1 className="display-5 fw-bold text-dark mb-3">System Update</h1>
        <p className="lead text-muted mb-4">
          We're currently fine-tuning the <strong>Big Academy</strong> platform to provide a better learning experience for our childcare teams.
        </p>
        
        <div className="progress mb-4" style={{ height: '10px' }}>
          <div 
            className="progress-bar progress-bar-striped progress-bar-animated" 
            role="progressbar" 
            style={{ width: '50%' }}
          ></div>
        </div>
        
        <small className="text-uppercase fw-bold text-primary">
          Estimated completion: End of MAY
        </small>
        
        <hr className="my-4" />
        <p className="text-secondary small">
          If you are a Branch Manager and require urgent access, please contact the Head Office.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;