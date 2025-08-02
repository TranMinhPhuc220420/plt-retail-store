import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Descriptions,
  Divider,
  Progress,
  Statistic,
  Tabs,
  Alert,
  Rate,
  List,
  Badge,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  UserOutlined,
  BankOutlined,
  TruckOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import useSupplierStore from '@/store/supplier';
import SupplierFormModal from '@/components/form/SupplierFormModal';
import Loading from '@/components/Loading';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const SupplierDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { storeCode, supplierId } = useParams();

  const {
    supplierDetail,
    isLoadingDetail,
    error,
    success,
    fetchSupplierDetail,
    updateSupplier,
    deleteSupplier,
    fetchSupplierPerformance,
    clearError,
    clearSuccess,
    clearSupplierDetail
  } = useSupplierStore();

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetail(supplierId);
      loadPerformanceData();
    }

    return () => {
      clearSupplierDetail();
    };
  }, [supplierId, fetchSupplierDetail, clearSupplierDetail]);

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

  const loadPerformanceData = async () => {
    try {
      if (supplierId) {
        const data = await fetchSupplierPerformance(supplierId);
        setPerformanceData(data);
      }
    } catch (error) {
      // Error loading performance data
    }
  };

  const handleBack = () => {
    let path = `/store/${storeCode}/admin/nha-cung-cap`;
    navigate(path);
  };

  const handleEdit = () => {
    setFormModalVisible(true);
  };

  const handleDelete = async () => {
    try {
      await deleteSupplier(supplierId);
      handleBack();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleFormSubmit = async (supplierData) => {
    try {
      await updateSupplier(supplierId, supplierData);
      setFormModalVisible(false);
    } catch (error) {
      // Error handled by store
    }
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

  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircleOutlined />,
      inactive: <ClockCircleOutlined />,
      pending_approval: <ExclamationCircleOutlined />,
      blacklisted: <ExclamationCircleOutlined />
    };
    return icons[status] || <CheckCircleOutlined />;
  };

  if (isLoadingDetail || !supplierDetail) {
    return <Loading />;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            {t('TXT_BACK')}
          </Button>
        </Col>
        <Col flex={1}>
          <Title level={3} style={{ margin: 0 }}>
            {supplierDetail.name}
          </Title>
          <Space>
            <Text type="secondary">{supplierDetail.supplierCode}</Text>
            <Tag
              color={getStatusColor(supplierDetail.status)}
              icon={getStatusIcon(supplierDetail.status)}
            >
              {t(`TXT_SUPPLIER_${supplierDetail.status?.toUpperCase()}`) || t('TXT_SUPPLIER_UNKNOWN')}
            </Tag>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              {t('TXT_SUPPLIER_EDIT')}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              {t('TXT_SUPPLIER_DELETE')}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('TXT_OVERVIEW')} key="overview">
          <Row gutter={[16, 16]}>
            {/* Basic Information */}
            <Col xs={24} lg={12}>
              <Card title={t('TXT_SUPPLIER_BASIC_INFO')} size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('TXT_SUPPLIER_CODE')}>
                    <Text strong>{supplierDetail.supplierCode}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('TXT_SUPPLIER_NAME')}>
                    {supplierDetail.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('TXT_SUPPLIER_STATUS')}>
                    <Tag
                      color={getStatusColor(supplierDetail.status)}
                      icon={getStatusIcon(supplierDetail.status)}
                    >
                      {t(`TXT_SUPPLIER_${supplierDetail.status?.toUpperCase()}`) || t('TXT_SUPPLIER_UNKNOWN')}
                    </Tag>
                  </Descriptions.Item>
                  {supplierDetail.description && (
                    <Descriptions.Item label={t('TXT_SUPPLIER_DESCRIPTION')}>
                      <Paragraph>{supplierDetail.description}</Paragraph>
                    </Descriptions.Item>
                  )}

                  {supplierDetail.categories && supplierDetail.categories.length > 0 && (
                    <Descriptions.Item label={t('TXT_SUPPLIER_CATEGORIES')}>
                      <Space wrap>
                        {supplierDetail.categories.map((category, index) => {
                          let tag = '';
                          switch (category) {
                            case 'food':
                              tag = t('TXT_SUPPLIER_CATEGORY_FOOD');
                              break;
                            case 'beverages':
                              tag = t('TXT_SUPPLIER_CATEGORY_BEVERAGES');
                              break;
                            case 'equipment':
                              tag = t('TXT_SUPPLIER_CATEGORY_EQUIPMENT');
                              break;
                            case 'packaging':
                              tag = t('TXT_SUPPLIER_CATEGORY_PACKAGING');
                              break;
                            case 'ingredients':
                              tag = t('TXT_SUPPLIER_CATEGORY_INGREDIENTS');
                              break;
                            default:
                              tag = t('TXT_UNKNOWN');
                              break;
                          }
                          return (
                            <Tag key={index} color="blue">
                              {tag}
                            </Tag>
                          );
                        })}
                      </Space>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label={t('TXT_SUPPLIER_CREATED_DATE')}>
                    {supplierDetail.createdAt}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('TXT_LAST_UPDATED')}>
                    {supplierDetail.updatedAt}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Contact Information */}
            <Col xs={24} lg={12}>
              <Card title={t('TXT_SUPPLIER_CONTACT_INFO')} size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {supplierDetail.contactInfo?.email && (
                    <div>
                      <MailOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                      <Text>{supplierDetail.contactInfo.email}</Text>
                    </div>
                  )}
                  {supplierDetail.contactInfo?.phone && (
                    <div>
                      <PhoneOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      <Text>{supplierDetail.contactInfo.phone}</Text>
                    </div>
                  )}
                  {supplierDetail.contactInfo?.mobile && (
                    <div>
                      <PhoneOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                      <Text>{supplierDetail.contactInfo.mobile} {t('TXT_SUPPLIER_MOBILE')}</Text>
                    </div>
                  )}
                  {supplierDetail.contactInfo?.website && (
                    <div>
                      <GlobalOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                      <a href={supplierDetail.contactInfo.website} target="_blank" rel="noopener noreferrer">
                        {supplierDetail.contactInfo.website}
                      </a>
                    </div>
                  )}
                </Space>

                {supplierDetail.contactInfo?.contactPerson?.name && (
                  <>
                    <Divider />
                    <div>
                      <Text strong>{t('TXT_SUPPLIER_CONTACT_PERSON')}</Text>
                      <div style={{ marginTop: 8 }}>
                        <UserOutlined style={{ marginRight: 8 }} />
                        <Text>
                          {supplierDetail.contactInfo.contactPerson.name}
                          {supplierDetail.contactInfo.contactPerson.title &&
                            ` (${supplierDetail.contactInfo.contactPerson.title})`
                          }
                        </Text>
                      </div>
                      {supplierDetail.contactInfo.contactPerson.email && (
                        <div>
                          <MailOutlined style={{ marginRight: 8 }} />
                          <Text>{supplierDetail.contactInfo.contactPerson.email}</Text>
                        </div>
                      )}
                      {supplierDetail.contactInfo.contactPerson.phone && (
                        <div>
                          <PhoneOutlined style={{ marginRight: 8 }} />
                          <Text>{supplierDetail.contactInfo.contactPerson.phone}</Text>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </Col>

            {/* Address */}
            <Col xs={24}>
              <Card title={t('TXT_SUPPLIER_ADDRESS_INFO')} size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label={t('TXT_SUPPLIER_ADDRESS_STREET')}>
                        {supplierDetail.address?.street || t('TXT_UNKNOWN')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('TXT_SUPPLIER_ADDRESS_CITY')}>
                        {supplierDetail.address?.city || t('TXT_UNKNOWN')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('TXT_SUPPLIER_ADDRESS_STATE')}>
                        {supplierDetail.address?.state || t('TXT_UNKNOWN')}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} md={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label={t('TXT_SUPPLIER_ADDRESS_ZIP')}>
                        {supplierDetail.address?.zipCode || t('TXT_UNKNOWN')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('TXT_SUPPLIER_ADDRESS_COUNTRY')}>
                        {supplierDetail.address?.country || t('TXT_UNKNOWN')}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Notes */}
            {supplierDetail.notes && (
              <Col xs={24}>
                <Card title={t('TXT_SUPPLIER_NOTES')} size="small">
                  <Paragraph>{supplierDetail.notes}</Paragraph>
                </Card>
              </Col>
            )}
          </Row>
        </TabPane>

        <TabPane tab={t('TXT_SUPPLIER_BUSINESS_INFO')} key="business">
          <Row gutter={[16, 16]}>
            {/* Business Information */}
            <Col xs={24} lg={12}>
              <Card title={t('TXT_SUPPLIER_BUSINESS_INFO')} size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('TXT_SUPPLIER_BUSINESS_TYPE')}>
                    {t(`TXT_SUPPLIER_BUSINESS_TYPE_${supplierDetail.businessInfo?.businessType?.toUpperCase()}`) || t('TXT_UNKNOWN')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('TXT_SUPPLIER_TAX_ID')}>
                    {supplierDetail.businessInfo?.taxId || t('TXT_UNKNOWN')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('TXT_SUPPLIER_REGISTRATION_NUMBER')}>
                    {supplierDetail.businessInfo?.registrationNumber || t('TXT_UNKNOWN')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Payment Terms */}
            <Col xs={24} lg={12}>
              <Card title={t('TXT_SUPPLIER_PAYMENT_TERMS')} size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={t('TXT_SUPPLIER_CREDIT_DAYS')}>
                    {supplierDetail.paymentTerms?.creditDays || 0} {t('TXT_DAYS')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('TXT_SUPPLIER_PAYMENT_METHOD')}>
                    {t(`TXT_SUPPLIER_PAYMENT_METHOD_${supplierDetail.paymentTerms?.paymentMethod?.toUpperCase()}`) || t('TXT_UNKNOWN')}
                  </Descriptions.Item>
                </Descriptions>

                {supplierDetail.paymentTerms?.bankDetails && (
                  <>
                    <Divider />
                    <Text strong>{t('TXT_SUPPLIER_BANK_DETAILS')}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label={t('TXT_SUPPLIER_BANK_NAME')}>
                          {supplierDetail.paymentTerms.bankDetails.bankName || t('TXT_UNKNOWN')}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('TXT_SUPPLIER_BANK_ACCOUNT_NUMBER')}>
                          {supplierDetail.paymentTerms.bankDetails.accountNumber || t('TXT_UNKNOWN')}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('TXT_SUPPLIER_BANK_ROUTING_NUMBER')}>
                          {supplierDetail.paymentTerms.bankDetails.routingNumber || t('TXT_UNKNOWN')}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('TXT_SUPPLIER_BANK_SWIFT_CODE')}>
                          {supplierDetail.paymentTerms.bankDetails.swiftCode || t('TXT_UNKNOWN')}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </>
                )}
              </Card>
            </Col>

            {/* Delivery Information */}
            <Col xs={24}>
              <Card title={t('TXT_SUPPLIER_DELIVERY_INFO')} size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label={t('TXT_SUPPLIER_MIN_ORDER_AMOUNT')}>
                        {supplierDetail.deliveryInfo?.minimumOrderAmount
                          ? `${supplierDetail.deliveryInfo.minimumOrderAmount.$numberDecimal} VNĐ`
                          : t('TXT_UNKNOWN')
                        }
                      </Descriptions.Item>
                      <Descriptions.Item label={t('TXT_SUPPLIER_DELIVERY_TIME')}>
                        {supplierDetail.deliveryInfo?.deliveryTime || t('TXT_UNKNOWN')}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} md={12}>
                    {supplierDetail.deliveryInfo?.deliveryZones && supplierDetail.deliveryInfo.deliveryZones.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>{t('TXT_SUPPLIER_DELIVERY_ZONES')}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Space wrap>
                            {supplierDetail.deliveryInfo.deliveryZones.map((zone, index) => (
                              <Tag key={index} icon={<TruckOutlined />}>{zone}</Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    )}
                    {supplierDetail.deliveryInfo?.shippingMethods && supplierDetail.deliveryInfo.shippingMethods.length > 0 && (
                      <div>
                        <Text strong>{t('TXT_SUPPLIER_SHIPPING_METHODS')}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Space wrap>
                            {supplierDetail.deliveryInfo.shippingMethods.map((method, index) => (
                              <Tag key={index}>{method}</Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={t('TXT_SUPPLIER_PERFORMANCE')} key="performance">
          {performanceData ? (
            <Row gutter={[16, 16]}>
              {/* Performance Metrics */}
              <Col xs={24} lg={8}>
                <Card title={t('TXT_SUPPLIER_OVERALL_RATING')} size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Rate
                      disabled
                      value={performanceData.rating || 0}
                      style={{ fontSize: '24px' }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text strong style={{ fontSize: '18px' }}>
                        {performanceData.rating || 0}/5
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title={t('TXT_SUPPLIER_ORDER_STATISTICS')} size="small">
                  <Statistic
                    title={t('TXT_SUPPLIER_TOTAL_ORDERS')}
                    value={performanceData.totalOrders || 0}
                    style={{ marginBottom: 16 }}
                  />
                  <Statistic
                    title={t('TXT_SUPPLIER_ON_TIME_DELIVERIES')}
                    value={performanceData.onTimeDeliveries || 0}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card title={t('TXT_SUPPLIER_DELIVERY_PERFORMANCE')} size="small">
                  <Progress
                    type="circle"
                    percent={performanceData.deliveryPerformance || 0}
                    format={percent => `${percent}%`}
                  />
                </Card>
              </Col>

              {/* Performance Scores */}
              <Col xs={24}>
                <Card title={t('TXT_SUPPLIER_PERFORMANCE_SCORES')} size="small">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <div>
                        <Text>{t('TXT_SUPPLIER_QUALITY_SCORE')}</Text>
                        <Progress
                          percent={performanceData.qualityScore || 0}
                          status={performanceData.qualityScore >= 80 ? 'success' :
                            performanceData.qualityScore >= 60 ? 'normal' : 'exception'}
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div>
                        <Text>{t('TXT_SUPPLIER_DELIVERY_SCORE')}</Text>
                        <Progress
                          percent={performanceData.deliveryScore || 0}
                          status={performanceData.deliveryScore >= 80 ? 'success' :
                            performanceData.deliveryScore >= 60 ? 'normal' : 'exception'}
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div>
                        <Text>{t('TXT_SUPPLIER_SERVICE_SCORE')}</Text>
                        <Progress
                          percent={performanceData.serviceScore || 0}
                          status={performanceData.serviceScore >= 80 ? 'success' :
                            performanceData.serviceScore >= 60 ? 'normal' : 'exception'}
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          ) : (
            <Alert
              message={t('TXT_SUPPLIER_NO_PERFORMANCE_DATA')}
              description={t('TXT_SUPPLIER_PERFORMANCE_DATA_DESCRIPTION')}
              type="info"
              showIcon
            />
          )}
        </TabPane>
      </Tabs>

      <SupplierFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        onSubmit={handleFormSubmit}
        initialData={supplierDetail}
        loading={isLoadingDetail}
        storeCode={storeCode}
      />
    </div>
  );
};

export default SupplierDetail;
