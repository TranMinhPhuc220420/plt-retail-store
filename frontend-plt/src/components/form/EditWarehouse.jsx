import React, { useEffect, useState } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Form, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Constants

// Request
import { updateMyWarehouse } from "@/request/warehouse";

const EditWarehouseForm = ({ storeData, onOK, onFail, onCancel }) => {
  // i18n
  const { t } = useTranslation();

  // Use Auth hook
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (storeData) {
      form.setFieldsValue({
        name: storeData.name,
        address: storeData.address,
      });
    }
  }, [storeData, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);

    // Prepare request body
    const requestBody = {
      name: values.name,
      address: values.address,
      storeCode: storeData.storeCode,
    };

    try {
      // Update warehouse in database
      await updateMyWarehouse(storeData._id, requestBody);

      form.resetFields();
      message.success(t('TXT_WAREHOUSE_UPDATED_SUCCESS'));

      onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('TXT_WAREHOUSE_UPDATE_FAILED');
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

  // Render
  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="grid grid-cols-1 gap-4 p-4 bg-white">
          <Form.Item
            name="name"
            label={t('TXT_STORE_NAME')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label={t('TXT_STORE_ADDRESS')}
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
            icon={<SaveOutlined />}
          >
            {t('TXT_SAVE')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EditWarehouseForm;