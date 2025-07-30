import React, { useState } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input, Form, Upload, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Request
import { createMyWarehouse } from "@/request/warehouse";

const CreateWarehouseForm = ({ storeId, storeCode, onOK, onFail, onCancel }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const [form] = Form.useForm();

  const onSubmit = async (values) => {
    setIsLoading(true);

    const requestBody = {
      name: values.name,
      address: values.address,
      storeCode: storeCode,
    };

    try {
      await createMyWarehouse(requestBody);

      form.resetFields();
      message.success(t('TXT_WAREHOUSE_CREATED_SUCCESS'));

      onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('TXT_WAREHOUSE_CREATION_FAILED');
      }
      message.error(messageError);
      onFail();
    }

    setIsLoading(false);
  };

  const handlerCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="grid grid-cols-1 gap-4 p-4 bg-white">
          <Form.Item
            name="name"
            label={t('TXT_WAREHOUSE_NAME')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label={t('TXT_WAREHOUSE_ADDRESS')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED')}]}
          >
            <Input />
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

export default CreateWarehouseForm;
