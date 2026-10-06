import React from 'react';
import { manpowerGroups } from './data';

const fieldLabels = {
  plan: 'PLAN',
  act: 'ACT',
  unplan: 'UNPLAN',
  gap: 'GAP'
};

export default function TableHeader() {
  return (
    <thead>
      <tr className="manpower-major-header">
        <th className="manpower-sticky-date" rowSpan={3}>DATE</th>
        <th className="manpower-sticky-shift" rowSpan={3}>SHIFT</th>
        {manpowerGroups.map((group) => (
          <th
            key={group.title}
            className={`manpower-major-${group.theme}`}
            colSpan={group.categories.reduce((count, category) => count + category.fields.length, 0)}
          >
            {group.title}
          </th>
        ))}
      </tr>
      <tr className="manpower-category-header">
        {manpowerGroups.flatMap((group) => group.categories.map((category) => (
          <th key={category.key} colSpan={category.fields.length}>{category.label}</th>
        )))}
      </tr>
      <tr className="manpower-field-header">
        {manpowerGroups.flatMap((group) => group.categories.flatMap((category) => (
          category.fields.map((field) => (
            <th
              key={`${category.key}-${field}`}
              className={field === 'unplan' ? 'manpower-unplan-header' : ''}
            >
              {fieldLabels[field]}
            </th>
          ))
        )))}
      </tr>
    </thead>
  );
}
