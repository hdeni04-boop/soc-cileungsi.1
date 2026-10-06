import React, { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Input, Select, Switch, Table, Tag } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FullscreenOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LogoutOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  WarningOutlined
} from '@ant-design/icons';
import './legacy-antd.css';

const iconMap = {
  '↑': ArrowUpOutlined,
  '↓': ArrowDownOutlined,
  '✔': CheckOutlined,
  '✓': CheckCircleOutlined,
  '✅': CheckCircleOutlined,
  '✕': CloseOutlined,
  '↻': ReloadOutlined,
  '↺': ReloadOutlined,
  '⤓': DownloadOutlined,
  '📥': DownloadOutlined,
  '📊': BarChartOutlined,
  '🖨': PrinterOutlined,
  '⊏': LogoutOutlined,
  '⊟': DeleteOutlined,
  '⊞': DatabaseOutlined,
  '◈': SafetyOutlined,
  '◉': TeamOutlined,
  '↗': BarChartOutlined,
  '◷': ClockCircleOutlined,
  '⏳': ClockCircleOutlined,
  '⏱': ClockCircleOutlined,
  '📁': FolderOpenOutlined,
  '📂': FolderOpenOutlined,
  '📄': FileTextOutlined,
  '💾': UploadOutlined,
  '🔑': KeyOutlined,
  '🔊': BellOutlined,
  '🔔': BellOutlined,
  '🔍': SearchOutlined,
  'ℹ': InfoCircleOutlined,
  '⚠️': WarningOutlined,
  '⚠': WarningOutlined,
  '🚪': LogoutOutlined,
  '💀': ExclamationCircleOutlined,
  '●': CheckCircleOutlined,
  '＋': PlusOutlined,
  '+': PlusOutlined,
  '☰': SettingOutlined,
  '⛶': FullscreenOutlined,
  '›': SearchOutlined,
  'ID': UserOutlined
};

const pageIcons = {
  dashboard: BarChartOutlined,
  history: HistoryOutlined,
  rekap: DatabaseOutlined,
  analisa: BarChartOutlined,
  ijinkeluar: LogoutOutlined,
  karyawan: TeamOutlined,
  impor: FileExcelOutlined,
  laporan: FileTextOutlined,
  pengaturan: SettingOutlined,
  admin: SafetyOutlined
};

const roots = new WeakMap();
const glyphSelectors = '.panel-title-accent, .search-icon, .scan-input-prefix, .upload-zone-icon, .modal-icon, .toast-icon, .nav-item-icon';
const cardSelector = '.panel, .kpi-card, .scan-terminal, .chart-panel, .person-card';
const controlSelector = '.btn, .field-input, .field-select, .field-textarea, .scan-field, .search-bar, .remark-input, .toggle-switch';
const tagColors = {
  'badge-electric': 'processing',
  'badge-emerald': 'success',
  'badge-crimson': 'error',
  'badge-amber': 'warning',
  'badge-violet': 'purple',
  'badge-ghost': 'default'
};

function mount(host, element) {
  if (roots.has(host)) return;
  const root = createRoot(host);
  roots.set(host, root);
  root.render(element);
}

function findLeadingIcon(value) {
  const text = String(value || '').trimStart();
  const prefix = Object.keys(iconMap).sort((a, b) => b.length - a.length).find((key) => text.startsWith(key));
  return prefix ? { Icon: iconMap[prefix], label: text.slice(prefix.length).trim() } : { Icon: null, label: text.trim() };
}

function hideSource(source) {
  source.dataset.socLegacySource = 'true';
  source.setAttribute('aria-hidden', 'true');
  source.tabIndex = -1;
  source.style.setProperty('display', 'none', 'important');
}

function hostBefore(source, className) {
  const host = document.createElement('span');
  host.className = className;
  source.parentNode.insertBefore(host, source);
  return host;
}

function styleObject(element) {
  const style = {};
  for (const property of Array.from(element.style)) {
    const key = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    style[key] = element.style.getPropertyValue(property);
  }
  return style;
}

function layoutStyle(element) {
  const style = styleObject(element);
  const layout = {};
  ['width', 'minWidth', 'maxWidth', 'height', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'flex', 'gridColumn'].forEach((key) => {
    if (style[key]) layout[key] = style[key];
  });
  return layout;
}

function callLegacyEvent(source, type, init = {}) {
  let event;
  if (type === 'keydown') {
    event = new KeyboardEvent(type, {
      key: init.key,
      code: init.code,
      location: init.location,
      ctrlKey: init.ctrlKey,
      shiftKey: init.shiftKey,
      altKey: init.altKey,
      metaKey: init.metaKey,
      repeat: init.repeat,
      bubbles: true,
      cancelable: true
    });
  } else {
    event = new Event(type, { bubbles: true, cancelable: true });
  }
  source.dispatchEvent(event);
  return event;
}

function bridgeValue(source, onValue) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(source), 'value');
  if (descriptor?.get && descriptor?.set && !source.dataset.socValueBridge) {
    Object.defineProperty(source, 'value', {
      configurable: true,
      get() { return descriptor.get.call(this); },
      set(value) {
        descriptor.set.call(this, value);
        this.dispatchEvent(new Event('soc:legacy-value'));
      }
    });
    source.dataset.socValueBridge = 'true';
  }
  source.addEventListener('soc:legacy-value', onValue);
  return () => {
    source.removeEventListener('soc:legacy-value', onValue);
    if (source.dataset.socValueBridge) {
      delete source.value;
      delete source.dataset.socValueBridge;
    }
  };
}

function LegacyButton({ source }) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((value) => value + 1));
    observer.observe(source, { attributes: true, attributeFilter: ['class', 'disabled', 'style', 'title'] });
    return () => observer.disconnect();
  }, [source]);

  const originalClass = source.className;
  const tone = originalClass.includes('btn-electric') || originalClass.includes('btn-confirm-ready')
    ? 'primary'
    : originalClass.includes('btn-crimson') || originalClass.includes('btn-solid-crimson')
      ? 'danger'
      : originalClass.includes('btn-emerald') || originalClass.includes('btn-solid-emerald')
        ? 'success'
        : originalClass.includes('btn-amber')
          ? 'warning'
          : originalClass.includes('btn-violet')
            ? 'purple'
            : 'default';
  const { Icon, label } = findLeadingIcon(source.textContent);
  const inlineStyle = styleObject(source);
  if (tone === 'success') { inlineStyle.color = '#389e0d'; inlineStyle.borderColor = '#b7eb8f'; }
  if (tone === 'warning') { inlineStyle.color = '#d48806'; inlineStyle.borderColor = '#ffe58f'; }
  if (tone === 'purple') { inlineStyle.color = '#722ed1'; inlineStyle.borderColor = '#d3adf7'; }
  void version;

  return (
    <Button
      className={`soc-ant-action soc-ant-action-${tone}`}
      type={tone === 'primary' ? 'primary' : 'default'}
      danger={tone === 'danger'}
      disabled={source.disabled}
      title={source.title}
      style={inlineStyle}
      icon={Icon ? createElement(Icon) : null}
      onClick={() => source.click()}
    >
      {label}
    </Button>
  );
}

function LegacyInput({ source, multiline = false }) {
  const [value, setValue] = useState(source.value);
  const controlRef = useRef(null);
  const originalFocus = useRef(null);
  const visibleId = source.id ? `${source.id}-antd` : undefined;
  const fieldGroup = source.closest('.field-group');
  const label = fieldGroup?.querySelector('.field-label')?.textContent.trim();

  useEffect(() => {
    const syncValue = () => setValue(source.value);
    const stopBridge = bridgeValue(source, syncValue);
    originalFocus.current = source.focus.bind(source);
    source.focus = (options) => {
      const control = controlRef.current;
      if (control?.focus) control.focus(options);
      else originalFocus.current(options);
    };
    return () => {
      stopBridge();
      source.focus = originalFocus.current;
    };
  }, [source]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    source.value = nextValue;
    if (source.hasAttribute('oninput')) callLegacyEvent(source, 'input');
    if (source.hasAttribute('onchange')) callLegacyEvent(source, 'change');
  };
  const handleKeyDown = (event) => {
    if (!source.hasAttribute('onkeydown')) return;
    const forwarded = callLegacyEvent(source, 'keydown', event);
    if (forwarded.defaultPrevented) event.preventDefault();
  };

  const props = {
    id: visibleId,
    className: 'soc-ant-input',
    value,
    placeholder: source.placeholder,
    disabled: source.disabled,
    autoFocus: source.hasAttribute('autofocus'),
    autoComplete: source.autocomplete || undefined,
    spellCheck: source.spellcheck,
    min: source.min || undefined,
    max: source.max || undefined,
    step: source.step || undefined,
    maxLength: source.maxLength > 0 ? source.maxLength : undefined,
    type: source.type || 'text',
    style: styleObject(source),
    'aria-label': source.getAttribute('aria-label') || label || source.placeholder || undefined,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    ref: (control) => { controlRef.current = control; }
  };

  if (multiline) {
    return <Input.TextArea {...props} autoSize={{ minRows: 4, maxRows: 12 }} />;
  }
  return <Input {...props} />;
}

function readSelectOptions(source) {
  return Array.from(source.options).map((option) => {
    const { Icon, label } = findLeadingIcon(option.textContent);
    return {
      value: option.value,
      label: Icon
        ? <span className="soc-ant-option"><Icon /><span>{label}</span></span>
        : option.textContent,
      disabled: option.disabled,
      isPlaceholder: option.value === ''
    };
  });
}

function LegacySelect({ source }) {
  const [options, setOptions] = useState(() => readSelectOptions(source));
  const [value, setValue] = useState(source.value);
  const visibleId = source.id ? `${source.id}-antd` : undefined;

  useEffect(() => {
    const syncValue = () => setValue(source.value);
    const stopBridge = bridgeValue(source, syncValue);
    const observer = new MutationObserver(() => setOptions(readSelectOptions(source)));
    observer.observe(source, { childList: true, subtree: true, characterData: true, attributes: true });
    return () => {
      stopBridge();
      observer.disconnect();
    };
  }, [source]);

  const placeholder = options.find((option) => option.isPlaceholder)?.label;
  const visibleOptions = options.filter((option) => !option.isPlaceholder);
  return (
    <Select
      id={visibleId}
      className="soc-ant-select"
      value={value || undefined}
      placeholder={placeholder}
      options={visibleOptions}
      disabled={source.disabled}
      showSearch={visibleOptions.length > 6}
      optionFilterProp="label"
      filterOption={(query, option) => String(option?.label?.props?.children?.[1]?.props?.children || option?.label || '').toLowerCase().includes(query.toLowerCase())}
      style={styleObject(source)}
      aria-label={source.getAttribute('aria-label') || placeholder}
      onChange={(nextValue) => {
        source.value = nextValue || '';
        setValue(source.value);
        if (source.hasAttribute('onchange')) callLegacyEvent(source, 'change');
      }}
    />
  );
}

function LegacySwitch({ source }) {
  const [checked, setChecked] = useState(source.classList.contains('on'));
  useEffect(() => {
    const observer = new MutationObserver(() => setChecked(source.classList.contains('on')));
    observer.observe(source, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [source]);
  const settingLabel = source.closest('.setting-row')?.querySelector('.setting-info label')?.textContent.trim();

  return (
    <Switch
      className="soc-ant-switch"
      checked={checked}
      aria-label={settingLabel || 'Pengaturan'}
      onChange={() => source.click()}
    />
  );
}

function LegacyTag({ source }) {
  const { Icon, label } = findLeadingIcon(source.textContent);
  const color = Object.keys(tagColors).find((className) => source.classList.contains(className));
  return (
    <Tag
      className="soc-ant-tag"
      color={color ? tagColors[color] : 'default'}
      style={styleObject(source)}
      icon={Icon ? createElement(Icon) : null}
    >
      {label}
    </Tag>
  );
}

function LegacyCard({ source, content, kind }) {
  const [borderColor, setBorderColor] = useState(source.style.borderColor);
  const sourceClass = source.className;
  const clickable = source.hasAttribute('onclick');
  const padding = source.style.padding || (kind === 'kpi' ? '16px' : '18px');
  const tone = sourceClass.includes('c-emerald') ? 'success' : sourceClass.includes('c-crimson') ? 'danger' : sourceClass.includes('c-amber') ? 'warning' : '';
  const bodyRef = useRef(null);

  useLayoutEffect(() => {
    if (bodyRef.current && content.childNodes.length) bodyRef.current.appendChild(content);
  }, [content]);
  useEffect(() => {
    const observer = new MutationObserver(() => setBorderColor(source.style.borderColor));
    observer.observe(source, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, [source]);

  return (
    <Card
      className={`soc-ant-card ${kind === 'kpi' ? 'soc-ant-kpi' : ''} ${kind === 'person' ? 'soc-ant-person' : ''} ${sourceClass.includes('overtime') ? 'soc-ant-overtime' : ''} ${tone} ${clickable ? 'soc-ant-clickable' : ''}`}
      style={{ ...layoutStyle(source), borderColor: borderColor || undefined }}
      styles={{ body: { padding } }}
      hoverable={clickable}
      onClick={clickable ? () => source.click() : undefined}
    >
      <div ref={bodyRef} />
    </Card>
  );
}

function readTable(source) {
  const headers = Array.from(source.tHead?.rows?.[0]?.cells || []).map((cell) => cell.textContent.trim());
  const body = source.tBodies[0];
  const emptyText = body?.querySelector('.table-empty')?.textContent.trim() || '';
  const rows = Array.from(body?.rows || [])
    .filter((row) => !row.querySelector('.table-empty'))
    .map((row, rowIndex) => ({
      key: row.dataset.key || String(rowIndex),
      cells: Array.from(row.cells).map((cell) => cell.innerHTML)
    }));
  return { headers, rows, emptyText };
}

function LegacyTable({ source }) {
  const [snapshot, setSnapshot] = useState(() => readTable(source));
  useEffect(() => {
    const observer = new MutationObserver(() => setSnapshot(readTable(source)));
    observer.observe(source, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [source]);

  const columns = snapshot.headers.map((title, columnIndex) => ({
    title,
    key: `column-${columnIndex}`,
    dataIndex: ['cells', columnIndex],
    render: (html) => <span className="soc-ant-table-cell" dangerouslySetInnerHTML={{ __html: html || '' }} />
  }));

  return (
    <Table
      className="soc-ant-table"
      size="middle"
      columns={columns}
      dataSource={snapshot.rows}
      rowKey="key"
      locale={{ emptyText: snapshot.emptyText || 'Tidak ada data' }}
      pagination={snapshot.rows.length > 0 ? {
        defaultPageSize: 25,
        showSizeChanger: true,
        pageSizeOptions: [10, 25, 50, 100],
        showTotal: (total) => `${total} data`
      } : false}
      scroll={{ x: 'max-content' }}
    />
  );
}

function mountIcon(element, Icon) {
  if (!element || element.dataset.socAntIcon) return;
  element.dataset.socAntIcon = 'true';
  const host = document.createElement('span');
  host.className = 'soc-ant-glyph';
  host.setAttribute('aria-hidden', 'true');
  element.replaceChildren(host);
  mount(host, createElement(Icon));
}

function upgradeCard(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const kind = source.classList.contains('kpi-card') ? 'kpi'
    : source.classList.contains('person-card') ? 'person' : 'panel';
  const content = document.createDocumentFragment();
  while (source.firstChild) content.appendChild(source.firstChild);
  const host = document.createElement('div');
  host.className = 'soc-ant-card-host';
  source.parentNode.insertBefore(host, source);
  hideSource(source);
  mount(host, <LegacyCard source={source} content={content} kind={kind} />);
}

function upgradeTable(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const container = source.closest('.table-container') || source;
  const parent = container.parentNode;
  const host = document.createElement('div');
  host.className = 'soc-ant-table-host';
  host.style.cssText = container.style.cssText;
  const visible = document.createElement('div');
  const backing = document.createElement('div');
  backing.hidden = true;
  backing.dataset.socTableSource = 'true';
  parent.insertBefore(host, container);
  host.append(visible, backing);
  backing.appendChild(container);
  mount(visible, <LegacyTable source={source} />);
}

function upgradeButton(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const host = hostBefore(source, 'soc-ant-control-host');
  hideSource(source);
  mount(host, <LegacyButton source={source} />);
}

function upgradeInput(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const multiline = source.tagName === 'TEXTAREA';
  const host = hostBefore(source, 'soc-ant-control-host soc-ant-input-host');
  source.classList.add('soc-ant-source-input');
  hideSource(source);
  const visibleId = source.id ? `${source.id}-antd` : undefined;
  const group = source.closest('.field-group');
  const label = group?.querySelector('.field-label')?.textContent.trim();
  if (visibleId) {
    document.querySelectorAll(`label[for="${source.id}"]`).forEach((fieldLabel) => { fieldLabel.htmlFor = visibleId; });
  }
  mount(host, <LegacyInput source={source} multiline={multiline} />);
}

function upgradeSelect(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const host = hostBefore(source, 'soc-ant-control-host soc-ant-select-host');
  hideSource(source);
  mount(host, <LegacySelect source={source} />);
}

function upgradeSwitch(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const host = hostBefore(source, 'soc-ant-control-host soc-ant-switch-host');
  hideSource(source);
  mount(host, <LegacySwitch source={source} />);
}

function upgradeTag(source) {
  if (source.dataset.socAntUpgraded) return;
  source.dataset.socAntUpgraded = 'true';
  const host = hostBefore(source, 'soc-ant-tag-host');
  hideSource(source);
  mount(host, <LegacyTag source={source} />);
}

function upgradeGlyph(element) {
  if (element.dataset.socAntIcon) return;
  const { Icon, label } = findLeadingIcon(element.textContent);
  if (!Icon || label) return;
  mountIcon(element, Icon);
}

function upgradePageTitles(rootNode) {
  const views = rootNode.matches?.('.view') ? [rootNode] : [];
  views.push(...(rootNode.querySelectorAll?.('.view') || []));
  views.forEach((view) => {
    if (view.dataset.socAntTitle) return;
    const title = view.querySelector('.page-title');
    const Icon = pageIcons[view.id.replace('view-', '')];
    if (!title || !Icon) return;
    view.dataset.socAntTitle = 'true';
    const host = document.createElement('span');
    host.className = 'soc-page-icon';
    title.prepend(host);
    mount(host, createElement(Icon));
  });
}

function upgradeTextGlyphs(rootNode) {
  if (!rootNode.ownerDocument || rootNode.dataset?.socLegacySource || rootNode.closest?.('[data-soc-table-source]')) return;
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (!parent || parent.closest('script,style,textarea,select,option,[data-soc-legacy-source],.soc-ant-glyph,.anticon')) return;
    const text = textNode.nodeValue || '';
    const leadingSpace = (text.match(/^\s*/) || [''])[0];
    const { Icon, label } = findLeadingIcon(text.trimStart());
    if (!Icon || label === text.trimStart()) return;
    const iconHost = document.createElement('span');
    iconHost.className = 'soc-ant-inline-glyph';
    iconHost.setAttribute('aria-hidden', 'true');
    parent.insertBefore(iconHost, textNode);
    textNode.nodeValue = leadingSpace + label;
    mount(iconHost, createElement(Icon));
  });
}

function enhanceTree(rootNode) {
  if (rootNode.nodeType !== Node.ELEMENT_NODE) return;
  if (rootNode.closest?.('[data-soc-table-source]') || rootNode.matches?.('[data-soc-legacy-source]')) return;
  const find = (selector) => {
    const matches = [];
    if (rootNode.matches(selector)) matches.push(rootNode);
    matches.push(...rootNode.querySelectorAll(selector));
    return matches;
  };

  find(cardSelector).forEach(upgradeCard);
  find('.data-table').forEach(upgradeTable);
  find('.btn').forEach(upgradeButton);
  find('.field-input, .scan-field, .search-bar, .remark-input, .field-textarea').forEach(upgradeInput);
  find('.field-select').forEach(upgradeSelect);
  find('.toggle-switch').forEach(upgradeSwitch);
  find('.badge').forEach(upgradeTag);
  find(glyphSelectors).forEach(upgradeGlyph);
  upgradePageTitles(rootNode);
  upgradeTextGlyphs(rootNode);
}

export default function LegacyAntAdapter() {
  useEffect(() => {
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => enhanceTree(node)));
    });
    enhanceTree(document.body);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
