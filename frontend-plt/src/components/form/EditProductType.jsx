import React, { useState, useEffect } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { PlusOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Form, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Request
import { updateMyProductType } from "@/request/product-type";

// Utilities
import { } from "@/utils";

const EditProductTypeForm = ({ storeId, storeCode, productTypeId, productTypeEdit, onOK, onFail, onCancel }) => {
  // i18n
  const { t } = useTranslation();

  // Use Auth hook
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);

  const [form] = Form.useForm();

  // Pre-fill form with productTypeEdit data
  useEffect(() => {
    if (productTypeEdit) {
      form.setFieldsValue({
        name: productTypeEdit.name,
        description: productTypeEdit.description,
      });
    }
  }, [productTypeEdit, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);

    // Additional params
    values.storeId = storeId;

    try {
      // Update product type in database
      await updateMyProductType(productTypeId, values);

      form.resetFields();
      message.success(t('MSG_UPDATE_PRODUCT_TYPE_SUCCESS'));

      onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('MSG_PRODUCT_TYPE_UPDATE_FAILED');
      }
      
      message.error(messageError);
      onFail();
    }
    finally {
      setIsLoading(false);
    }
  };

  const handlerCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Render
  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="grid gap-4 p-4 bg-white">
          <Form.Item
            name="name"
            label={t('TXT_STORE_NAME')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('TXT_STORE_DESCRIPTION')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') || "Required" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </div>

        <div className="flex justify-end px-4">
          <Button type="default" danger className="mr-3" disabled={isLoading} icon={<CloseOutlined />}
            onClick={handlerCancel}
          >
            {t('TXT_CANCEL')}
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading} disabled={isLoading} icon={<SaveOutlined />}>
            {t('TXT_SAVE')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditProductTypeForm;