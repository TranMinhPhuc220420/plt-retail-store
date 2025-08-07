import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Select,
  Space,
  message,
  Spin,
  Breadcrumb
} from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import EmployeeList from '../../components/employee/EmployeeList';
import { useParams } from 'react-router';
import useStoreApp from '@/store/app';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;
const { Option } = Select;

const EmployeeManagement = () => {
  const { storeCode } = useParams();

  const { t } = useTranslation();

  const { storeActive } = useStoreApp();
  console.log(storeActive);


  return (
    <div className="h-full w-full px-4 pt-4 pb-10">
      <div className="mb-2">
        <Breadcrumb items={[{ title: t('TXT_EMPLOYEE') }, { title: t('TXT_MANAGER') }]} />
      </div>

      <EmployeeList
        storeId={storeActive._id}
        storeName={storeActive.name}
      />

    </div>
  );
};

export default EmployeeManagement;
