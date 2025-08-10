import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const AdminBreadcrumb = ({ storeActive }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { storeCode } = useParams();
  const { t } = useTranslation();

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [];

    // Add home item
    items.push({
      title: (
        <span 
          onClick={() => navigate('/overview')} 
          className="cursor-pointer hover:text-blue-500 flex items-center"
        >
          <HomeOutlined className="mr-1" />
          {t('TXT_OVERVIEW')}
        </span>
      ),
    });

    // Add store item if storeCode exists
    if (storeCode && storeActive) {
      items.push({
        title: (
          <span 
            onClick={() => navigate(`/store/${storeCode}/admin`)} 
            className="cursor-pointer hover:text-blue-500"
          >
            {storeActive.name}
          </span>
        ),
      });
    } else if (storeCode) {
      // Show placeholder while store is loading
      items.push({
        title: <span className="text-gray-400">Loading...</span>,
      });
    }

    // Add current page based on path
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length > 2) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      const secondLastSegment = pathSegments[pathSegments.length - 2];
      let title = '';
      
      // Handle nested routes
      if (lastSegment === 'ton-kho' && secondLastSegment === 'nguyen-lieu') {
        title = t('TXT_INGREDIENT_INVENTORY');
      } else {
        switch (lastSegment) {
          case 'admin':
            title = t('TXT_DASHBOARD');
            break;
          case 'loai-san-pham':
            title = t('TXT_PRODUCT_TYPES_MANAGEMENT');
            break;
          case 'nhan-vien':
            title = t('TXT_EMPLOYEE');
            break;
          case 'nha-cung-cap':
            title = t('TXT_SUPPLIERS');
            break;
          case 'san-pham':
            title = t('TXT_PRODUCT_MANAGEMENT');
            break;
          case 'san-pham-tong-hop':
            title = t('TXT_COMPOSITE_PRODUCTS');
            break;
          case 'nguyen-lieu':
            if (pathSegments[pathSegments.length - 2] !== 'nguyen-lieu') {
              title = t('TXT_INGREDIENTS');
            }
            break;
          case 'cong-thuc':
            title = t('TXT_RECIPES');
            break;
          case 'san-pham-cong-thuc':
            title = t('TXT_PRODUCT_RECIPE_MANAGEMENT');
            break;
          case 'kho':
            title = t('TXT_WAREHOUSES');
            break;
          case 'ton-kho':
            title = t('TXT_INVENTORY_MANAGEMENT');
            break;
          case 'sale':
            title = t('TXT_GO_TO_SALE_MEMBER_SCREEN');
            break;
          case 'phan-tich-chi-phi':
            title = t('TXT_COST_ANALYSIS');
            break;
          default:
            // Convert kebab-case to title case for display
            title = lastSegment.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
      }

      if (title && title !== t('TXT_DASHBOARD')) {
        items.push({
          title: <span className="text-gray-600 font-medium">{title}</span>,
        });
      }
    }

    return items;
  };

  if (!storeCode) {
    return null;
  }

  return (
    <div className='bg-gray-50 px-6 py-3 border-b border-gray-200'>
      <Breadcrumb 
        items={getBreadcrumbItems()} 
        separator=">"
        className="text-sm"
      />
    </div>
  );
};

export default AdminBreadcrumb;
