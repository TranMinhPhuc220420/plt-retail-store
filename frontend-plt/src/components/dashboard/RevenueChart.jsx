import { Card } from 'antd';
import { Line } from '@ant-design/plots';
import { TeamOutlined } from '@ant-design/icons';

const RevenueChart = ({ data }) => {
  const config = {
    data,
    padding: 'auto',
    xField: 'date',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1500,
      },
    },
    xAxis: {
      type: 'time',
      tickCount: 8,
      label: {
        style: {
          fontSize: 12,
          fill: '#666',
        },
      },
      line: {
        style: {
          stroke: '#e8e8e8',
        },
      },
    },
    yAxis: {
      label: {
        formatter: (val) => `$${(val / 1000).toFixed(0)}K`,
        style: {
          fontSize: 12,
          fill: '#666',
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineDash: [3, 3],
          },
        },
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.category,
          value: `$${datum.value.toLocaleString()}`,
        };
      },
      domStyles: {
        'g2-tooltip': {
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
        },
      },
    },
    legend: {
      position: 'top-left',
      offsetY: -10,
      itemName: {
        style: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
    },
    color: ['#667eea', '#764ba2'],
    lineStyle: {
      lineWidth: 3,
    },
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#fff',
        stroke: '#667eea',
        lineWidth: 2,
      },
    },
  };

  return (
    <Card 
      className="mb-8 shadow-md border-0"
      styles={{ body: { padding: '24px' } }}
      title={
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <TeamOutlined className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Revenue Over Time</h3>
            <p className="text-gray-600 text-sm">Track your revenue trends and performance</p>
          </div>
        </div>
      }
    >
      <div 
        style={{ height: '400px' }}
        className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4"
      >
        <Line {...config} />
      </div>
    </Card>
  );
};

export default RevenueChart;
