import { useState } from 'react';

// Today, as YYYY-MM-DD in the *user's* local timezone. Critically NOT
// `new Date().toISOString().slice(0, 10)`, which returns UTC, which is
// what caused flights logged after ~5pm Pacific to show tomorrow's date.
function todayLocalIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function blank() {
    return {
        flight_date: todayLocalIso(),
        aircraft_type: '',
        tail_number: '',
        route: '',
        total_hours: '',
        pic_hours: '0',
        dual_received_hours: '0',
        solo_hours: '0',
        night_hours: '0',
        cross_country_hours: '0',
        landings_day: '0',
        landings_night: '0',
        remarks: '',
    };
}

function fromInitial(initial) {
    if (!initial) return blank();
    const v = { ...blank(), ...initial };
    // Server may return numbers; the inputs are strings.
    for (const k of Object.keys(v)) {
        if (v[k] === null || v[k] === undefined) v[k] = '';
        else v[k] = String(v[k]);
    }
    return v;
}

export default function FlightForm({ initial, onSubmit, onCancel }) {
    const [values, setValues] = useState(fromInitial(initial));
    const [submitting, setSubmitting] = useState(false);

    function update(name, value) {
        setValues((v) => ({ ...v, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(values);
            if (!initial) setValues(blank());
        } finally {
            setSubmitting(false);
        }
    }

    const numericField = (name, label, opts = {}) => (
        <label className="field">
            <span>{label}</span>
            <input
                type="number"
                step={opts.integer ? '1' : '0.1'}
                min="0"
                value={values[name]}
                onChange={(e) => update(name, e.target.value)}
                required={opts.required}
            />
        </label>
    );

    return (
        <form className="flight-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <label className="field">
                    <span>Date</span>
                    <input
                        type="date"
                        value={values.flight_date}
                        onChange={(e) => update('flight_date', e.target.value)}
                        required
                    />
                </label>
                <label className="field">
                    <span>Aircraft type</span>
                    <input
                        list="aircraft-types"
                        value={values.aircraft_type}
                        onChange={(e) => update('aircraft_type', e.target.value.toUpperCase())}
                        placeholder="C172"
                        required
                    />
                    <datalist id="aircraft-types">
                        <option value="C172" />
                        <option value="C152" />
                        <option value="PA28" />
                        <option value="DA40" />
                        <option value="SR20" />
                    </datalist>
                </label>
                <label className="field">
                    <span>Tail number</span>
                    <input
                        value={values.tail_number}
                        onChange={(e) => update('tail_number', e.target.value.toUpperCase())}
                        placeholder="N12345"
                        required
                    />
                </label>
                <label className="field grow">
                    <span>Route</span>
                    <input
                        value={values.route}
                        onChange={(e) => update('route', e.target.value.toUpperCase())}
                        placeholder="KPAO-KSFO-KPAO"
                    />
                </label>
            </div>

            <div className="form-row">
                {numericField('total_hours', 'Total', { required: true })}
                {numericField('pic_hours', 'PIC')}
                {numericField('dual_received_hours', 'Dual recv')}
                {numericField('solo_hours', 'Solo')}
                {numericField('night_hours', 'Night')}
                {numericField('cross_country_hours', 'XC')}
                {numericField('landings_day', 'Day ldgs', { integer: true })}
                {numericField('landings_night', 'Night ldgs', { integer: true })}
            </div>

            <label className="field">
                <span>Remarks</span>
                <textarea
                    rows={2}
                    value={values.remarks}
                    onChange={(e) => update('remarks', e.target.value)}
                />
            </label>

            <div className="form-actions">
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : initial ? 'Update flight' : 'Add flight'}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="ghost">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
