import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

import clsx from 'clsx';

// Hook components
import useAuth from "@/hooks/useAuth";

// Ant Design
import { MenuUnfoldOutlined, MenuFoldOutlined, LoadingOutlined, BellOutlined } from '@ant-design/icons';
import { Layout, Button, Dropdown, Badge } from 'antd';
const { Header } = Layout;

// Zustand store
import useStoreStore from '@/store/store';

// Request
import { getMyStores } from '@/request/store';
import { SERVER_URL } from '@/constant';

const HeaderApp = ({ isLoading }) => {
  const navigate = useNavigate();
  const params = useParams();
  const storeCode = params.storeCode;
  
  // Hook components
  const { user, signOut } = useAuth();

  // Zustand store
  const { stores, setStores } = useStoreStore();

  // State
  const [collapsed, setCollapsed] = React.useState(false);
  const [storeActive, setStoreActive] = React.useState(null);

  // Classes - clsx
  const classes = {
    collapsedBtn: clsx('border-none', {
    }),
  };

  const loadStores = async () => {
    try {
      const stores = await getMyStores();
      setStores(stores);

      if (storeCode) {
        const activeStore = stores.find(store => store.storeCode === storeCode);
        if (activeStore) {
          setStoreActive(activeStore);
        } else {
          console.error('Store not found:', storeCode);
        }
      }

    } catch (error) {
      console.error('Failed to load stores:', error);
      message.error('Failed to load stores');
    }
  };

  // Handler
  const handleCollapse = () => {
  };
  const handlerOnSelectMenuItem = () => {
    // Call signOut function from auth provider
    signOut();
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
    loadStores();
  }, []);

  return (
    <Header className='shadow' style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
      <div className='flex items-center justify-between h-full'>

        <div className='flex items-center justify-end gap-3'>
          <Dropdown
            menu={{
              items: stores.map(store => ({
                key: store.code,
                label: (
                  <div className='flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1'>
                    <img src={SERVER_URL+store.imageUrl} className='h-full rounded-full' style={{ width: 18, height: 18 }} />
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
                <img src={SERVER_URL+storeActive.imageUrl} alt="Store Logo" className='h-full rounded-full' style={{ width: 25, height: 25 }} />
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

          {!isLoading ?
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