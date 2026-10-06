import React from 'react';
import EditableCell from './EditableCell';
import { manpowerGroups } from './data';

function gapClass(gap) {
  if (gap < 0) return 'manpower-gap-negative';
  if (gap > 0) return 'manpower-gap-positive';
  return 'manpower-gap-neutral';
}

export default function TableRow({ row, rowIndex, onCellSave }) {
  return (
    <tr>
      <td className="manpower-sticky-date">{row.date}</td>
      <td className="manpower-sticky-shift">{row.shift}</td>
      {manpowerGroups.flatMap((group) => group.categories.flatMap((category) => (
        category.fields.map((field) => {
          const value = row[category.key][field];
          const label = `${row.shift} ${category.label} ${field.toUpperCase()}`;
          const editable = field === 'plan' || field === 'act' || field === 'unplan';
          const classes = [
            field === 'unplan' ? 'manpower-unplan-cell' : '',
            field === 'gap' ? gapClass(value) : ''
          ].filter(Boolean).join(' ');

          return (
            <td key={`${category.key}-${field}`} className={classes}>
              {editable ? (
                <EditableCell
                  value={value}
                  label={label}
                  onSave={(nextValue) => onCellSave(rowIndex, category.key, field, nextValue)}
                />
              ) : value}
            </td>
          );
        })
      )))}
    </tr>
  );
}
