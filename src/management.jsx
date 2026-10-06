import React, { useEffect, useMemo, useState } from 'react';
import Alert from 'antd/es/alert';
import AntApp from 'antd/es/app';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Col from 'antd/es/col';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import CheckOutlined from '@ant-design/icons/es/icons/CheckOutlined';
import EditOutlined from '@ant-design/icons/es/icons/EditOutlined';
import EnvironmentOutlined from '@ant-design/icons/es/icons/EnvironmentOutlined';
import PlusOutlined from '@ant-design/icons/es/icons/PlusOutlined';
import StopOutlined from '@ant-design/icons/es/icons/StopOutlined';
import UserOutlined from '@ant-design/icons/es/icons/UserOutlined';

const WORKSPACES_KEY = 'soc_workspaces';
const ACTIVE_WORKSPACE_KEY = 'soc_active_workspace';
const PROFILE_KEY = 'soc_operator_profile';
const defaultWorkspace = {
  id: 'soc-cileungsi-bontot-dc',
  name: 'SOC Cileungsi',
  site: 'Bontot DC',
  client: 'Operasional SOC',
  supervisor: '',
  shift: 'Pagi',
  status: 'active'
};
const emptyProfile = {
  name: '',
  employeeId: '',
  role: 'Security Operator',
  phone: '',
  email: '',
  shift: 'Pagi'
};

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function loadWorkspaceStore() {
  const stored = readJson(WORKSPACES_KEY, null);
  const workspaces = Array.isArray(stored) && stored.length
    ? stored.filter((workspace) => workspace?.id && workspace?.name)
    : [defaultWorkspace];
  const eligible = workspaces.filter((workspace) => workspace.status !== 'archived');
  const storedActiveId = (() => {
    try { return localStorage.getItem(ACTIVE_WORKSPACE_KEY); } catch { return null; }
  })();
  const activeWorkspaceId = eligible.some((workspace) => workspace.id === storedActiveId)
    ? storedActiveId
    : eligible[0]?.id || '';
  const store = { workspaces, activeWorkspaceId };
  persistWorkspaceStore(store, false);
  return store;
}

export function persistWorkspaceStore(store, notify = true) {
  try {
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(store.workspaces));
    if (store.activeWorkspaceId) localStorage.setItem(ACTIVE_WORKSPACE_KEY, store.activeWorkspaceId);
    else localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  } catch { /* Keep the current session usable when storage is unavailable. */ }
  if (notify) window.dispatchEvent(new CustomEvent('soc:workspace-change', { detail: store }));
}

export function loadOperatorProfile() {
  const saved = readJson(PROFILE_KEY, {});
  return { ...emptyProfile, ...(saved && typeof saved === 'object' ? saved : {}) };
}

export function persistOperatorProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* Keep the current session usable when storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent('soc:profile-change', { detail: profile }));
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeInitials(name) {
  return String(name || 'Operator SOC')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

const shiftOptions = ['Pagi', 'Siang', 'Malam'].map((value) => ({ value, label: value }));

export function WorkspaceManagement({ store, onStoreChange }) {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const activeWorkspace = store.workspaces.find((workspace) => workspace.id === store.activeWorkspaceId);
  const activeCount = useMemo(() => store.workspaces.filter((workspace) => workspace.status !== 'archived').length, [store.workspaces]);

  useEffect(() => {
    if (modalOpen) form.setFieldsValue(editing || { name: '', site: '', client: '', supervisor: '', shift: 'Pagi' });
  }, [editing, form, modalOpen]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const saveWorkspace = (values) => {
    const record = {
      ...values,
      name: values.name.trim(),
      site: values.site.trim(),
      client: values.client?.trim() || '',
      supervisor: values.supervisor?.trim() || '',
      status: editing?.status || 'active'
    };
    const exists = editing && store.workspaces.some((workspace) => workspace.id === editing.id);
    const workspaces = exists
      ? store.workspaces.map((workspace) => workspace.id === editing.id ? { ...workspace, ...record } : workspace)
      : [{ ...record, id: newId() }, ...store.workspaces];
    const nextStore = {
      workspaces,
      activeWorkspaceId: store.activeWorkspaceId || workspaces.find((workspace) => workspace.status !== 'archived')?.id || ''
    };
    onStoreChange(nextStore);
    setModalOpen(false);
    message.success(exists ? 'Workspace diperbarui' : 'Workspace ditambahkan');
  };

  const activateWorkspace = (workspace) => {
    onStoreChange({ ...store, activeWorkspaceId: workspace.id });
    message.success(`${workspace.name} menjadi workspace aktif`);
  };

  const toggleArchive = (workspace) => {
    if (workspace.id === store.activeWorkspaceId && workspace.status !== 'archived') {
      message.warning('Pilih workspace lain sebelum mengarsipkan workspace aktif');
      return;
    }
    const status = workspace.status === 'archived' ? 'active' : 'archived';
    onStoreChange({
      ...store,
      workspaces: store.workspaces.map((item) => item.id === workspace.id ? { ...item, status } : item)
    });
    message.success(status === 'archived' ? 'Workspace diarsipkan' : 'Workspace diaktifkan kembali');
  };

  const columns = [
    {
      title: 'Workspace',
      dataIndex: 'name',
      key: 'name',
      render: (_, workspace) => (
        <Space align="start" size={10}>
          <Avatar shape="square" icon={<EnvironmentOutlined />} />
          <span>
            <Typography.Text strong>{workspace.name}</Typography.Text>
            <br />
            <Typography.Text type="secondary">{workspace.site}</Typography.Text>
          </span>
        </Space>
      )
    },
    { title: 'Unit / Klien', dataIndex: 'client', key: 'client', render: (value) => value || '-' },
    { title: 'Penanggung jawab', dataIndex: 'supervisor', key: 'supervisor', render: (value) => value || '-' },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', render: (value) => value || '-' },
    {
      title: 'Status',
      key: 'status',
      render: (_, workspace) => workspace.id === store.activeWorkspaceId
        ? <Tag color="blue">Workspace aktif</Tag>
        : workspace.status === 'archived' ? <Tag>Diarsipkan</Tag> : <Tag color="green">Tersedia</Tag>
    },
    {
      title: 'Aksi',
      key: 'actions',
      render: (_, workspace) => (
        <Space wrap size={4}>
          {workspace.status !== 'archived' && workspace.id !== store.activeWorkspaceId && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => activateWorkspace(workspace)}>Jadikan aktif</Button>
          )}
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            aria-label={`Edit ${workspace.name}`}
            title="Edit workspace"
            onClick={() => { setEditing(workspace); setModalOpen(true); }}
          />
          <Popconfirm
            title={workspace.status === 'archived' ? 'Aktifkan kembali workspace?' : 'Arsipkan workspace ini?'}
            description="Riwayat absensi tetap tersimpan."
            okText={workspace.status === 'archived' ? 'Aktifkan' : 'Arsipkan'}
            cancelText="Batal"
            onConfirm={() => toggleArchive(workspace)}
          >
            <Button
              size="small"
              type="text"
              icon={workspace.status === 'archived' ? <CheckOutlined /> : <StopOutlined />}
              aria-label={workspace.status === 'archived' ? 'Aktifkan workspace' : 'Arsipkan workspace'}
              title={workspace.status === 'archived' ? 'Aktifkan kembali' : 'Arsipkan workspace'}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="soc-management-content">
      <div className="soc-management-header">
        <div>
          <Typography.Title level={3}>Workspace Management</Typography.Title>
          <Typography.Text type="secondary">Atur lokasi operasi, unit, penanggung jawab, dan shift.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tambah workspace</Button>
      </div>
      <Alert
        showIcon
        type="info"
        message={activeWorkspace ? `Aktif sekarang: ${activeWorkspace.name} · ${activeWorkspace.site}` : 'Belum ada workspace aktif'}
        description="Workspace aktif akan dicatat pada absensi baru di browser ini. Data lama tidak diubah."
        className="soc-management-alert"
      />
      <Card className="soc-management-card" title={`Daftar workspace (${activeCount} tersedia)`}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={store.workspaces}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `${total} workspace` }}
          scroll={{ x: 820 }}
          locale={{ emptyText: 'Belum ada workspace' }}
        />
      </Card>
      <Modal
        title={editing ? 'Edit workspace' : 'Tambah workspace'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Simpan"
        cancelText="Batal"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={saveWorkspace} requiredMark="optional">
          <Form.Item label="Nama workspace" name="name" rules={[{ required: true, whitespace: true, message: 'Nama workspace harus diisi' }]}>
            <Input maxLength={60} placeholder="Contoh: SOC Cileungsi" />
          </Form.Item>
          <Form.Item label="Lokasi / site" name="site" rules={[{ required: true, whitespace: true, message: 'Lokasi harus diisi' }]}>
            <Input maxLength={80} placeholder="Contoh: Bontot DC" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="Unit / klien" name="client"><Input maxLength={60} placeholder="Nama unit atau klien" /></Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Shift utama" name="shift"><Select options={shiftOptions} /></Form.Item>
            </Col>
          </Row>
          <Form.Item label="Penanggung jawab" name="supervisor"><Input maxLength={60} placeholder="Nama PIC / supervisor" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export function ProfileManagement({ profile, onSave, activeWorkspace }) {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    form.setFieldsValue(profile);
  }, [form, profile]);

  const saveProfile = (values) => {
    const nextProfile = Object.fromEntries(Object.entries({ ...emptyProfile, ...values }).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    onSave(nextProfile);
    setSaved(true);
    message.success('Profil operator disimpan');
  };

  return (
    <div className="soc-management-content">
      <div className="soc-management-header">
        <div>
          <Typography.Title level={3}>Profil Operator</Typography.Title>
          <Typography.Text type="secondary">Kelola identitas dan kontak operator pada browser ini.</Typography.Text>
        </div>
        <Avatar size={48} icon={<UserOutlined />}>{makeInitials(profile.name)}</Avatar>
      </div>
      <Alert
        className="soc-management-alert"
        showIcon
        type="warning"
        message="Profil ini bukan akun login"
        description="Data hanya disimpan di browser perangkat ini. Pengelolaan akses dan sinkronisasi akun memerlukan backend."
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="soc-management-card" title="Informasi operator">
            <Form form={form} layout="vertical" onFinish={saveProfile} requiredMark="optional" className="soc-profile-form">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Nama lengkap" name="name" rules={[{ required: true, whitespace: true, message: 'Nama harus diisi' }]}>
                    <Input maxLength={80} placeholder="Nama operator" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="ID operator" name="employeeId"><Input maxLength={30} placeholder="ID karyawan (opsional)" /></Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Jabatan / peran" name="role" rules={[{ required: true, whitespace: true, message: 'Jabatan harus diisi' }]}>
                    <Input maxLength={60} placeholder="Contoh: Supervisor" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Shift" name="shift"><Select options={shiftOptions} /></Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Nomor telepon" name="phone" rules={[{ pattern: /^[+\d\s()-]*$/, message: 'Format nomor telepon tidak valid' }]}>
                    <Input maxLength={24} placeholder="Nomor yang dapat dihubungi" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Format email tidak valid' }]}>
                    <Input maxLength={120} placeholder="nama@perusahaan.com" />
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>Simpan profil</Button>
                {saved && <Typography.Text type="success">Tersimpan di perangkat ini</Typography.Text>}
              </Space>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="soc-management-card" title="Workspace saat ini">
            {activeWorkspace ? (
              <Space direction="vertical" size={4}>
                <Typography.Title level={5}>{activeWorkspace.name}</Typography.Title>
                <Typography.Text type="secondary">{activeWorkspace.site}</Typography.Text>
                <Tag color="blue">Shift {activeWorkspace.shift || 'Belum ditentukan'}</Tag>
              </Space>
            ) : <Typography.Text type="secondary">Belum ada workspace aktif</Typography.Text>}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export { emptyProfile };
