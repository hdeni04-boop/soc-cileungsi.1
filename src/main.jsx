import React, { useDeferredValue, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  App as AntApp,
  Badge,
  Button,
  ConfigProvider,
  Drawer,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  Space,
  Typography
} from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FullscreenOutlined,
  HistoryOutlined,
  ImportOutlined,
  MenuOutlined,
  SearchOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  UploadOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import './main.css';
import LegacyAntAdapter from './LegacyAntAdapter';

const navigation = [
  {
    type: 'group',
    label: 'MONITORING',
    children: [
      { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: 'history', icon: <HistoryOutlined />, label: 'Riwayat Absensi' },
      { key: 'rekap', icon: <DatabaseOutlined />, label: 'Rekap Per ID' },
      { key: 'analisa', icon: <BarChartOutlined />, label: 'Analisis' }
    ]
  },
  {
    type: 'group',
    label: 'OPERASI',
    children: [{
      key: 'ijinkeluar',
      icon: <SafetyOutlined />,
      label: <span className="menu-ijin-label">Izin Keluar <Badge id="react-ijin-badge" count={0} size="small" /></span>
    }]
  },
  {
    type: 'group',
    label: 'DATA',
    children: [
      { key: 'karyawan', icon: <TeamOutlined />, label: 'Data Karyawan' },
      { key: 'impor', icon: <ImportOutlined />, label: 'Impor Data' }
    ]
  },
  {
    type: 'group',
    label: 'SISTEM',
    children: [
      { key: 'laporan', icon: <FileTextOutlined />, label: 'Laporan' },
      { key: 'pengaturan', icon: <SettingOutlined />, label: 'Pengaturan' },
      { key: 'admin', icon: <SafetyOutlined />, label: 'Admin Panel' }
    ]
  }
];

function NavigationMenu({ selected, onNavigate }) {
  return (
    <Menu
      className="soc-menu"
      mode="inline"
      selectedKeys={[selected]}
      items={navigation}
      onClick={({ key }) => onNavigate(key)}
    />
  );
}

function findEmployees(query) {
  if (!query) return [];
  try {
    const records = JSON.parse(localStorage.getItem('soc_raw_karyawan') || '{}');
    return Object.entries(records)
      .map(([id, record]) => ({
        id,
        name: typeof record === 'string' ? record : record?.nama || id,
        vendor: typeof record === 'object' && record ? record.vendor || '' : ''
      }))
      .filter((employee) => `${employee.id} ${employee.name} ${employee.vendor}`.toLowerCase().includes(query))
      .slice(0, 8);
  } catch {
    return [];
  }
}

function SidebarContent({ selected, onNavigate, onOpenSearch, mobile = false }) {
  return (
    <>
      <div className="soc-brand">
        <div className="soc-status"><span /> Sistem Aktif</div>
        <Typography.Title level={5}>SOC CILEUNGSI</Typography.Title>
        <Typography.Text type="secondary">Bontot DC · Workforce</Typography.Text>
      </div>
      {!mobile && (
        <div className="soc-clock">
          <strong id="sidebar-clock">--:--:--</strong>
          <span id="sidebar-date">Memuat waktu...</span>
        </div>
      )}
      <Button
        className="soc-quick-search"
        block
        icon={<SearchOutlined />}
        onClick={onOpenSearch}
        title="Pencarian cepat (Ctrl/⌘+K)"
      >
        Cari halaman atau karyawan
      </Button>
      <NavigationMenu selected={selected} onNavigate={onNavigate} />
      {!mobile && (
        <Space className="soc-tools" size={4}>
          <Button type="text" icon={<BellOutlined />} title="Aktifkan notifikasi" onClick={() => window.App?.notif.requestPermission()}>Notif</Button>
          <Button type="text" icon={<FullscreenOutlined />} title="Layar penuh" onClick={() => window.toggleFullscreen?.()}>Layar</Button>
          <Button type="text" icon={<UploadOutlined />} title="Backup data" onClick={() => window.App?.data.backupJSON()}>Backup</Button>
        </Space>
      )}
      <div className="soc-version">SOC v4.0 · Build 2025</div>
    </>
  );
}

function Shell() {
  const [selected, setSelected] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ijinCount, setIjinCount] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const deferredQuery = useDeferredValue(commandQuery.trim().toLowerCase());
  const commands = navigation.flatMap((group) => group.children).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.key === 'ijinkeluar' ? 'Izin Keluar' : item.label,
    description: `Buka ${item.key === 'ijinkeluar' ? 'monitor izin keluar' : item.label.toLowerCase()}`
  }));
  const matchingCommands = commands.filter((command) => command.label.toLowerCase().includes(deferredQuery));
  const matchingEmployees = findEmployees(deferredQuery);

  useEffect(() => {
    const handleNavigation = (event) => {
      setSelected(event.detail);
      setMobileOpen(false);
      setCommandOpen(false);
    };
    const handleBadge = (event) => setIjinCount(event.detail);
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandQuery('');
        setCommandOpen(true);
      }
    };
    window.addEventListener('soc:navigate', handleNavigation);
    window.addEventListener('soc:badge', handleBadge);
    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener('soc:navigate', handleNavigation);
      window.removeEventListener('soc:badge', handleBadge);
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  const navigate = (key) => {
    setSelected(key);
    window.showView?.(key);
    setMobileOpen(false);
  };

  const openSearch = () => {
    setCommandQuery('');
    setMobileOpen(false);
    setCommandOpen(true);
  };

  const selectEmployee = (employee) => {
    navigate('dashboard');
    setCommandOpen(false);
    window.requestAnimationFrame(() => {
      const scanInput = document.getElementById('scan-id');
      if (!scanInput) return;
      scanInput.value = employee.id;
      window.App?.scan.onInput();
      scanInput.focus();
    });
  };

  return (
    <AntApp>
      <LegacyAntAdapter />
      <Layout.Sider className="soc-sider" width={248} theme="light">
        <SidebarContent selected={selected} onNavigate={navigate} onOpenSearch={openSearch} />
      </Layout.Sider>
      <header className="soc-mobile-header">
        <Button type="text" icon={<MenuOutlined />} aria-label="Buka menu" onClick={() => setMobileOpen(true)} />
        <Typography.Text strong>SOC CILEUNGSI</Typography.Text>
        <span id="clock-mini" className="soc-mobile-clock">--:--:--</span>
      </header>
      <Drawer
        className="soc-mobile-drawer"
        placement="left"
        width={248}
        title={null}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        <SidebarContent selected={selected} onNavigate={navigate} onOpenSearch={openSearch} mobile />
      </Drawer>
      <Modal
        title="Pencarian cepat"
        open={commandOpen}
        onCancel={() => setCommandOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Input
          autoFocus
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Cari halaman, ID, nama, atau vendor..."
          value={commandQuery}
          onChange={(event) => setCommandQuery(event.target.value)}
          onPressEnter={() => {
            if (matchingEmployees.length) selectEmployee(matchingEmployees[0]);
            else if (matchingCommands.length) navigate(matchingCommands[0].key);
          }}
        />
        <div className="soc-command-results">
          <Typography.Text type="secondary">Halaman</Typography.Text>
          <List
            size="small"
            dataSource={matchingCommands}
            locale={{ emptyText: 'Tidak ada halaman yang cocok' }}
            renderItem={(command) => (
              <List.Item key={command.key}>
                <Button type="text" block className="soc-command-button" icon={command.icon} onClick={() => navigate(command.key)}>
                  <span>{command.label}</span>
                  <Typography.Text type="secondary">{command.description}</Typography.Text>
                </Button>
              </List.Item>
            )}
          />
          {deferredQuery && (
            <>
              <Typography.Text type="secondary">Karyawan</Typography.Text>
              <List
                size="small"
                dataSource={matchingEmployees}
                locale={{ emptyText: 'Tidak ada karyawan yang cocok' }}
                renderItem={(employee) => (
                  <List.Item key={employee.id}>
                    <Button type="text" block className="soc-command-button" icon={<TeamOutlined />} onClick={() => selectEmployee(employee)}>
                      <span>{employee.name}</span>
                      <Typography.Text type="secondary">{employee.id}{employee.vendor ? ` · ${employee.vendor}` : ''}</Typography.Text>
                    </Button>
                  </List.Item>
                )}
              />
            </>
          )}
        </div>
      </Modal>
    </AntApp>
  );
}

createRoot(document.getElementById('react-shell')).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#ff3916',
        colorSuccess: '#389e0d',
        colorWarning: '#d48806',
        colorError: '#cf1322',
        borderRadius: 6,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }
    }}
  >
    <Shell />
  </ConfigProvider>
);
