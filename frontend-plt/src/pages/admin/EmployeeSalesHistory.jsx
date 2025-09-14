import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Avatar,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  Typography,
  Divider
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { getEmployeeSalesHistory, getEmployeesSalesSummary } from '../../request/orders';
import { getApi } from '../../request';

// Zustand store
import useStoreApp from '@/store/app';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const EmployeeSalesHistory = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ordersData, setOrdersData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [statistics, setStatistics] = useState({});
  const [employeeSummary, setEmployeeSummary] = useState(null);
  const [employeesSummary, setEmployeesSummary] = useState([]);
  const [employees, setEmployees] = useState([]);

  const { storeActive } = useStoreApp();
  
  // Filters
  const [filters, setFilters] = useState({
    employeeId: undefined,
    dateRange: [],
    status: undefined,
    paymentStatus: undefined
  });

  // Load employees for dropdown
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await getApi(`/employees/store/${storeActive._id}?page=1&limit=1000`);
        console.log('Employees API response:', response);
        
        if (response?.data) {
          console.log(response.data.docs);
          setEmployees(response.data.docs || []);
        } else if (response?.success) {
          setEmployees(response.data || []);
        } else {
          console.error('Employees API error:', response);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadEmployees();
  }, []);

  // Load orders data
  const loadOrdersData = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...(filters.employeeId && { employeeId: filters.employeeId }),
        ...(filters.dateRange.length === 2 && {
          startDate: filters.dateRange[0].startOf('day').toISOString(),
          endDate: filters.dateRange[1].endOf('day').toISOString()
        }),
        ...(filters.status && { status: filters.status }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
      };

      console.log('Calling API with params:', params);
      const response = await getEmployeeSalesHistory(params);
      console.log('Raw API Response:', response);
      
      console.log('API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response success:', response?.success);
      console.log('Response data length:', response?.data?.length);
      
      if (response && response.success) {
        console.log('Orders data:', response.data);
        setOrdersData(response.data || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
        setStatistics(response.statistics || {});
        setEmployeeSummary(response.employeeSummary || null);
      } else {
        console.error('API returned success: false or no success field', response);
        // Try to handle data anyway if it exists
        if (response?.data && Array.isArray(response.data)) {
          console.log('Trying to set data anyway:', response.data);
          setOrdersData(response.data);
          setPagination(prev => ({
            ...prev,
            current: page,
            total: response.pagination?.total || response.data.length || 0,
            totalPages: response.pagination?.totalPages || 1
          }));
          setStatistics(response.statistics || {});
        } else {
          message.error(response?.message || 'API trả về lỗi');
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      message.error('Không thể tải dữ liệu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Load employees sales summary
  const loadEmployeesSummary = async () => {
    try {
      const params = {
        ...(filters.dateRange.length === 2 && {
          startDate: filters.dateRange[0].startOf('day').toISOString(),
          endDate: filters.dateRange[1].endOf('day').toISOString()
        }),
        limit: 10
      };

      const response = await getEmployeesSalesSummary(params);
      if (response.success) {
        setEmployeesSummary(response.data || []);
      }
    } catch (error) {
      console.error('Error loading employees summary:', error);
    }
  };

  useEffect(() => {
    loadOrdersData(1);
    loadEmployeesSummary();
  }, [filters]);

  // Debug: Log ordersData when it changes
  useEffect(() => {
    console.log('Orders data updated:', ordersData);
    console.log('Orders data length:', ordersData.length);
  }, [ordersData]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTableChange = (paginationInfo) => {
    loadOrdersData(paginationInfo.current);
  };

  const handleReset = () => {
    setFilters({
      employeeId: undefined,
      dateRange: [],
      status: undefined,
      paymentStatus: undefined
    });
  };

  // Table columns for orders
  const orderColumns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (text, record) => (
        <div>
          <Text strong className="text-blue-600">#{text}</Text>
          <div className="text-xs text-gray-500 flex items-center mt-1">
            <CalendarOutlined className="mr-1" />
            {moment(record.createdAt).format('DD/MM/YYYY HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: 'Nhân viên',
      key: 'employee',
      width: 200,
      render: (text, record) => {
        // Handle case where employeeId is null but employeeName exists
        const employeeName = record.employeeId?.name || record.employeeName || 'N/A';
        const employeeEmail = record.employeeId?.email || '';
        const employeeAvatar = record.employeeId?.avatar || '';
        
        return (
          <div className="flex items-center space-x-3">
            <Avatar
              size={40}
              src={employeeAvatar}
              icon={<UserOutlined />}
              className="flex-shrink-0"
            />
            <div>
              <Text strong>{employeeName}</Text>
              {employeeEmail && (
                <div className="text-sm text-gray-500">
                  {employeeEmail}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      render: (text, record) => (
        <div>
          <Text strong>{text || 'N/A'}</Text>
          {record.customerPhone && (
            <div className="text-sm text-gray-500">{record.customerPhone}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Số mặt hàng',
      dataIndex: 'items',
      key: 'itemCount',
      width: 100,
      align: 'center',
      render: (items) => (
        <div className="text-center">
          <Text strong className="text-lg">{items?.length || 0}</Text>
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value) => {
        // Handle both Decimal128 object and regular number
        let amount = 0;
        if (value && typeof value === 'object' && value.$numberDecimal) {
          amount = parseFloat(value.$numberDecimal);
        } else if (typeof value === 'number') {
          amount = value;
        } else if (typeof value === 'string') {
          amount = parseFloat(value) || 0;
        }
        
        return (
          <div className="text-right">
            <Text strong className="text-green-600 text-lg">
              {amount.toLocaleString('vi-VN')} ₫
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const getStatusConfig = (status) => {
          switch (status?.toLowerCase()) {
            case 'draft':
              return { color: 'orange', text: 'Nháp' };
            case 'confirmed':
              return { color: 'blue', text: 'Đã xác nhận' };
            case 'completed':
              return { color: 'green', text: 'Hoàn thành' };
            case 'cancelled':
              return { color: 'red', text: 'Đã hủy' };
            default:
              return { color: 'default', text: status || 'N/A' };
          }
        };
        
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (status) => {
        const getPaymentConfig = (status) => {
          switch (status?.toLowerCase()) {
            case 'pending':
              return { color: 'orange', text: 'Chờ thanh toán' };
            case 'paid':
              return { color: 'green', text: 'Đã thanh toán' };
            case 'partial':
              return { color: 'blue', text: 'Thanh toán 1 phần' };
            case 'refunded':
              return { color: 'red', text: 'Đã hoàn tiền' };
            default:
              return { color: 'default', text: status || 'N/A' };
          }
        };
        
        const config = getPaymentConfig(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              // Handle view order detail
              message.info(`Xem chi tiết đơn hàng #${record.orderNumber}`);
            }}
          />
        </Space>
      ),
    },
  ];

  // Table columns for employees summary
  const employeeSummaryColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size={40}
            src={record.employeeAvatar}
            icon={<UserOutlined />}
          />
          <div>
            <Text strong>{text || 'N/A'}</Text>
            <div className="text-sm text-gray-500">
              {record.employeeEmail || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'center',
      render: (value) => <Text strong className="text-blue-600">{value}</Text>,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (value) => (
        <Text strong className="text-green-600">
          {Number(value || 0).toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
    {
      title: 'Giá trị TB/Đơn',
      dataIndex: 'avgOrderValue',
      key: 'avgOrderValue',
      align: 'right',
      render: (value) => (
        <Text>{Number(value || 0).toLocaleString('vi-VN')} ₫</Text>
      ),
    },
    {
      title: 'Tỷ lệ hoàn thành',
      dataIndex: 'completionRate',
      key: 'completionRate',
      align: 'center',
      render: (value) => <Text>{value || 0}%</Text>,
    },
    {
      title: 'Đơn gần nhất',
      dataIndex: 'lastOrderDate',
      key: 'lastOrderDate',
      render: (date) => (
        <Text className="text-sm">
          {date ? moment(date).format('DD/MM/YYYY HH:mm') : 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            handleFilterChange('employeeId', record.employeeId);
          }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Debug Info */}
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
        <p><strong>Debug Info:</strong></p>
        <p>Orders Data Length: {ordersData.length}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Statistics: {JSON.stringify(statistics)}</p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <Title level={2}>Lịch sử bán hàng của nhân viên</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadOrdersData(1)}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Chọn nhân viên"
              style={{ width: '100%' }}
              value={filters.employeeId}
              onChange={(value) => handleFilterChange('employeeId', value)}
              allowClear
            >
              {employees.map(emp => (
                <Option key={emp._id} value={emp._id}>
                  {emp.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates || [])}
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Trạng thái"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
            >
              <Option value="draft">Nháp</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Thanh toán"
              style={{ width: '100%' }}
              value={filters.paymentStatus}
              onChange={(value) => handleFilterChange('paymentStatus', value)}
              allowClear
            >
              <Option value="pending">Chờ thanh toán</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="partial">Thanh toán 1 phần</Option>
              <Option value="refunded">Đã hoàn tiền</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button onClick={handleReset}>Đặt lại</Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {(filters.employeeId && employeeSummary) || Object.keys(statistics).length > 0 ? (
        <Card title="Thống kê">
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Tổng số đơn hàng"
                value={statistics.totalOrders || 0}
                prefix={<ShoppingOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Doanh thu"
                value={statistics.totalRevenue || 0}
                precision={0}
                prefix={<DollarOutlined />}
                suffix="₫"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Giá trị TB/Đơn"
                value={statistics.avgOrderValue || 0}
                precision={0}
                suffix="₫"
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Đơn hoàn thành"
                value={statistics.completedOrders || 0}
                suffix={`/ ${statistics.totalOrders || 0}`}
              />
            </Col>
          </Row>
        </Card>
      ) : null}

      {/* Employees Sales Summary - Only show when no specific employee selected */}
      {!filters.employeeId && employeesSummary.length > 0 && (
        <Card title="Top nhân viên bán hàng">
          <Table
            dataSource={employeesSummary}
            columns={employeeSummaryColumns}
            pagination={false}
            rowKey="employeeId"
            size="small"
          />
        </Card>
      )}

      {/* Orders Table */}
      <Card title={filters.employeeId ? "Chi tiết đơn hàng" : "Tất cả đơn hàng"}>
        {/* Debug Section */}
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f9f9f9' }}>
          <p>Table Data Debug:</p>
          <ul>
            <li>Data Source Length: {ordersData.length}</li>
            <li>Loading State: {loading.toString()}</li>
            <li>Columns Length: {orderColumns.length}</li>
            {ordersData.length > 0 && (
              <li>First Order ID: {ordersData[0]._id}</li>
            )}
          </ul>
        </div>

        {ordersData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            Không có dữ liệu đơn hàng
          </div>
        )}
        <Table
          dataSource={ordersData}
          columns={orderColumns}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đơn hàng`,
          }}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default EmployeeSalesHistory;