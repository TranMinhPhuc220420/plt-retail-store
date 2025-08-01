import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Row, Col, Divider, Card, Tabs, InputNumber } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SupplierFormModal = ({
  visible,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  storeCode
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Populate form with existing data
        form.setFieldsValue({
          supplierCode: initialData.supplierCode,
          name: initialData.name,
          description: initialData.description,
          status: initialData.status || 'active',
          notes: initialData.notes,
          categories: initialData.categories,
          
          // Contact info
          'contactInfo.email': initialData.contactInfo?.email,
          'contactInfo.phone': initialData.contactInfo?.phone,
          'contactInfo.mobile': initialData.contactInfo?.mobile,
          'contactInfo.website': initialData.contactInfo?.website,
          'contactInfo.contactPerson.name': initialData.contactInfo?.contactPerson?.name,
          'contactInfo.contactPerson.title': initialData.contactInfo?.contactPerson?.title,
          'contactInfo.contactPerson.email': initialData.contactInfo?.contactPerson?.email,
          'contactInfo.contactPerson.phone': initialData.contactInfo?.contactPerson?.phone,
          
          // Address
          'address.street': initialData.address?.street,
          'address.city': initialData.address?.city,
          'address.state': initialData.address?.state,
          'address.zipCode': initialData.address?.zipCode,
          'address.country': initialData.address?.country,
          
          // Business info
          'businessInfo.taxId': initialData.businessInfo?.taxId,
          'businessInfo.registrationNumber': initialData.businessInfo?.registrationNumber,
          'businessInfo.businessType': initialData.businessInfo?.businessType,
          
          // Payment terms
          'paymentTerms.creditDays': initialData.paymentTerms?.creditDays,
          'paymentTerms.paymentMethod': initialData.paymentTerms?.paymentMethod,
          'paymentTerms.bankDetails.bankName': initialData.paymentTerms?.bankDetails?.bankName,
          'paymentTerms.bankDetails.accountNumber': initialData.paymentTerms?.bankDetails?.accountNumber,
          'paymentTerms.bankDetails.routingNumber': initialData.paymentTerms?.bankDetails?.routingNumber,
          'paymentTerms.bankDetails.swiftCode': initialData.paymentTerms?.bankDetails?.swiftCode,
          
          // Delivery info
          'deliveryInfo.minimumOrderAmount': initialData.deliveryInfo?.minimumOrderAmount,
          'deliveryInfo.deliveryTime': initialData.deliveryInfo?.deliveryTime,
          'deliveryInfo.deliveryZones': initialData.deliveryInfo?.deliveryZones,
          'deliveryInfo.shippingMethods': initialData.deliveryInfo?.shippingMethods,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 'active',
          'businessInfo.businessType': 'company',
          'paymentTerms.creditDays': 30,
          'paymentTerms.paymentMethod': 'bank_transfer'
        });
      }
      setActiveTab('basic');
    }
  }, [visible, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Structure the data according to the backend schema
      const supplierData = {
        supplierCode: values.supplierCode,
        name: values.name,
        description: values.description || '',
        status: values.status,
        notes: values.notes || '',
        categories: values.categories || [],
        storeCode,
        
        contactInfo: {
          email: values['contactInfo.email'] || '',
          phone: values['contactInfo.phone'] || '',
          mobile: values['contactInfo.mobile'] || '',
          website: values['contactInfo.website'] || '',
          contactPerson: {
            name: values['contactInfo.contactPerson.name'] || '',
            title: values['contactInfo.contactPerson.title'] || '',
            email: values['contactInfo.contactPerson.email'] || '',
            phone: values['contactInfo.contactPerson.phone'] || '',
          }
        },
        
        address: {
          street: values['address.street'] || '',
          city: values['address.city'] || '',
          state: values['address.state'] || '',
          zipCode: values['address.zipCode'] || '',
          country: values['address.country'] || '',
        },
        
        businessInfo: {
          taxId: values['businessInfo.taxId'] || '',
          registrationNumber: values['businessInfo.registrationNumber'] || '',
          businessType: values['businessInfo.businessType'] || 'company',
        },
        
        paymentTerms: {
          creditDays: values['paymentTerms.creditDays'] || 30,
          paymentMethod: values['paymentTerms.paymentMethod'] || 'bank_transfer',
          bankDetails: {
            bankName: values['paymentTerms.bankDetails.bankName'] || '',
            accountNumber: values['paymentTerms.bankDetails.accountNumber'] || '',
            routingNumber: values['paymentTerms.bankDetails.routingNumber'] || '',
            swiftCode: values['paymentTerms.bankDetails.swiftCode'] || '',
          }
        },
        
        deliveryInfo: {
          minimumOrderAmount: values['deliveryInfo.minimumOrderAmount'] || 0,
          deliveryTime: values['deliveryInfo.deliveryTime'] || '',
          deliveryZones: values['deliveryInfo.deliveryZones'] || [],
          shippingMethods: values['deliveryInfo.shippingMethods'] || [],
        }
      };

      await onSubmit(supplierData);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={isEditing ? t('TXT_SUPPLIER_EDIT') : t('TXT_SUPPLIER_ADD')}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel} icon={<CloseOutlined />}>
          {t('TXT_CANCEL')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<SaveOutlined />}
        >
          {isEditing ? t('TXT_SUPPLIER_UPDATE') : t('TXT_SUPPLIER_CREATE')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={t('TXT_SUPPLIER_BASIC_INFO')} key="basic">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="supplierCode"
                  label={t('TXT_SUPPLIER_CODE')}
                  rules={[
                    { required: true, message: t('MSG_SUPPLIER_CODE_REQUIRED') },
                    { min: 2, message: t('MSG_SUPPLIER_CODE_MIN_LENGTH') },
                    { max: 50, message: t('MSG_SUPPLIER_CODE_MAX_LENGTH') },
                    { pattern: /^[a-zA-Z0-9_-]+$/, message: t('MSG_SUPPLIER_CODE_FORMAT') }
                  ]}
                >
                  <Input placeholder={t('TXT_SUPPLIER_CODE_PLACEHOLDER')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={t('TXT_SUPPLIER_NAME')}
                  rules={[
                    { required: true, message: t('MSG_SUPPLIER_NAME_REQUIRED') },
                    { min: 2, message: t('MSG_SUPPLIER_NAME_MIN_LENGTH') },
                    { max: 200, message: t('MSG_SUPPLIER_NAME_MAX_LENGTH') }
                  ]}
                >
                  <Input placeholder={t('TXT_SUPPLIER_NAME_PLACEHOLDER')} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label={t('TXT_SUPPLIER_DESCRIPTION')}
              rules={[
                { max: 1000, message: t('MSG_SUPPLIER_DESCRIPTION_MAX_LENGTH') }
              ]}
            >
              <TextArea rows={3} placeholder={t('TXT_SUPPLIER_DESCRIPTION_PLACEHOLDER')} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label={t('TXT_SUPPLIER_STATUS')}
                  initialValue="active"
                >
                  <Select>
                    <Option value="active">{t('TXT_SUPPLIER_ACTIVE')}</Option>
                    <Option value="inactive">{t('TXT_SUPPLIER_INACTIVE')}</Option>
                    <Option value="pending_approval">{t('TXT_SUPPLIER_PENDING_APPROVAL')}</Option>
                    <Option value="blacklisted">{t('TXT_SUPPLIER_BLACKLISTED')}</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="categories"
                  label={t('TXT_SUPPLIER_CATEGORIES')}
                >
                  <Select
                    mode="tags"
                    placeholder={t('TXT_SUPPLIER_CATEGORIES_PLACEHOLDER')}
                    tokenSeparators={[',']}
                  >
                    <Option value="food">{t('TXT_SUPPLIER_CATEGORY_FOOD')}</Option>
                    <Option value="beverages">{t('TXT_SUPPLIER_CATEGORY_BEVERAGES')}</Option>
                    <Option value="equipment">{t('TXT_SUPPLIER_CATEGORY_EQUIPMENT')}</Option>
                    <Option value="packaging">{t('TXT_SUPPLIER_CATEGORY_PACKAGING')}</Option>
                    <Option value="ingredients">{t('TXT_SUPPLIER_CATEGORY_INGREDIENTS')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label={t('TXT_SUPPLIER_NOTES')}
              rules={[
                { max: 2000, message: t('MSG_SUPPLIER_NOTES_MAX_LENGTH') }
              ]}
            >
              <TextArea rows={4} placeholder={t('TXT_SUPPLIER_NOTES_PLACEHOLDER')} />
            </Form.Item>
          </TabPane>

          <TabPane tab={t('TXT_SUPPLIER_CONTACT_INFO')} key="contact">
            <Card title={t('TXT_SUPPLIER_CONTACT')} size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.email"
                    label={t('TXT_SUPPLIER_EMAIL')}
                    rules={[
                      { type: 'email', message: t('MSG_SUPPLIER_EMAIL_FORMAT') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_EMAIL_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.phone"
                    label={t('TXT_SUPPLIER_PHONE')}
                    rules={[
                      { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: t('MSG_SUPPLIER_PHONE_FORMAT') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_PHONE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.mobile"
                    label={t('TXT_SUPPLIER_MOBILE')}
                    rules={[
                      { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: t('MSG_SUPPLIER_MOBILE_FORMAT') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_MOBILE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.website"
                    label={t('TXT_SUPPLIER_WEBSITE')}
                    rules={[
                      { type: 'url', message: t('MSG_SUPPLIER_WEBSITE_FORMAT') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_WEBSITE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Divider />

            <Card title={t('TXT_SUPPLIER_CONTACT_PERSON')} size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.contactPerson.name"
                    label={t('TXT_SUPPLIER_CONTACT_PERSON_NAME')}
                    rules={[
                      { max: 100, message: t('MSG_SUPPLIER_CONTACT_PERSON_NAME_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_CONTACT_PERSON_NAME_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.contactPerson.title"
                    label={t('TXT_SUPPLIER_CONTACT_PERSON_TITLE')}
                    rules={[
                      { max: 100, message: t('MSG_SUPPLIER_CONTACT_PERSON_TITLE_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_CONTACT_PERSON_TITLE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.contactPerson.email"
                    label={t('TXT_SUPPLIER_CONTACT_PERSON_EMAIL')}
                    rules={[
                      { type: 'email', message: t('MSG_SUPPLIER_CONTACT_PERSON_EMAIL_FORMAT') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_CONTACT_PERSON_EMAIL_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="contactInfo.contactPerson.phone"
                    label={t('TXT_SUPPLIER_CONTACT_PERSON_PHONE')}
                    rules={[
                      { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: t('MSG_SUPPLIER_CONTACT_PERSON_PHONE_FORMAT') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_CONTACT_PERSON_PHONE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab={t('TXT_SUPPLIER_ADDRESS_BUSINESS')} key="business">
            <Card title={t('TXT_SUPPLIER_ADDRESS_INFO')} size="small">
              <Form.Item
                name="address.street"
                label={t('TXT_SUPPLIER_ADDRESS_STREET')}
                rules={[
                  { max: 200, message: t('MSG_SUPPLIER_ADDRESS_STREET_MAX_LENGTH') }
                ]}
              >
                <Input placeholder={t('TXT_SUPPLIER_ADDRESS_STREET_PLACEHOLDER')} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="address.city"
                    label={t('TXT_SUPPLIER_ADDRESS_CITY')}
                    rules={[
                      { max: 100, message: t('MSG_SUPPLIER_ADDRESS_CITY_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_ADDRESS_CITY_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="address.state"
                    label={t('TXT_SUPPLIER_ADDRESS_STATE')}
                    rules={[
                      { max: 100, message: t('MSG_SUPPLIER_ADDRESS_STATE_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_ADDRESS_STATE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="address.zipCode"
                    label={t('TXT_SUPPLIER_ADDRESS_ZIP')}
                    rules={[
                      { max: 20, message: t('MSG_SUPPLIER_ADDRESS_ZIP_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_ADDRESS_ZIP_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address.country"
                label={t('TXT_SUPPLIER_ADDRESS_COUNTRY')}
                rules={[
                  { max: 100, message: t('MSG_SUPPLIER_ADDRESS_COUNTRY_MAX_LENGTH') }
                ]}
              >
                <Input placeholder={t('TXT_SUPPLIER_ADDRESS_COUNTRY_PLACEHOLDER')} />
              </Form.Item>
            </Card>

            <Divider />

            <Card title={t('TXT_SUPPLIER_BUSINESS_INFO')} size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="businessInfo.businessType"
                    label={t('TXT_SUPPLIER_BUSINESS_TYPE')}
                    initialValue="company"
                  >
                    <Select>
                      <Option value="individual">{t('TXT_SUPPLIER_BUSINESS_TYPE_INDIVIDUAL')}</Option>
                      <Option value="company">{t('TXT_SUPPLIER_BUSINESS_TYPE_COMPANY')}</Option>
                      <Option value="corporation">{t('TXT_SUPPLIER_BUSINESS_TYPE_CORPORATION')}</Option>
                      <Option value="partnership">{t('TXT_SUPPLIER_BUSINESS_TYPE_PARTNERSHIP')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="businessInfo.taxId"
                    label={t('TXT_SUPPLIER_TAX_ID')}
                    rules={[
                      { max: 50, message: t('MSG_SUPPLIER_TAX_ID_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_TAX_ID_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="businessInfo.registrationNumber"
                    label={t('TXT_SUPPLIER_REGISTRATION_NUMBER')}
                    rules={[
                      { max: 50, message: t('MSG_SUPPLIER_REGISTRATION_NUMBER_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_REGISTRATION_NUMBER_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          <TabPane tab={t('TXT_SUPPLIER_PAYMENT_DELIVERY')} key="payment">
            <Card title={t('TXT_SUPPLIER_PAYMENT_TERMS')} size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms.creditDays"
                    label={t('TXT_SUPPLIER_CREDIT_DAYS')}
                    initialValue={30}
                    rules={[
                      { type: 'number', min: 0, max: 365, message: t('MSG_SUPPLIER_CREDIT_DAYS_RANGE') }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={365}
                      placeholder={t('TXT_SUPPLIER_CREDIT_DAYS_PLACEHOLDER')}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms.paymentMethod"
                    label={t('TXT_SUPPLIER_PAYMENT_METHOD')}
                    initialValue="bank_transfer"
                  >
                    <Select>
                      <Option value="cash">{t('TXT_SUPPLIER_PAYMENT_METHOD_CASH')}</Option>
                      <Option value="bank_transfer">{t('TXT_SUPPLIER_PAYMENT_METHOD_BANK_TRANSFER')}</Option>
                      <Option value="check">{t('TXT_SUPPLIER_PAYMENT_METHOD_CHECK')}</Option>
                      <Option value="credit_card">{t('TXT_SUPPLIER_PAYMENT_METHOD_CREDIT_CARD')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms.bankDetails.bankName"
                    label={t('TXT_SUPPLIER_BANK_NAME')}
                    rules={[
                      { max: 100, message: t('MSG_SUPPLIER_BANK_NAME_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_BANK_NAME_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms.bankDetails.accountNumber"
                    label={t('TXT_SUPPLIER_BANK_ACCOUNT_NUMBER')}
                    rules={[
                      { max: 50, message: t('MSG_SUPPLIER_BANK_ACCOUNT_NUMBER_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_BANK_ACCOUNT_NUMBER_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms.bankDetails.routingNumber"
                    label={t('TXT_SUPPLIER_BANK_ROUTING_NUMBER')}
                    rules={[
                      { max: 20, message: t('MSG_SUPPLIER_BANK_ROUTING_NUMBER_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_BANK_ROUTING_NUMBER_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="paymentTerms.bankDetails.swiftCode"
                    label={t('TXT_SUPPLIER_BANK_SWIFT_CODE')}
                    rules={[
                      { max: 20, message: t('MSG_SUPPLIER_BANK_SWIFT_CODE_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_BANK_SWIFT_CODE_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Divider />

            <Card title={t('TXT_SUPPLIER_DELIVERY_INFO')} size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="deliveryInfo.minimumOrderAmount"
                    label={t('TXT_SUPPLIER_MIN_ORDER_AMOUNT')}
                    rules={[
                      { type: 'number', min: 0, message: t('MSG_SUPPLIER_MIN_ORDER_AMOUNT_MIN') }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      placeholder={t('TXT_SUPPLIER_MIN_ORDER_AMOUNT_PLACEHOLDER')}
                      style={{ width: '100%' }}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="deliveryInfo.deliveryTime"
                    label={t('TXT_SUPPLIER_DELIVERY_TIME')}
                    rules={[
                      { max: 200, message: t('MSG_SUPPLIER_DELIVERY_TIME_MAX_LENGTH') }
                    ]}
                  >
                    <Input placeholder={t('TXT_SUPPLIER_DELIVERY_TIME_PLACEHOLDER')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="deliveryInfo.deliveryZones"
                    label={t('TXT_SUPPLIER_DELIVERY_ZONES')}
                  >
                    <Select
                      mode="tags"
                      placeholder={t('TXT_SUPPLIER_DELIVERY_ZONES_PLACEHOLDER')}
                      tokenSeparators={[',']}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="deliveryInfo.shippingMethods"
                    label={t('TXT_SUPPLIER_SHIPPING_METHODS')}
                  >
                    <Select
                      mode="tags"
                      placeholder={t('TXT_SUPPLIER_SHIPPING_METHODS_PLACEHOLDER')}
                      tokenSeparators={[',']}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default SupplierFormModal;
