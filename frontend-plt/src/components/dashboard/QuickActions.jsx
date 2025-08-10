import { Card, Button, Row, Col } from 'antd';
import { 
  PlusOutlined, 
  ShoppingCartOutlined, 
  BoxPlotOutlined, 
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  UserAddOutlined,
  SettingOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const QuickActions = ({ onCreateOrder, onAddProduct, onExportReport, onAddCustomer, onSettings }) => {
  const { t } = useTranslation();
  const ActionButton = ({ title, description, icon, gradient, onClick, iconColor = 'white' }) => (
    <Card
      className="h-full border-0 overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
      styles={{ body: { padding: 0 } }}
      onClick={onClick}
    >
      <div className={`p-6 h-full bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-${iconColor} text-xl group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <div className="w-25 h-25 rounded-full bg-white bg-opacity-10 absolute -top-10 -right-10 group-hover:scale-125 transition-transform duration-500 opacity-10" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
          <p className="text-white text-opacity-90 text-sm leading-relaxed">{description}</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black from-0% to-transparent to-50% opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>
    </Card>
  );

  const actions = [
    {
      title: t('TXT_CREATE_NEW_ORDER'),
      description: t('TXT_CREATE_ORDER_DESC'),
      icon: <ShoppingCartOutlined />,
      gradient: 'from-blue-500 to-blue-600',
      onClick: onCreateOrder,
    },
    {
      title: t('TXT_ADD_PRODUCT'),
      description: t('TXT_ADD_PRODUCT_DESC'),
      icon: <BoxPlotOutlined />,
      gradient: 'from-green-500 to-green-600',
      onClick: onAddProduct,
    },
    {
      title: t('TXT_EXPORT_REPORT'),
      description: t('TXT_EXPORT_REPORT_DESC'),
      icon: <FileExcelOutlined />,
      gradient: 'from-emerald-500 to-emerald-600',
      onClick: () => onExportReport && onExportReport('excel'),
    },
    {
      title: 'Xuất PDF',
      description: 'Tạo báo cáo PDF chuyên nghiệp để chia sẻ',
      icon: <FilePdfOutlined />,
      gradient: 'from-red-500 to-red-600',
      onClick: () => onExportReport && onExportReport('pdf'),
    },
    {
      title: 'In Dashboard',
      description: 'In giao diện dashboard hiện tại để sử dụng offline',
      icon: <PrinterOutlined />,
      gradient: 'from-gray-500 to-gray-600',
      onClick: () => onExportReport && onExportReport('print'),
    },
    {
      title: t('TXT_ADD_CUSTOMER'),
      description: t('TXT_ADD_CUSTOMER_DESC'),
      icon: <UserAddOutlined />,
      gradient: 'from-purple-500 to-purple-600',
      onClick: onAddCustomer,
    },
  ];

  return (
    <Card 
      className="mb-8 shadow-md border-0"
      styles={{ body: { padding: '24px' } }}
      title={
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            <ThunderboltOutlined className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{t('TXT_QUICK_ACTIONS')}</h3>
            <p className="text-gray-600 text-sm">{t('TXT_ACCESS_FEATURES')}</p>
          </div>
        </div>
      }
    >
      <Row gutter={[24, 24]}>
        {actions.map((action, index) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={index}>
            <ActionButton {...action} />
          </Col>
        ))}
      </Row>
      
      {/* Settings Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={onSettings}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-6 py-3 h-auto rounded-lg font-medium"
          >
            {t('TXT_DASHBOARD_PREFERENCES')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuickActions;
