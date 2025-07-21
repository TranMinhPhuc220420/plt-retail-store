import React, { useEffect, useState } from "react";

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { PlusOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Form, Upload, message } from "antd";

// Hooks
import useAuth from "@/hooks/useAuth";

// Constants

// Request
import { updateMyStore, uploadAvatarStore } from "@/request/store";

const EditStoreForm = ({ storeData, onOK, onFail, onCancel }) => {
  // i18n
  const { t } = useTranslation();

  // Use Auth hook
  const { user } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(storeData?.imageUrl || "background-page-login.png");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    setIsLoading(false);

    if (storeData) {
      form.setFieldsValue({
        name: storeData.name,
        storeCode: storeData.storeCode,
        address: storeData.address,
        phone: storeData.phone,
        email: storeData.email,
        description: storeData.description,
      });
      setImageUrl(storeData.imageUrl || "background-page-login.png");
    }
  }, [storeData, form]);

  const onSubmit = async (values) => {
    setIsLoading(true);

    // Additional params
    values.ownerId = user.sub;
    values.imageUrl = imageUrl;

    try {
      // Update store in database
      await updateMyStore(storeData._id, values);

      form.resetFields();
      setImageUrl("background-page-login.png");
      message.success(t('TXT_STORE_UPDATED_SUCCESS'));

      onOK();
    } catch (error) {
      let messageError = t(error);
      if (!messageError || messageError === error) {
        messageError = t('TXT_STORE_UPDATE_FAILED');
      }
      message.error(messageError);
      onFail();
    }

    setIsLoading(false);
  };

  const handlerCancel = () => {
    form.setFieldsValue({
      name: storeData.name,
      address: storeData.address,
      phone: storeData.phone,
      email: storeData.email,
      description: storeData.description,
    });
    setImageUrl(storeData.imageUrl || "background-page-login.png");
    onCancel();
  };

  const handleAvatarChange = async (info) => {
    console.log("Avatar change info:", info);
    const file = info.file;

    if (file) {
      setIsUploadingImage(true);
      try {
        const newImageUrl = await uploadAvatarStore(file);
        setImageUrl(newImageUrl);
      } catch (error) {
        message.error(t('TXT_AVATAR_UPLOAD_FAILED'));
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      setImageUrl(storeData.imageUrl || "background-page-login.png");
    }
  };

  // Render
  return (
    <div>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {/* Avatar input */}
        <div className="w-full flex justify-center items-center">
          <Upload
            disabled={isUploadingImage}
            listType="picture-circle"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleAvatarChange}
          >
            <img
              className="rounded-full object-cover"
              alt="Avatar"
              style={{ cursor: 'pointer', width: '100%', height: '100%' }}
              src={imageUrl}
            />
          </Upload>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white">
          <Form.Item
            name="name"
            label={t('TXT_STORE_NAME')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="storeCode"
            label={t('TXT_STORE_CODE')}
            rules={[
              { required: true, message: t('MSG_ERROR_REQUIRED') },
            ]}
          >
            <Input readOnly disabled />
          </Form.Item>

          <Form.Item
            name="phone"
            label={t('TXT_STORE_PHONE')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('TXT_STORE_EMAIL')}
            rules={[
              { required: true, message: t('MSG_ERROR_REQUIRED') },
              { type: "email", message: t('MSG_EMAIL_INVALID') },
            ]}
          >
            <Input />
          </Form.Item>
        </div>

        <div className="grid gap-4 px-4 bg-white mb-4">
          <Form.Item
            name="address"
            label={t('TXT_STORE_ADDRESS')}
            rules={[{ required: true, message: t('MSG_ERROR_REQUIRED')}]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('TXT_STORE_DESCRIPTION')}
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

export default EditStoreForm;