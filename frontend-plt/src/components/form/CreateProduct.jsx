import React, { useRef, useState, useEffect } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input, Form, Upload, message, InputNumber, Select, AutoComplete } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Request
import { createMyProduct, uploadAvatarProduct } from "@/request/product";

// Zustand store
import useStoreProduct from "@/store/product";
import useStoreProductType from "@/store/productType";

// Utilities
import { } from "@/utils";

// Constants
import { IMAGE_PRODUCT_EXAMPLE, UNIT_LIST_SUGGESTION, PRODUCT_STATUS_LIST } from "@/constant";

const CreateProduct = ({ onOK, onFail, onCancel, storeCode }) => {
  // i18n
  const { t } = useTranslation();

  // Use Auth hook
  const { user } = useAuth();

  // Zustand store
  const productTypes = useStoreProductType((state) => state.productTypes);
  const { fetchProductTypes } = useStoreProductType();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(IMAGE_PRODUCT_EXAMPLE);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [form] = Form.useForm();

  const onSubmit = async (values) => {
    setIsLoading(true);

    // Additional params
    values.imageUrl = imageUrl;
    values.storeCode = storeCode;

    // Add product to database
    try {
      await createMyProduct(values);

      form.resetFields();
      setImageUrl(IMAGE_PRODUCT_EXAMPLE);
      setImageFile(null);
      message.success(t('MSG_PRODUCT_CREATED_SUCCESS'));

      onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('MSG_PRODUCT_CREATION_FAILED');
      }
      message.error(messageError);
      onFail();
    }

    setIsLoading(false);
  };

  const handlerCancel = () => {
    form.resetFields();
    setImageUrl(IMAGE_PRODUCT_EXAMPLE);
    onCancel();
  };

  const handleAvatarChange = async (info) => {
    const file = info.file;

    if (file) {
      setIsUploadingImage(true);
      try {
        const imageUrl = await uploadAvatarProduct(file);
        setImageUrl(imageUrl);
      } catch (error) {
        message.error(t('TXT_AVATAR_UPLOAD_FAILED'));
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      setImageUrl("background-page-login.png");
      setImageFile(null);
    }
  };

  // Fetch product types on mount
  useEffect(() => {
    fetchProductTypes(storeCode);
  }, []);

  // Render
  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {/* Avatar input */}
        <div className="w-full flex justify-center items-center">
          <Upload
            listType="picture-circle"
            showUploadList={false}
            beforeUpload={() => false}
            accept="image/*"
            disabled={isUploadingImage}
            onChange={handleAvatarChange}
          >
            <img
              className="rounded-full object-cover"
              style={{ cursor: 'pointer', width: '100%', height: '100%' }}
              src={imageUrl}
            />
          </Upload>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white">
          <Form.Item
            name="name"
            label={t('TXT_PRODUCT_NAME')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="productCode"
            label={t('TXT_PRODUCT_CODE')}
            rules={[
              { required: true, message: t('MSG_ERROR_REQUIRED') },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="unit"
            label={t('TXT_UNIT')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <AutoComplete
              placeholder={t('TXT_UNIT_PLACEHOLDER')}
              options={UNIT_LIST_SUGGESTION.map(unit => ({
                value: unit.name,
                label: unit.name
              }))}
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('TXT_STATUS')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Select>
              {PRODUCT_STATUS_LIST.map(status => (
                <Select.Option key={status.key} value={status.key}>
                  {status.value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 bg-white">
          <Form.Item
            name="price"
            label={t('TXT_PRICE')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <InputNumber
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VNĐ'}
              parser={(value) => value.replace(/\s?VNĐ|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="retailPrice"
            label={t('TXT_RETAIL_PRICE')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <InputNumber
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VNĐ'}
              parser={(value) => value.replace(/\s?VNĐ|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="costPrice"
            label={t('TXT_COST_PRICE')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <InputNumber
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' VNĐ'}
              parser={(value) => value.replace(/\s?VNĐ|(,*)/g, '')}
            />
          </Form.Item>
      
          <Form.Item
            name="minStock"
            label={t('TXT_MIN_STOCK')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <div className="grid gap-4 px-4 bg-white mb-4 mt-3">
          <Form.Item
            name="categories"
            label={t('TXT_CATEGORIES')}
          >
            <Select
              mode="multiple"
              placeholder={t('TXT_SELECT_CATEGORIES')}
              options={productTypes?.map(type => ({
                label: type.name,
                value: type._id
              }))}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('TXT_PRODUCT_DESCRIPTION')}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>

        <div className="flex justify-end px-4">
          <Button
            type="default"
            danger
            className="mr-3"
            onClick={handlerCancel}
            disabled={isLoading}
            icon={<CloseOutlined />}
          >
            {t('TXT_CANCEL')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={isLoading}
            icon={<PlusOutlined />}
          >
            {t('TXT_ADD')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateProduct;