import { useState } from 'react';
import { Modal, Switch, Slider, Select, Button, Form, Space, Divider, message } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';

const { Option } = Select;

const DashboardSettings = ({ visible, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30, // seconds
    theme: 'light',
    showNotifications: true,
    showLowStock: true,
    showRecentOrders: true,
    chartType: 'line',
    defaultPeriod: '30d',
    compactMode: false,
    realTimeUpdates: false
  });

  const handleSave = () => {
    form.validateFields().then(values => {
      setSettings(values);
      onSave && onSave(values);
      message.success('Dashboard settings saved successfully!');
      onClose();
    });
  };

  const handleReset = () => {
    const defaultSettings = {
      autoRefresh: true,
      refreshInterval: 30,
      theme: 'light',
      showNotifications: true,
      showLowStock: true,
      showRecentOrders: true,
      chartType: 'line',
      defaultPeriod: '30d',
      compactMode: false,
      realTimeUpdates: false
    };
    setSettings(defaultSettings);
    form.setFieldsValue(defaultSettings);
    message.success('Settings reset to default values');
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          Dashboard Settings
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          Reset to Default
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Save Settings
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onValuesChange={(changedValues, allValues) => setSettings(allValues)}
      >
        {/* Display Settings */}
        <Divider orientation="left">Display Settings</Divider>
        
        <Form.Item name="theme" label="Theme">
          <Select>
            <Option value="light">Light</Option>
            <Option value="dark">Dark</Option>
            <Option value="auto">Auto</Option>
          </Select>
        </Form.Item>

        <Form.Item name="compactMode" label="Compact Mode" valuePropName="checked">
          <Switch />
          <div className="text-sm text-gray-500 mt-1">
            Reduces spacing and shows more content on screen
          </div>
        </Form.Item>

        {/* Chart Settings */}
        <Divider orientation="left">Chart Settings</Divider>
        
        <Form.Item name="chartType" label="Default Chart Type">
          <Select>
            <Option value="line">Line Chart</Option>
            <Option value="bar">Bar Chart</Option>
            <Option value="area">Area Chart</Option>
          </Select>
        </Form.Item>

        <Form.Item name="defaultPeriod" label="Default Time Period">
          <Select>
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="90d">Last 90 Days</Option>
            <Option value="1y">Last Year</Option>
          </Select>
        </Form.Item>

        {/* Component Visibility */}
        <Divider orientation="left">Component Visibility</Divider>
        
        <Form.Item name="showNotifications" label="Show Notifications Panel" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="showLowStock" label="Show Low Stock Alerts" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="showRecentOrders" label="Show Recent Orders" valuePropName="checked">
          <Switch />
        </Form.Item>

        {/* Refresh Settings */}
        <Divider orientation="left">Refresh Settings</Divider>
        
        <Form.Item name="autoRefresh" label="Auto Refresh" valuePropName="checked">
          <Switch />
          <div className="text-sm text-gray-500 mt-1">
            Automatically refresh dashboard data
          </div>
        </Form.Item>

        {settings.autoRefresh && (
          <Form.Item name="refreshInterval" label="Refresh Interval (seconds)">
            <Slider
              min={10}
              max={300}
              step={10}
              marks={{
                10: '10s',
                30: '30s',
                60: '1m',
                120: '2m',
                300: '5m'
              }}
            />
          </Form.Item>
        )}

        <Form.Item name="realTimeUpdates" label="Real-time Updates" valuePropName="checked">
          <Switch />
          <div className="text-sm text-gray-500 mt-1">
            Enable WebSocket connection for live updates
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DashboardSettings;
