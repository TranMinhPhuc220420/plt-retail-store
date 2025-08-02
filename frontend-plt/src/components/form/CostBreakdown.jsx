import React from 'react';
import { Table, Card, Typography, Tag, Statistic, Row, Col, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/utils';

const { Title, Text } = Typography;

/**
 * Cost Breakdown Component - Display detailed cost analysis
 * @param {Object} props - Component props
 * @param {Object} props.costData - Cost breakdown data
 * @param {boolean} props.loading - Loading state
 * @param {string} props.title - Component title
 * @param {boolean} props.showSummary - Whether to show summary statistics
 */
const CostBreakdown = ({
  costData,
  loading = false,
  showSummary = true
}) => {
  const { t } = useTranslation();

  if (!costData) {
    return (
      <Card>
        <div className="text-center text-gray-500 py-8">
          {t('MSG_NO_COST_DATA_AVAILABLE')}
        </div>
      </Card>
    );
  }

  const columns = [
    {
      title: t('TXT_INGREDIENT'),
      dataIndex: 'ingredientName',
      key: 'ingredientName',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: t('TXT_AMOUNT_USED'),
      key: 'amountUsed',
      render: (_, record) => (
        <span>{record.amountUsed} {record.unit}</span>
      )
    },
    {
      title: t('TXT_UNIT_COST'),
      dataIndex: 'unitCost',
      key: 'unitCost',
      render: (cost) => (
        <span>{formatMoney(cost)}</span>
      )
    },
    {
      title: t('TXT_TOTAL_COST'),
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost) => (
        <Text strong className="text-green-600">
          {formatMoney(cost)}
        </Text>
      )
    }
  ];

  const summaryData = {
    totalCost: costData.totalCost || 0,
    costPerUnit: costData.costPerUnit || 0,
    yieldQuantity: costData.yieldQuantity || 1,
    ingredientCount: costData.costBreakdown?.length || 0
  };

  return (
    <Card loading={loading}>
      <Title level={4} className="mb-4">
        {t('TXT_COST_BREAKDOWN')}
      </Title>

      {showSummary && (
        <>
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Statistic
                title={t('TXT_TOTAL_COST')}
                value={formatMoney(summaryData.totalCost)}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('TXT_COST_PER_UNIT')}
                value={formatMoney(summaryData.costPerUnit)}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('TXT_YIELD_QUANTITY')}
                value={summaryData.yieldQuantity}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('TXT_INGREDIENTS')}
                value={summaryData.ingredientCount}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
          <Divider />
        </>
      )}

      {costData.costBreakdown && costData.costBreakdown.length > 0 ? (
        <Table
          columns={columns}
          dataSource={costData.costBreakdown}
          rowKey="ingredientId"
          pagination={false}
          size="small"
          summary={(pageData) => {
            const totalCost = pageData.reduce((sum, record) => sum + parseFloat(record.totalCost), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>{t('TXT_TOTAL')}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2} />
                <Table.Summary.Cell index={3}>
                  <Text strong className="text-green-600">
                    {totalCost.toLocaleString()} VND
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      ) : (
        <div className="text-center text-gray-500 py-4">
          {t('MSG_NO_INGREDIENTS_FOUND')}
        </div>
      )}

      {costData.productId && costData.currentSellingPrice && (
        <>
          <Divider />
          <div className="bg-gray-50 p-4 rounded">
            <Title level={5} className="mb-3">
              {t('TXT_PRICING_ANALYSIS')}
            </Title>
            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <Text type="secondary">{t('TXT_CURRENT_COST_PRICE')}</Text>
                  <div className="text-lg font-medium">
                    {parseFloat(costData.currentCostPrice || 0).toLocaleString()} VND
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">{t('TXT_SUGGESTED_COST_PRICE')}</Text>
                  <div className="text-lg font-medium text-blue-600">
                    {parseFloat(costData.suggestedCostPrice || 0).toLocaleString()} VND
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">{t('TXT_PROFIT_MARGIN')}</Text>
                  <div className={`text-lg font-medium ${costData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(costData.profitMargin || 0).toLocaleString()} VND
                  </div>
                </div>
              </Col>
            </Row>
            
            <div className="mt-3">
              <Text type="secondary">{t('TXT_CURRENT_SELLING_PRICE')}: </Text>
              <Text strong className="text-lg">
                {parseFloat(costData.currentSellingPrice).toLocaleString()} VND
              </Text>
              
              {costData.profitMargin < 0 && (
                <Tag color="red" className="ml-2">
                  {t('TXT_LOSS_MAKING')}
                </Tag>
              )}
              {costData.profitMargin === 0 && (
                <Tag color="orange" className="ml-2">
                  {t('TXT_BREAK_EVEN')}
                </Tag>
              )}
              {costData.profitMargin > 0 && (
                <Tag color="green" className="ml-2">
                  {t('TXT_PROFITABLE')}
                </Tag>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default CostBreakdown;
