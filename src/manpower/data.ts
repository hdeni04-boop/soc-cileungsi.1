import type { ManpowerGroup, ManpowerRow } from './types';

export const manpowerGroups: ManpowerGroup[] = [
  {
    title: 'DATA MANPOWER SOC CILEUNGSI',
    theme: 'primary',
    categories: [
      { key: 'dedicated', label: 'DEDICATED', fields: ['plan', 'act', 'gap'] },
      { key: 'dwReguler', label: 'DW REGULER', fields: ['plan', 'act', 'gap'] },
      { key: 'dwOncall', label: 'DW ONCALL', fields: ['plan', 'act', 'unplan', 'gap'] }
    ]
  },
  {
    title: 'INBOUND PROJECTION',
    theme: 'inbound',
    categories: [
      { key: 'dedicatedEha', label: 'DEDICATED EHA', fields: ['plan', 'act', 'gap'] },
      { key: 'dwRegulerEha', label: 'DW REGULER EHA', fields: ['plan', 'act', 'gap'] },
      { key: 'dwDi', label: 'DW DI', fields: ['plan', 'act', 'gap'] }
    ]
  }
];

function getLocalDate(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function makeShift(hour: number): string {
  const start = String(hour).padStart(2, '0');
  const end = String((hour + 9) % 24).padStart(2, '0');
  return `${start}:00 - ${end}:00`;
}

function allocation(plan: number, act: number) {
  return { plan, act, gap: act - plan };
}

const mockDate = getLocalDate();

export const mockManpowerRows: ManpowerRow[] = Array.from({ length: 24 }, (_, hour) => {
  const dedicatedPlan = 3 + (hour % 3);
  const regularPlan = 2 + (hour % 2);
  const oncallPlan = 1 + (hour % 2);
  const dedicatedEhaPlan = 2 + (hour % 3 === 0 ? 1 : 0);
  const regularEhaPlan = 2;
  const diPlan = 2 + (hour % 4 === 0 ? 1 : 0);

  return {
    date: mockDate,
    shift: makeShift(hour),
    dedicated: allocation(dedicatedPlan, dedicatedPlan + ((hour % 5) - 2)),
    dwReguler: allocation(regularPlan, regularPlan + ((hour % 3) - 1)),
    dwOncall: {
      ...allocation(oncallPlan, oncallPlan + ((hour % 4) - 1)),
      unplan: hour % 6 === 0 ? 1 : 0
    },
    dedicatedEha: allocation(dedicatedEhaPlan, dedicatedEhaPlan + ((hour % 4) - 2)),
    dwRegulerEha: allocation(regularEhaPlan, regularEhaPlan + ((hour % 3) - 1)),
    dwDi: allocation(diPlan, diPlan + ((hour % 5) - 2))
  };
});
