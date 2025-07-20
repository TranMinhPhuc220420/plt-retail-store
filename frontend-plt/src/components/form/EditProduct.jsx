import React, { useRef, useState, useEffect } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input, Form, Upload, message, InputNumber, Select } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Constants
import { SERVER_URL } from "@/constant";

// Request
import { updateMyProduct } from "@/request/product";

// Zustand store
import useStoreProduct from "@/store/product";
import useStoreProductType from "@/store/productType";

// Utilities
import { } from "@/utils";

const EditProduct = ({ productData, onOK, onFail, onCancel }) => {
  // i18n
  const { t } = useTranslation();

  // Use Auth hook
  const { user } = useAuth();

  // Zustand store
  const productTypes = useStoreProductType((state) => state.productTypes);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(productData?.imageUrl || "background-page-login.png");

  const [form] = Form.useForm();

  useEffect(() => {
    setIsLoading(false);
    setImageFile(null);

    if (productData) {
      form.setFieldsValue({
        name: productData.name,
        productCode: productData.productCode,
        unit: productData.unit,
        status: productData.status,
        price: productData.price,
        retailPrice: productData.retailPrice,
        wholesalePrice: productData.wholesalePrice,
        costPrice: productData.costPrice,
        stock: productData.stock,
        minStock: productData.minStock,
        categories: productData.categories?.map(cat => cat.id),
        description: productData.description,
      });
      setImageUrl(SERVER_URL + productData.imageUrl || "background-page-login.png");
    }
  }, [productData, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);

    // Additional params
    values.id = productData.id;
    values.ownerId = user.sub;
    if (imageFile) {
      values.file = imageFile;
    }

    try {
      // Update product in database
      await updateMyProduct(values.id, values);

      form.resetFields();
      setImageUrl("background-page-login.png");
      setImageFile(null);
      message.success(t('MSG_PRODUCT_UPDATED_SUCCESS'));

      onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('TXT_PRODUCT_UPDATE_FAILED');
      }
      message.error(messageError);
      onFail();
    }

    setIsLoading(false);
  };

  const handlerCancel = () => {
    form.setFieldsValue({
      name: productData.name,
      productCode: productData.productCode,
      unit: productData.unit,
      status: productData.status,
      price: productData.price,
      retailPrice: productData.retailPrice,
      wholesalePrice: productData.wholesalePrice,
      costPrice: productData.costPrice,
      stock: productData.stock,
      minStock: productData.minStock,
      categories: productData.categories?.map(cat => cat.id),
      description: productData.description,
    });
    setImageUrl(SERVER_URL + productData.imageUrl || "background-page-login.png");
    onCancel();
  };

  const handleAvatarChange = (info) => {
    const file = info.file;
    if (file) {
      setImageUrl(URL.createObjectURL(file));
      setImageFile(file);
    } else {
      setImageUrl(SERVER_URL + productData.imageUrl || "background-page-login.png");
      setImageFile(null);
    }
  };

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
            onChange={handleAvatarChange}
          >
            <img
              className="rounded-full object-cover"
              alt="Product Image"
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
            <Input readOnly disabled />
          </Form.Item>

          <Form.Item
            name="unit"
            label={t('TXT_UNIT')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input placeholder="kg, pcs, box..." />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('TXT_STATUS')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Select>
              <Select.Option value="active">{t('TXT_ACTIVE')}</Select.Option>
              <Select.Option value="inactive">{t('TXT_INACTIVE')}</Select.Option>
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
            name="wholesalePrice"
            label={t('TXT_WHOLESALE_PRICE')}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 bg-white">
          <Form.Item
            name="stock"
            label={t('TXT_STOCK')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
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

        <div className="grid gap-4 px-4 bg-white mb-4">
          <Form.Item
            name="categories"
            label={t('TXT_CATEGORIES')}
          >
            <Select
              mode="multiple"
              placeholder={t('TXT_SELECT_CATEGORIES')}
              options={productTypes?.map(type => ({
                label: type.name,
                value: type.id
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
            icon={<SaveOutlined />}
          >
            {t('TXT_SAVE')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditProduct;