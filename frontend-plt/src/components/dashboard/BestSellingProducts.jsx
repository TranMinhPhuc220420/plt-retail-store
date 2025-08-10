import { Card, Row, Col, Tag } from 'antd';
import { Pie, Column } from '@ant-design/plots';
import { TrophyOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';

const BestSellingProducts = ({ pieData, barData }) => {
  // Pie chart configuration with enhanced styling
  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.4,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
      style: {
        fontSize: 12,
        fontWeight: 'bold',
      },
    },
    statistic: {
      title: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '14px',
          color: '#8c8c8c',
        },
        content: 'Total\nProducts',
      },
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#262626',
        },
        content: pieData.length.toString(),
      },
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    legend: {
      position: 'bottom',
      itemName: {
        style: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.type,
          value: `${datum.value.toLocaleString()} units sold`,
        };
      },
    },
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'],
  };

  // Bar chart configuration with enhanced styling
  const barConfig = {
    data: barData,
    xField: 'value',
    yField: 'product',
    seriesField: 'product',
    legend: false,
    meta: {
      product: {
        alias: 'Product',
      },
      value: {
        alias: 'Units Sold',
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: 'Units Sold',
          value: datum.value.toLocaleString(),
        };
      },
    },
    color: ({ product }) => {
      const colors = [
        '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', 
        '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#096dd9'
      ];
      const index = barData.findIndex(item => item.product === product);
      return colors[index % colors.length];
    },
    label: {
      position: 'right',
      style: {
        fill: '#8c8c8c',
        fontSize: 11,
        fontWeight: 'bold',
      },
      formatter: (datum) => datum.value.toLocaleString(),
    },
    columnStyle: {
      radius: [0, 4, 4, 0],
    },
  };

  const totalSales = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="mb-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <TrophyOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                Best Selling Products
                <Tag 
                  color="blue" 
                  className="ml-3 font-semibold px-2 py-1"
                >
                  {pieData.length} products
                </Tag>
              </h3>
              <p className="text-gray-600 text-sm">Visual breakdown of your top performing products</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Units Sold</div>
            <div className="text-xl font-bold text-gray-900">
              {totalSales.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            className="shadow-md border-0 h-full"
            styles={{ body: { padding: '24px' } }}
            title={
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <PieChartOutlined className="text-white text-sm" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Market Share Distribution</div>
                  <div className="text-xs text-gray-500">Percentage breakdown by product</div>
                </div>
              </div>
            }
          >
            <div style={{ height: '400px' }}>
              <Pie {...pieConfig} />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            className="shadow-md border-0 h-full"
            styles={{ body: { padding: '24px' } }}
            title={
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                  <BarChartOutlined className="text-white text-sm" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Top {barData.length} Products</div>
                  <div className="text-xs text-gray-500">Units sold comparison</div>
                </div>
              </div>
            }
          >
            <div style={{ height: '400px' }}>
              <Column {...barConfig} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BestSellingProducts;
