import React, { } from 'react';

import clsx from 'clsx';

// Hook components
import useAuth from "@/hooks/useAuth";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { toggleSider } from '@/store/features/app';

// Ant Design
import { MenuUnfoldOutlined, MenuFoldOutlined, LoadingOutlined, BellOutlined } from '@ant-design/icons';
import { Layout, Button, Dropdown, Badge } from 'antd';
const { Header } = Layout;

const SiderApp = ({ isLoading }) => {
  // Hook components
  const { user, signOut } = useAuth();

  // Redux
  const dispatch = useDispatch();
  const collapsed = useSelector((state) => state.app.collapsedSider);

  // State

  // Classes - clsx
  const classes = {
    collapsedBtn: clsx('border-none', {
    }),
  };

  // Handler
  const handleCollapse = () => {
    // Dispatch action to collapse the sider
    dispatch(toggleSider());
  };
  const handlerOnSelectMenuItem = () => {
    // Call signOut function from auth provider
    signOut();
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

  return (
    <Header className='shadow' style={{ backgroundColor: '#fff', paddingLeft: 10, paddingRight: 20 }}>
      <div className='flex items-center justify-between h-full'>

        {/* Button collapse sider app */}
        <Button type='text'
          className={classes.collapsedBtn}
          onClick={handleCollapse}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        />

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


export default SiderApp;