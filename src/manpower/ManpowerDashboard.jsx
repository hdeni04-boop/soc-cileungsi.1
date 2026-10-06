import React, { useMemo, useState } from 'react';
import { CalendarOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons';
import { manpowerGroups, mockManpowerRows } from './data';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import './manpower.css';

const DRAFT_STORAGE_KEY = 'soc_manpower_draft_v1';

function calculateTotals(rows) {
  return manpowerGroups.reduce((totals, group) => {
    group.categories.forEach((category) => {
      const categoryTotal = { plan: 0, act: 0, gap: 0 };
      if (category.key === 'dwOncall') categoryTotal.unplan = 0;
      rows.forEach((row) => {
        category.fields.forEach((field) => {
          categoryTotal[field] += row[category.key][field];
        });
      });
      totals[category.key] = categoryTotal;
    });
    return totals;
  }, {});
}

function loadDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draft) return { rows: mockManpowerRows, message: '' };
    const parsed = JSON.parse(draft);
    const validDraft = Array.isArray(parsed) && parsed.every((row) => (
      typeof row?.date === 'string'
      && typeof row?.shift === 'string'
      && manpowerGroups.every((group) => group.categories.every((category) => (
        category.fields.every((field) => {
          const value = row[category.key]?.[field];
          return Number.isInteger(value) && (field === 'gap' || value >= 0);
        })
      )))
    ));
    if (validDraft) {
      return { rows: parsed, message: 'Draft lokal dimuat.' };
    }
    return { rows: mockManpowerRows, message: 'Draft lokal tidak valid; data contoh digunakan.' };
  } catch {
    return { rows: mockManpowerRows, message: 'Draft lokal tidak dapat dibaca; data contoh digunakan.' };
  }
}

function getGapToneClass(gap) {
  if (gap < 0) return 'manpower-gap-negative';
  if (gap > 0) return 'manpower-gap-positive';
  return 'manpower-gap-neutral';
}

export default function ManpowerDashboard() {
  const [initialDraft] = useState(loadDraft);
  const [rows, setRows] = useState(initialDraft.rows);
  const [selectedDate, setSelectedDate] = useState(() => initialDraft.rows[0]?.date || mockManpowerRows[0].date);
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState(initialDraft.message);
  const dates = [...new Set(rows.map((row) => row.date))].sort();
  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.date === selectedDate);
  const totals = useMemo(() => calculateTotals(visibleRows.map(({ row }) => row)), [visibleRows]);
  const totalHeadcount = useMemo(() => (
    visibleRows.reduce((sum, { row }) => sum + manpowerGroups.reduce((groupSum, group) => (
      groupSum + group.categories.reduce((categorySum, category) => categorySum + row[category.key].act, 0)
    ), 0), 0)
  ), [visibleRows]);

  const handleCellSave = (rowIndex, categoryKey, field, nextValue) => {
    setRows((currentRows) => currentRows.map((row, index) => {
      if (index !== rowIndex) return row;
      const updatedCategory = { ...row[categoryKey], [field]: nextValue };
      if (field === 'plan' || field === 'act') {
        updatedCategory.gap = updatedCategory.act - updatedCategory.plan;
      }
      return { ...row, [categoryKey]: updatedCategory };
    }));
    setDirty(true);
    setSaveMessage('');
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(rows));
      setDirty(false);
      setSaveMessage('Draft tersimpan di perangkat ini.');
    } catch {
      setSaveMessage('Draft gagal disimpan. Periksa pengaturan penyimpanan browser.');
    }
  };

  return (
    <main className="manpower-page">
      <div className="manpower-content">
        <div className="manpower-breadcrumb">OPERASIONAL <span>/</span> TENAGA KERJA</div>
        <header className="manpower-page-header">
          <div>
            <div className="manpower-title-row">
              <span className="manpower-title-icon"><TeamOutlined /></span>
              <div>
                <h1>Manpower Management System</h1>
                <p>Monitoring alokasi tenaga kerja per shift · SOC Cileungsi</p>
              </div>
            </div>
          </div>
          <button type="button" className="manpower-save-button" onClick={saveDraft}>
            <SaveOutlined />
            {dirty ? 'Simpan perubahan' : 'Simpan draft lokal'}
          </button>
        </header>

        <section className="manpower-summary">
          <article className="manpower-summary-card">
            <span className="manpower-summary-label">TANGGAL AKTIF</span>
            <strong>{selectedDate}</strong>
            <span className="manpower-summary-caption">Jadwal operasional</span>
          </article>
          <article className="manpower-summary-card">
            <span className="manpower-summary-label">TOTAL SHIFT</span>
            <strong>{visibleRows.length}<small> / 24</small></strong>
            <span className="manpower-summary-caption">Shift terjadwal hari ini</span>
          </article>
          <article className="manpower-summary-card">
            <span className="manpower-summary-label">ACTUAL MANPOWER</span>
            <strong>{totalHeadcount}<small> orang</small></strong>
            <span className="manpower-summary-caption">Akumulasi ACT seluruh kategori</span>
          </article>
          <article className="manpower-summary-card">
            <span className="manpower-summary-label">STATUS DATA</span>
            <strong className={dirty ? 'manpower-status-unsaved' : 'manpower-status-neutral'}>
              <span className="manpower-status-dot" />
              {dirty ? 'Belum disimpan' : 'Siap diedit'}
            </strong>
            <span className="manpower-summary-caption">
              {dirty ? 'Perubahan tersimpan sementara di sesi' : 'Draft disimpan lokal saat diminta'}
            </span>
          </article>
        </section>

        <section className="manpower-table-card">
          <div className="manpower-table-toolbar">
            <div>
              <h2>Alokasi tenaga kerja</h2>
              <p>Nilai GAP dihitung otomatis dari ACT dikurangi PLAN.</p>
            </div>
            <label className="manpower-date-filter">
              <CalendarOutlined />
              <span>Tanggal</span>
              <select
                aria-label="Filter tanggal"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              >
                {dates.map((date) => <option key={date} value={date}>{date}</option>)}
              </select>
            </label>
          </div>

          <div className="manpower-legend">
            <span><i className="manpower-legend-dot manpower-legend-negative" /> Minus: kurang personel</span>
            <span><i className="manpower-legend-dot manpower-legend-neutral" /> Nol: sesuai plan</span>
            <span><i className="manpower-legend-dot manpower-legend-positive" /> Plus: lebih personel</span>
            {saveMessage && <span className="manpower-save-message" role="status">{saveMessage}</span>}
          </div>

          <div className="manpower-table-scroll">
            <table className="manpower-table">
              <TableHeader />
              <tbody>
                {visibleRows.map(({ row, index }) => (
                  <TableRow key={`${row.date}-${row.shift}`} row={row} rowIndex={index} onCellSave={handleCellSave} />
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td className="manpower-empty-cell" colSpan={manpowerGroups.reduce(
                      (count, group) => count + group.categories.reduce(
                        (categoryCount, category) => categoryCount + category.fields.length, 0
                      ), 2
                    )}>
                      Tidak ada data shift untuk tanggal ini.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th className="manpower-sticky-date" colSpan={2}>GRAND TOTAL</th>
                  {manpowerGroups.flatMap((group) => group.categories.flatMap((category) => (
                    category.fields.map((field) => {
                      const value = totals[category.key][field];
                      const isGap = field === 'gap';
                      return (
                        <th
                          key={`${category.key}-${field}`}
                          className={[
                            field === 'unplan' ? 'manpower-unplan-cell' : '',
                            isGap ? getGapToneClass(value) : ''
                          ].filter(Boolean).join(' ')}
                        >
                          {value}
                        </th>
                      );
                    })
                  )))}
                </tr>
              </tfoot>
            </table>
          </div>
          <footer className="manpower-table-footer">
            <span>Menampilkan <strong>{visibleRows.length}</strong> dari {rows.length} shift</span>
            <span>Klik angka PLAN / ACT / UNPLAN untuk mengedit</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
