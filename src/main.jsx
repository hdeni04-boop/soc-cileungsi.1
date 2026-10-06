import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  App as AntApp,
  Badge,
  Button,
  ConfigProvider,
  Drawer,
  Layout,
  Menu,
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
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  UploadOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import './main.css';

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

function SidebarContent({ selected, onNavigate, mobile = false }) {
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

  useEffect(() => {
    const handleNavigation = (event) => {
      setSelected(event.detail);
      setMobileOpen(false);
    };
    const handleBadge = (event) => setIjinCount(event.detail);
    window.addEventListener('soc:navigate', handleNavigation);
    window.addEventListener('soc:badge', handleBadge);
    return () => {
      window.removeEventListener('soc:navigate', handleNavigation);
      window.removeEventListener('soc:badge', handleBadge);
    };
  }, []);

  const navigate = (key) => {
    setSelected(key);
    window.showView?.(key);
    setMobileOpen(false);
  };

  return (
    <AntApp>
      <Layout.Sider className="soc-sider" width={248} theme="light">
        <SidebarContent selected={selected} onNavigate={navigate} />
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
        <SidebarContent selected={selected} onNavigate={navigate} mobile />
      </Drawer>
    </AntApp>
  );
}

createRoot(document.getElementById('react-shell')).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#1677ff',
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
