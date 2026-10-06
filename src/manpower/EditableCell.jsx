import React, { useEffect, useRef, useState } from 'react';

export default function EditableCell({ value, onSave, className = '', label }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [editing, value]);

  const commit = () => {
    const nextValue = Number(draft);
    if (draft.trim() !== '' && Number.isInteger(nextValue) && nextValue >= 0) {
      onSave(nextValue);
      setError('');
      setEditing(false);
    } else {
      setError('Masukkan bilangan bulat minimal 0.');
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="manpower-edit-input"
        type="number"
        min="0"
        step="1"
        aria-label={label}
        aria-invalid={Boolean(error)}
        title={error || undefined}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setError('');
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            setDraft(String(value));
            setError('');
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className={`manpower-editable ${className}`}
      aria-label={`Edit ${label}: ${value}`}
      title="Klik untuk mengubah nilai"
      onClick={() => setEditing(true)}
    >
      {value}
    </button>
  );
}
