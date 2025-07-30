import React, { useState } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Form, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Request
import { deleteMyWarehouse } from "@/request/warehouse";

const ConfirmDeleteWarehouse = ({ warehouse, onOK, onFail, onCancel }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await deleteMyWarehouse(warehouse._id);
      form.resetFields();
      message.success(t('MSG_WAREHOUSE_DELETED_SUCCESS'));
      if (onOK) onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('MSG_WAREHOUSE_DELETE_FAILED');
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

  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="grid gap-4 p-4 bg-white">
          <div className="mt-4">
            <p
              dangerouslySetInnerHTML={{
                __html: t('TXT_CONFIRM_DELETE_WAREHOUSE_DESCRIPTION').replace('warehouse_name', warehouse.name),
              }}
            ></p>
          </div>

          <Form.Item
            name="name_warehouse_confirm_delete"
            label={t('TXT_NAME_WAREHOUSE_CONFIRM_DELETE')}
            rules={[
              {
                required: true,
                message: t('MSG_WAREHOUSE_NAME_REQUIRED'),
              },
              {
                validator: (_, value) => {
                  if (!value || value === warehouse.name) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('MSG_WAREHOUSE_NAME_MISMATCH')));
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
        </div>

        <div className="flex justify-end px-4">
          <Button
            type="default"
            className="mr-3"
            danger
            htmlType="submit"
            loading={isLoading}
            disabled={isLoading}
            icon={<DeleteOutlined />}
          >
            {t('TXT_CONFIRM_DELETE')}
          </Button>
          <Button
            type="primary"
            disabled={isLoading}
            icon={<CloseOutlined />}
            onClick={handlerCancel}
          >
            {t('TXT_CANCEL')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ConfirmDeleteWarehouse;
