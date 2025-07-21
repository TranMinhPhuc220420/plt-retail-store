import React, { useState } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { PlusOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Form, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Request
import { deleteMyStore } from "@/request/store";

// Utilities
import { } from "@/utils";

const ConfirmDeleteStore = ({ store, onOK, onFail, onCancel }) => {
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

    // Add store to database
    try {
      await deleteMyStore(store.storeCode);

      form.resetFields();
      message.success(t('MSG_STORE_DELETED_SUCCESS'));

      if (onOK) onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('MSG_STORE_DELETE_FAILED');
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
          <div className="mt-4">
            <p dangerouslySetInnerHTML={{ __html: t('TXT_CONFIRM_DELETE_STORE_DESCRIPTION').replace('store_name', store.name) }}></p>
          </div>
          
          <Form.Item
            name="name_store_confirm_delete"
            label={t('TXT_NAME_STORE_CONFIRM_DELETE')}
            rules={[
              {
                required: true,
                message: t('MSG_STORE_NAME_REQUIRED'),
              },
              {
                validator: (_, value) => {
                  if (!value || value === store.name) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('MSG_STORE_NAME_MISMATCH')));
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
        </div>

        <div className="flex justify-end px-4">
          <Button type="default" className="mr-3" danger htmlType="submit" loading={isLoading} disabled={isLoading} icon={<DeleteOutlined />}>
            {t('TXT_CONFIRM_DELETE')}
          </Button>
          <Button type="primary" disabled={isLoading} icon={<CloseOutlined />}
            onClick={handlerCancel}
          >
            {t('TXT_CANCEL')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ConfirmDeleteStore;