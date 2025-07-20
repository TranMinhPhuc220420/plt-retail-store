import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

// Hook components
import useAuth from "@/hooks/useAuth";

// Ant Design
import { LoadingOutlined, BellOutlined } from '@ant-design/icons';
import { Layout, Button, Dropdown, Badge, message } from 'antd';
const { Header } = Layout;

// Zustand store
import useStoreStore from '@/store/store';
import useStoreApp from '@/store/app';

// Request

const HeaderApp = ({ }) => {
  const navigate = useNavigate();
  const params = useParams();
  const storeCode = params.storeCode;

  // Ant Design message
  const [messageApi, contextHolder] = message.useMessage();

  // Use i18n
  const { t } = useTranslation();
  
  // Hook components
  const { user, isChecking, signOut } = useAuth();

  // Zustand store
  const { isLoading, stores, fetchStores } = useStoreStore();
  const { isFetchingStoreActiveError, messageStoreActiveError } = useStoreApp();

  // State
  const [collapsed, setCollapsed] = React.useState(false);
  const [storeActive, setStoreActive] = React.useState(null);

  // Handler
  const handleCollapse = () => {
  };
  const handlerOnSelectMenuItem = async () => {
    try {
      await signOut();
    } catch (error) {
      const message = t(error);
      if (message == error) {
        message = t('TXT_SIGN_OUT_ERROR');
      }
      messageApi.error(message);
    }
  };
  const handleSelectStore = (store) => {
    setStoreActive(store);
    
    let url = window.location.pathname;
    const match = url.match(/\/store\/[a-zA-Z0-9-]+\/(.*)/);
    const after = match ? match[1] : '';
    
    let nextUrl = '';
    if (after) {
      nextUrl = `/store/${store.storeCode}/${after}`;
    } else {
      nextUrl = `/store/${store.storeCode}/admin`;
    }

    navigate(nextUrl);
  };

  // Constants
  const items = [
    {
      label: (<span>Đăng Xuất</span>),
      key: '0',
      onClick: handlerOnSelectMenuItem,
    },
  ];
  const data_notification_example = [
    {
      id: 1,
      title: 'Thông báo 1',
      description: 'Mô tả thông báo 1',
      time: '2023-10-01 12:00',
    },
    {
      id: 2,
      title: 'Thông báo 2',
      description: 'Mô tả thông báo 2',
      time: '2023-10-01 13:00',
    },
    {
      id: 3,
      title: 'Thông báo 3',
      description: 'Mô tả thông báo 3',
      time: '2023-10-01 14:00',
    },
    {
      id: 4,
      title: 'Thông báo 4',
      description: 'Mô tả thông báo 4',
      time: '2023-10-01 15:00',
    },
  ]

  useEffect(() => {
    if (!isLoading) {
      fetchStores();
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const storeSelected = stores.find(store => store.storeCode === storeCode);
      if (storeSelected) {
        setStoreActive(storeSelected);
      } else {
        if (isFetchingStoreActiveError) {
          setStoreActive(null);

          if (messageStoreActiveError) {
            messageApi.error(messageStoreActiveError);
          }
          
          navigate('/overview');
        }
      }
    }
  }, [storeCode, stores]);

  return (
    <Header className='shadow' style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
      { contextHolder }
      <div className='flex items-center justify-between h-full'>

        <div className='flex items-center justify-end gap-3'>
          <Dropdown
            menu={{
              items: stores.map(store => ({
                key: store.code,
                label: (
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1'>
                    <img src={store.imageUrl} className='h-full object-cover rounded-full' style={{ width: 18, height: 18 }} />
                    {store.name}
                  </div>
                ),
                onClick: () => handleSelectStore(store),
              })),
            }}
            trigger={['click']}
          >
            <div className='h-10 flex items-center justify-start cursor-pointer border border-gray-200 rounded-lg hover:bg-gray-100 px-2'>
              {storeActive && (
                <img src={storeActive.imageUrl} alt="Store Logo" className='h-full object-cover rounded-full' style={{ width: 25, height: 25 }} />
              )}
              <div className='h-full ml-2 flex items-center justify-center'>
                {storeActive ? storeActive.name : 'Chọn cửa hàng'}
              </div>
            </div>
          </Dropdown>
        </div>

        <div className='flex items-center justify-end gap-3'>
          
          {/* List notification */}
          <Dropdown
            menu={{
              items: data_notification_example.map(item => ({
                key: item.id,
                label: (
                  <div className='px-2 hover:bg-gray-100 cursor-pointer w-[250px]'>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <span className='text-gray-500'>{item.time}</span>
                  </div>
                ),
              })),
            }}
            trigger={['click']}
          >
            <Badge count={5}>
              <Button type='text' className='border-none text-gray-500 hover:text-gray-700'
                icon={<BellOutlined />}
              />
            </Badge>
          </Dropdown>

          {!isChecking ?
            (
              <Dropdown menu={{ items }} trigger={['click']}>
                <div className='h-10 flex items-center justify-center cursor-pointer border border-gray-200 rounded-lg hover:bg-gray-100 pt-1 px-2 ml-2'>
                  <span className='mr-3'>{user.displayName}</span>
                  <img src={user.avatar} style={{width: 25, height: 25}} alt="Avatar" className='h-full rounded-full' />
                </div>
              </Dropdown>
            )
            :
            <LoadingOutlined style={{ fontSize: 24 }} spin />
          }
        </div>

      </div>
    </Header>
  );
};


export default HeaderApp;