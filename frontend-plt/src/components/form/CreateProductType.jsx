import React, { useState } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input, Form, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Request
import { createMyProductType } from "@/request/product-type";

// Utilities
import { } from "@/utils";

const CreateProductTypeForm = ({ storeId, onOK, onFail, onCancel }) => {
  // i18n
  const { t } = useTranslation();

  // Use Auth hook
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);

  const [form] = Form.useForm();

  const onSubmit = async (values) => {
    setIsLoading(true);

    // Additional params
    values.storeId = storeId;
    values.ownerId = user.sub;
    console.log(values);
    

    // Add store to database
    try {
      await createMyProductType(values);

      form.resetFields();
      message.success(t('MSG_CREATE_PRODUCT_TYPE_SUCCESS'));

      if (onOK) onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('MSG_PRODUCT_TYPE_CREATION_FAILED');
      }
      message.error(messageError);

      if (onFail) onFail();
    }

    setIsLoading(false);
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
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
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
          <Button type="primary" htmlType="submit" loading={isLoading} disabled={isLoading} icon={<PlusOutlined />}>
            {t('TXT_ADD')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CreateProductTypeForm;