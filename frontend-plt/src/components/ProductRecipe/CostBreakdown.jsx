import React from 'react';
import { Modal, Table, Descriptions, Card, Typography, Tag, Space } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const CostBreakdown = ({ visible, onCancel, costData }) => {
  const { t } = useTranslation();

  if (!costData) {
    return (
      <Modal
        title={t('TXT_COST_ANALYSIS')}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <Text type="secondary">{t('MSG_NO_COST_DATA_AVAILABLE')}</Text>
      </Modal>
    );
  }

  const ingredientColumns = [
    {
      title: t('TXT_INGREDIENT'),
      dataIndex: ['ingredient', 'name'],
      key: 'ingredient',
    },
    {
      title: t('TXT_AMOUNT_USED'),
      key: 'amount',
      render: (_, record) => `${record.quantity} ${record.unit}`,
    },
    {
      title: t('TXT_UNIT_COST'),
      dataIndex: 'unitCost',
      key: 'unitCost',
      render: (cost) => `${cost?.toLocaleString()} VND`,
    },
    {
      title: t('TXT_TOTAL_COST'),
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost) => `${cost?.toLocaleString()} VND`,
    },
  ];

  const getProfitabilityStatus = () => {
    if (!costData.profitMargin) return { status: 'default', text: t('TXT_NOT_CALCULATED') };
    
    const margin = costData.profitMargin;
    if (margin < 0) return { status: 'error', text: t('TXT_LOSS_MAKING') };
    if (margin === 0) return { status: 'warning', text: t('TXT_BREAK_EVEN') };
    return { status: 'success', text: t('TXT_PROFITABLE') };
  };

  const profitability = getProfitabilityStatus();

  return (
    <Modal
      title={t('TXT_COST_ANALYSIS')}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Cost Summary */}
        <Card title={t('TXT_COST_ANALYSIS')} size="small">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label={t('TXT_TOTAL_COST')}>
              <Text strong>{costData.totalCost?.toLocaleString()} VND</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('TXT_COST_PER_UNIT')}>
              <Text strong>{costData.costPerUnit?.toLocaleString()} VND</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('TXT_YIELD_QUANTITY')}>
              {costData.yield ? `${costData.yield.quantity} ${costData.yield.unit}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('TXT_RECIPE_COST')}>
              {costData.recipeCost?.toLocaleString()} VND
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Pricing Analysis */}
        {costData.currentCostPrice && (
          <Card title={t('TXT_PRICING_ANALYSIS')} size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label={t('TXT_CURRENT_COST_PRICE')}>
                {costData.currentCostPrice?.toLocaleString()} VND
              </Descriptions.Item>
              <Descriptions.Item label={t('TXT_SUGGESTED_COST_PRICE')}>
                {costData.suggestedCostPrice?.toLocaleString()} VND
              </Descriptions.Item>
              <Descriptions.Item label={t('TXT_CURRENT_SELLING_PRICE')}>
                {costData.currentSellingPrice?.toLocaleString()} VND
              </Descriptions.Item>
              <Descriptions.Item label={t('TXT_PROFIT_MARGIN')}>
                <Space>
                  <Text>{costData.profitMargin?.toFixed(2)}%</Text>
                  <Tag color={profitability.status}>{profitability.text}</Tag>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Ingredient Breakdown */}
        <Card title={t('TXT_INGREDIENTS')} size="small">
          <Table
            columns={ingredientColumns}
            dataSource={costData.ingredients || []}
            rowKey={(record) => record.ingredient._id}
            size="small"
            pagination={false}
            summary={(pageData) => {
              const totalCost = pageData.reduce((sum, record) => sum + (record.totalCost || 0), 0);
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>{t('TXT_TOTAL')}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>{totalCost.toLocaleString()} VND</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      </Space>
    </Modal>
  );
};

export default CostBreakdown;
