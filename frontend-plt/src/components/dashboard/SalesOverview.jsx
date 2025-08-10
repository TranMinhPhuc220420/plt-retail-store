import { Card, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ShoppingCartOutlined, DollarOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const SalesOverview = ({ data }) => {
  const { t } = useTranslation();
  const { todayRevenue, weekRevenue, monthRevenue, todayOrders, weekOrders, monthOrders, todayProducts, weekProducts, monthProducts } = data;

  const StatCard = ({ title, value, trend, percentageChange, icon, color, precision = 0 }) => (
    <Card 
      className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border-0"
      style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}
      styles={{ body: { padding: '24px' } }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {precision > 0 ? `$${value.toLocaleString('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision })}` : value.toLocaleString()}
          </div>
          <div className="flex items-center">
            {trend === 'up' ? (
              <ArrowUpOutlined className="text-green-500 mr-1" />
            ) : (
              <ArrowDownOutlined className="text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(percentageChange)}%
            </span>
            <span className="text-gray-500 text-sm ml-1">vs previous</span>
          </div>
        </div>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
      </div>
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{ 
          backgroundColor: color,
          transform: 'translate(25%, -25%)'
        }}
      />
    </Card>
  );

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('TXT_SALES_OVERVIEW')}</h2>
        <p className="text-gray-600">{t('TXT_VISUAL_BREAKDOWN')}</p>
      </div>
      
      {/* Revenue Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <DollarOutlined className="mr-2 text-green-500" />
          {t('TXT_TODAY_PERFORMANCE')}
        </h3>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_TODAY_REVENUE')}
              value={todayRevenue.value}
              trend={todayRevenue.trend}
              percentageChange={todayRevenue.percentageChange}
              icon={<DollarOutlined />}
              color="#10B981"
              precision={2}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_WEEK_REVENUE')}
              value={weekRevenue.value}
              trend={weekRevenue.trend}
              percentageChange={weekRevenue.percentageChange}
              icon={<DollarOutlined />}
              color="#059669"
              precision={2}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_MONTH_REVENUE')}
              value={monthRevenue.value}
              trend={monthRevenue.trend}
              percentageChange={monthRevenue.percentageChange}
              icon={<DollarOutlined />}
              color="#047857"
              precision={2}
            />
          </Col>
        </Row>
      </div>

      {/* Orders Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <ShoppingCartOutlined className="mr-2 text-blue-500" />
          {t('TXT_WEEK_PERFORMANCE')}
        </h3>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_TODAY_ORDERS')}
              value={todayOrders.value}
              percentageChange={todayOrders.percentageChange}
              icon={<ShoppingCartOutlined />}
              color="#3B82F6"
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_WEEK_ORDERS')}
              value={weekOrders.value}
              percentageChange={weekOrders.percentageChange}
              icon={<ShoppingCartOutlined />}
              color="#2563EB"
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_MONTH_ORDERS')}
              value={monthOrders.value}
              percentageChange={monthOrders.percentageChange}
              icon={<ShoppingCartOutlined />}
              color="#1D4ED8"
            />
          </Col>
        </Row>
      </div>

      {/* Products Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BoxPlotOutlined className="mr-2 text-purple-500" />
        </h3>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_TODAY_PRODUCTS')}
              value={todayProducts.value}
              percentageChange={todayProducts.percentageChange}
              icon={<BoxPlotOutlined />}
              color="#8B5CF6"
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_WEEK_PRODUCTS')}
              value={weekProducts.value}
              percentageChange={weekProducts.percentageChange}
              icon={<BoxPlotOutlined />}
              color="#7C3AED"
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard
              title={t('TXT_MONTH_PRODUCTS')}
              value={monthProducts.value}
              percentageChange={monthProducts.percentageChange}
              icon={<BoxPlotOutlined />}
              color="#6D28D9"
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SalesOverview;
