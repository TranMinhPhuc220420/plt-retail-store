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
    <div className="h-full w-full p-2">
      <EmployeeList
        storeId={storeActive._id}
        storeName={storeActive.name}
      />
    </div>
  );
};

export default EmployeeManagement;
