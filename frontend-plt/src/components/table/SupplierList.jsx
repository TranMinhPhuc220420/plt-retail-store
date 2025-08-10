import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Typography,
  Tooltip,
  Dropdown,
  Menu,
  Modal
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  FilterOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import useSupplierStore from '@/store/supplier';
import SupplierFormModal from '@/components/form/SupplierFormModal';
import Loading from '@/components/Loading';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const SupplierList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { storeCode } = useParams();

  const {
    suppliers,
    isLoading,
    error,
    success,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deleteSuppliersInBulk,
    clearError,
    clearSuccess,
    setSupplierIsEditing
  } = useSupplierStore();

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);

  useEffect(() => {
    if (storeCode) {
      fetchSuppliers(storeCode);
    }
  }, [storeCode, fetchSuppliers]);

  useEffect(() => {
    if (error) {
      message.error(t(error));
      clearError();
    }
    if (success) {
      // message.success(t(success));
      clearSuccess();
    }
  }, [error, success, t, clearError, clearSuccess]);

  useEffect(() => {
    // Filter suppliers based on search text and status
    let filtered = suppliers;

    if (searchText) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
        supplier.supplierCode.toLowerCase().includes(searchText.toLowerCase()) ||
        supplier.contactInfo?.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        supplier.contactInfo?.phone?.includes(searchText)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter);
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchText, statusFilter]);

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setFormModalVisible(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setFormModalVisible(true);
  };

  const handleViewSupplier = (supplier) => {
    const path = `/store/${storeCode}/admin/nha-cung-cap/${supplier._id}`;
    navigate(path);
    setSupplierIsEditing(false);
  };

  const handleFormSubmit = async (supplierData) => {
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier._id, supplierData);
      } else {
        await createSupplier(supplierData);
      }
      setFormModalVisible(false);
      setSelectedSupplier(null);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await deleteSupplier(supplierId);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(t('Please select suppliers to delete'));
      return;
    }

    Modal.confirm({
      title: t('Confirm Bulk Delete'),
      content: t(`Are you sure you want to delete ${selectedRowKeys.length} suppliers?`),
      okText: t('Delete'),
      okType: 'danger',
      cancelText: t('Cancel'),
      onOk: async () => {
        try {
          await deleteSuppliersInBulk(selectedRowKeys);
          setSelectedRowKeys([]);
        } catch (error) {
          // Error handled by store
        }
      }
    });
  };

  const handleRefresh = () => {
    fetchSuppliers(storeCode);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      inactive: 'orange',
      pending_approval: 'blue',
      blacklisted: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: t('TXT_SUPPLIER_CODE'),
      dataIndex: 'supplierCode',
      key: 'supplierCode',
      width: 170,
      sorter: (a, b) => a.supplierCode.localeCompare(b.supplierCode),
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: t('TXT_SUPPLIER_NAME'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description.length > 50 
                  ? `${record.description.substring(0, 50)}...` 
                  : record.description}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: t('TXT_SUPPLIER_CONTACT'),
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div>
          {record.contactInfo?.email && (
            <div style={{ marginBottom: 4 }}>
              <MailOutlined style={{ marginRight: 4, color: '#1890ff' }} />
              <Text style={{ fontSize: '12px' }}>{record.contactInfo.email}</Text>
            </div>
          )}
          {record.contactInfo?.phone && (
            <div style={{ marginBottom: 4 }}>
              <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
              <Text style={{ fontSize: '12px' }}>{record.contactInfo.phone}</Text>
            </div>
          )}
          {record.contactInfo?.contactPerson?.name && (
            <div>
              <UserOutlined style={{ marginRight: 4, color: '#722ed1' }} />
              <Text style={{ fontSize: '12px' }}>{record.contactInfo.contactPerson.name}</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: t('TXT_SUPPLIER_CATEGORIES'),
      dataIndex: 'categories',
      key: 'categories',
      width: 150,
      // render: (categories) => (
      //   <div>
      //     {categories && categories.slice(0, 2).map((category, index) => (
      //       <Tag key={index} size="small" style={{ marginBottom: 2 }}>
      //         {category}
      //       </Tag>
      //     ))}
      //     {categories && categories.length > 2 && (
      //       <Tag size="small" color="default">
      //         +{categories.length - 2}
      //       </Tag>
      //     )}
      //   </div>
      // )
      /**
        food: TXT_SUPPLIER_CATEGORY_FOOD
        beverages: TXT_SUPPLIER_CATEGORY_BEVERAGES
        equipment: TXT_SUPPLIER_CATEGORY_EQUIPMENT
        packaging: TXT_SUPPLIER_CATEGORY_PACKAGING
        ingredients: TXT_SUPPLIER_CATEGORY_INGREDIENTS
       */
      render: (categories) => {
        let categoryTags = [];
        if (categories.includes('food')) categoryTags.push(t('TXT_SUPPLIER_CATEGORY_FOOD'));
        if (categories.includes('beverages')) categoryTags.push(t('TXT_SUPPLIER_CATEGORY_BEVERAGES'));
        if (categories.includes('equipment')) categoryTags.push(t('TXT_SUPPLIER_CATEGORY_EQUIPMENT'));
        if (categories.includes('packaging')) categoryTags.push(t('TXT_SUPPLIER_CATEGORY_PACKAGING'));
        if (categories.includes('ingredients')) categoryTags.push(t('TXT_SUPPLIER_CATEGORY_INGREDIENTS'));
        return (
          <div>
            {categoryTags.map((tag, index) => (
              <Tag key={index} size="small" style={{ marginBottom: 2 }}>
                {tag}
              </Tag>
            ))}
            {categories.length > categoryTags.length && (
              <Tag size="small" color="default">
                +{categories.length - categoryTags.length}
              </Tag>
            )}
          </div>
        );
      }
    },
    {
      title: t('TXT_SUPPLIER_STATUS'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status) => {
        let statusKey = 'TXT_SUPPLIER_UNKNOWN';
        if (status === 'active') statusKey = 'TXT_SUPPLIER_ACTIVE';
        else if (status === 'inactive') statusKey = 'TXT_SUPPLIER_INACTIVE';
        else if (status === 'pending_approval') statusKey = 'TXT_SUPPLIER_PENDING_APPROVAL';
        else if (status === 'blacklisted') statusKey = 'TXT_SUPPLIER_BLACKLISTED';
        return (
          <Tag color={getStatusColor(status)}>
            {t(statusKey)}
          </Tag>
        );
      }
    },
    {
      title: t('TXT_SUPPLIER_CREATED_DATE'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => <Text style={{ fontSize: '12px' }}>{date}</Text>
    },
    {
      title: t('TXT_SUPPLIER_ACTIONS'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: t('TXT_SUPPLIER_VIEW_DETAILS'),
            icon: <EyeOutlined />,
            onClick: () => handleViewSupplier(record)
          },
          {
            key: 'edit',
            label: t('TXT_SUPPLIER_EDIT'),
            icon: <EditOutlined />,
            onClick: () => handleEditSupplier(record)
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            label: t('TXT_SUPPLIER_DELETE'),
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: t('TXT_SUPPLIER_CONFIRM_DELETE'),
                content: t('TXT_SUPPLIER_DELETE_CONFIRMATION', { name: record.name }),
                okText: t('TXT_SUPPLIER_DELETE'),
                okType: 'danger',
                cancelText: t('TXT_CANCEL'),
                onOk: () => handleDeleteSupplier(record._id)
              });
            }
          }
        ];

        return (
          <Space size="small">
            <Tooltip title={t('TXT_SUPPLIER_VIEW_DETAILS')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewSupplier(record)}
              />
            </Tooltip>
            <Tooltip title={t('TXT_SUPPLIER_EDIT')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditSupplier(record)}
              />
            </Tooltip>
            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
              />
            </Dropdown>
          </Space>
        );
      }
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      name: record.name,
    }),
  };

  if (isLoading && suppliers.length === 0) {
    return <Loading />;
  }

  return (
    <div className="h-full w-full p-2">
      <div className="h-full w-full bg-white p-2 rounded-md shadow-sm overflow-hidden">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder={t('TXT_SUPPLIER_SEARCH_PLACEHOLDER')}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder={t('TXT_SUPPLIER_FILTER_BY_STATUS')}
            >
              <Option value="all">{t('TXT_SUPPLIER_ALL_STATUS')}</Option>
              <Option value="active">{t('TXT_SUPPLIER_ACTIVE')}</Option>
              <Option value="inactive">{t('TXT_SUPPLIER_INACTIVE')}</Option>
              <Option value="pending_approval">{t('TXT_SUPPLIER_PENDING_APPROVAL')}</Option>
              <Option value="blacklisted">{t('TXT_SUPPLIER_BLACKLISTED')}</Option>
            </Select>
          </Col>
          <Col flex={1} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoading}
              >
                {t('TXT_SUPPLIER_REFRESH')}
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBulkDelete}
                >
                  {t('TXT_SUPPLIER_DELETE_SELECTED')} ({selectedRowKeys.length})
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateSupplier}
              >
                {t('TXT_SUPPLIER_ADD')}
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t('TXT_SUPPLIER_TOTAL', { from: range[0], to: range[1], total }),
            pageSizeOptions: ['10', '20', '50', '100'],
            defaultPageSize: 20
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      <SupplierFormModal
        visible={formModalVisible}
        onClose={() => {
          setFormModalVisible(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={selectedSupplier}
        loading={isLoading}
        storeCode={storeCode}
      />
    </div>
  );
};

export default SupplierList;
