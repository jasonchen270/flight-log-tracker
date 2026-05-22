import { useState } from 'react';
import { api } from '../api.js';

const KINDS = [
    ['solo', 'Solo (61.87(n))'],
    ['cross_country_solo', 'Solo cross-country (61.93)'],
    ['complex', 'Complex aircraft (61.31(e))'],
    ['high_performance', 'High performance (61.31(f))'],
    ['tailwheel', 'Tailwheel (61.31(i))'],
    ['high_altitude', 'High altitude (61.31(g))'],
    ['90_day_passenger', '90-day passenger currency (61.57)'],
    ['flight_review', 'Flight review (61.56)'],
    ['ipc', 'Instrument proficiency check (61.57(d))'],
];

export default function EndorsementModal({ flight, onClose, onSaved }) {
    const [kind, setKind] = useState(KINDS[0][0]);
    const [instructorName, setInstructorName] = useState('');
    const [instructorCfi, setInstructorCfi] = useState('');
    const [signedAt, setSignedAt] = useState(flight.flight_date);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await api.addEndorsement(flight.id, {
                kind,
                instructor_name: instructorName,
                instructor_cfi: instructorCfi,
                signed_at: signedAt,
                notes: notes || null,
            });
            await onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemove(id) {
        if (!confirm('Remove this endorsement?')) return;
        try {
            await api.removeEndorsement(flight.id, id);
            await onSaved();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <header>
                    <h2>Endorsements for {flight.flight_date} ({flight.aircraft_type})</h2>
                    <button className="ghost" onClick={onClose} aria-label="close">×</button>
                </header>

                {flight.endorsements?.length > 0 && (
                    <ul className="existing-endorsements">
                        {flight.endorsements.map((e) => (
                            <li key={e.id}>
                                <div>
                                    <strong>{e.kind.replace(/_/g, ' ')}</strong>: {e.instructor_name} (CFI {e.instructor_cfi}), {e.signed_at}
                                    {e.notes && <div className="muted">{e.notes}</div>}
                                </div>
                                <button className="danger" onClick={() => handleRemove(e.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                )}

                <form onSubmit={handleSubmit} className="endorsement-form">
                    <label className="field">
                        <span>Kind</span>
                        <select value={kind} onChange={(e) => setKind(e.target.value)}>
                            {KINDS.map(([v, label]) => (
                                <option key={v} value={v}>{label}</option>
                            ))}
                        </select>
                    </label>
                    <div className="form-row">
                        <label className="field grow">
                            <span>Instructor name</span>
                            <input value={instructorName} onChange={(e) => setInstructorName(e.target.value)} required />
                        </label>
                        <label className="field">
                            <span>CFI #</span>
                            <input value={instructorCfi} onChange={(e) => setInstructorCfi(e.target.value)} required />
                        </label>
                        <label className="field">
                            <span>Signed</span>
                            <input type="date" value={signedAt} onChange={(e) => setSignedAt(e.target.value)} required />
                        </label>
                    </div>
                    <label className="field">
                        <span>Notes</span>
                        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </label>

                    {error && <p className="error">{error}</p>}

                    <div className="form-actions">
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Add endorsement'}
                        </button>
                        <button type="button" onClick={onClose} className="ghost">Done</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
