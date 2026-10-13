import { useState } from 'react';
import Modal from './Modal';
import { apiFetch } from '../lib/apiClient';

type ReportContentProps = {
  contentType: 'group' | 'resource';
  contentId: number | string;
  contentTitle: string;
};

const reasons = [
  'Incorrect or misleading',
  'Inappropriate content',
  'Copyright or attribution concern',
  'Spam or duplicate',
  'Other',
];

export default function ReportContent({ contentType, contentId, contentTitle }: ReportContentProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitReport = async () => {
    setError('');
    setSubmitting(true);
    try {
      const response = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ contentType, contentId, reason, details }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Your report could not be sent.');
      }
      setSubmitted(true);
      setOpen(false);
      setDetails('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Your report could not be sent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="report-control">
        <button type="button" className="button button-secondary" onClick={() => setOpen(true)}>
          Report {contentType}
        </button>
        {submitted ? <span role="status">Report sent for review.</span> : null}
      </div>
      <Modal
        open={open}
        title={`Report ${contentType}`}
        primaryActionLabel={submitting ? 'Sending…' : 'Send report'}
        onPrimaryAction={submitReport}
        secondaryActionLabel="Cancel"
        onSecondaryAction={() => { setOpen(false); setError(''); }}
        onClose={() => { setOpen(false); setError(''); }}
      >
        <p>Tell a moderator what needs review in <strong>{contentTitle}</strong>.</p>
        <label className="report-field">
          Reason
          <select value={reason} onChange={(event) => setReason(event.target.value)}>
            {reasons.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="report-field">
          Additional details (optional)
          <textarea
            rows={4}
            maxLength={1000}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Share only the details needed to review this item."
          />
          <small>{details.length}/1000</small>
        </label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </Modal>
    </>
  );
}
