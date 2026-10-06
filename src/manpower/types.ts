export type ManpowerField = 'plan' | 'act' | 'unplan' | 'gap';

export interface ManpowerAllocation {
  plan: number;
  act: number;
  gap: number;
}

export interface OnCallAllocation extends ManpowerAllocation {
  unplan: number;
}

export interface ManpowerRow {
  date: string;
  shift: string;
  dedicated: ManpowerAllocation;
  dwReguler: ManpowerAllocation;
  dwOncall: OnCallAllocation;
  dedicatedEha: ManpowerAllocation;
  dwRegulerEha: ManpowerAllocation;
  dwDi: ManpowerAllocation;
}

export interface ManpowerCategory {
  key: keyof Omit<ManpowerRow, 'date' | 'shift'>;
  label: string;
  fields: ManpowerField[];
}

export interface ManpowerGroup {
  title: string;
  theme: 'primary' | 'inbound';
  categories: ManpowerCategory[];
}
