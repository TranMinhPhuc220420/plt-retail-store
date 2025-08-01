# Frontend Component Integration Guide

## Overview

This guide explains how to integrate the newly created ingredient inventory management components with your existing ingredient management system.

## Component Structure

```
src/
├── store/
│   ├── ingredientInventory.js         # New: Inventory operations store
│   ├── ingredient.js                  # Enhanced: Added inventory operations
│   └── supplier.js                    # New: Supplier management store
├── request/
│   └── ingredientInventory.js         # New: Inventory API requests
├── components/
│   └── inventory/
│       ├── IngredientStockInModal.jsx           # New: Stock in operations
│       ├── IngredientStockOutModal.jsx          # New: Stock out operations
│       ├── IngredientStockTakeModal.jsx         # New: Stock take operations
│       └── IngredientTransactionHistoryModal.jsx # New: Transaction history
└── pages/
    └── admin/
        └── ingredient/
            ├── InventoryManagement.jsx  # New: Inventory dashboard
            └── index.jsx                # Enhanced: Ingredient CRUD with inventory
```

## Integration with Existing IngredientManagement.jsx

To integrate the new inventory management components with your existing ingredient management page, you can add inventory operation buttons and modals. Here's how:

### 1. Import the New Components

```jsx
import IngredientStockInModal from '../../../components/inventory/IngredientStockInModal';
import IngredientStockOutModal from '../../../components/inventory/IngredientStockOutModal';
import IngredientStockTakeModal from '../../../components/inventory/IngredientStockTakeModal';
import IngredientTransactionHistoryModal from '../../../components/inventory/IngredientTransactionHistoryModal';
import { useIngredientInventoryStore } from '../../../store/ingredientInventory';
```

### 2. Add State for Modals

```jsx
const [stockInModalVisible, setStockInModalVisible] = useState(false);
const [stockOutModalVisible, setStockOutModalVisible] = useState(false);
const [stockTakeModalVisible, setStockTakeModalVisible] = useState(false);
const [transactionHistoryModalVisible, setTransactionHistoryModalVisible] = useState(false);
const [selectedIngredient, setSelectedIngredient] = useState(null);
```

### 3. Add Inventory Action Buttons

Add these buttons to your ingredient table actions:

```jsx
const columns = [
  // ... your existing columns
  {
    title: 'Stock Level',
    dataIndex: 'stockLevel',
    key: 'stockLevel',
    render: (stockLevel, record) => (
      <Tag color={stockLevel > record.minStockLevel ? 'green' : 'red'}>
        {stockLevel} {record.unit}
      </Tag>
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        {/* Your existing action buttons */}
        <Button
          size="small"
          onClick={() => handleStockIn(record)}
          icon={<PlusOutlined />}
        >
          Stock In
        </Button>
        <Button
          size="small"
          onClick={() => handleStockOut(record)}
          icon={<MinusOutlined />}
        >
          Stock Out
        </Button>
        <Button
          size="small"
          onClick={() => handleStockTake(record)}
          icon={<AuditOutlined />}
        >
          Stock Take
        </Button>
        <Button
          size="small"
          onClick={() => handleTransactionHistory(record)}
          icon={<HistoryOutlined />}
        >
          History
        </Button>
      </Space>
    ),
  },
];
```

### 4. Add Modal Handlers

```jsx
const handleStockIn = (ingredient) => {
  setSelectedIngredient(ingredient);
  setStockInModalVisible(true);
};

const handleStockOut = (ingredient) => {
  setSelectedIngredient(ingredient);
  setStockOutModalVisible(true);
};

const handleStockTake = (ingredient) => {
  setSelectedIngredient(ingredient);
  setStockTakeModalVisible(true);
};

const handleTransactionHistory = (ingredient) => {
  setSelectedIngredient(ingredient);
  setTransactionHistoryModalVisible(true);
};
```

### 5. Add Modal Components to JSX

Add these modals at the end of your component's JSX:

```jsx
return (
  <div>
    {/* Your existing JSX */}
    
    {/* Inventory Management Modals */}
    <IngredientStockInModal
      visible={stockInModalVisible}
      onCancel={() => setStockInModalVisible(false)}
      ingredient={selectedIngredient}
      onSuccess={() => {
        setStockInModalVisible(false);
        // Refresh your ingredient list
        fetchIngredients();
      }}
    />
    
    <IngredientStockOutModal
      visible={stockOutModalVisible}
      onCancel={() => setStockOutModalVisible(false)}
      ingredient={selectedIngredient}
      onSuccess={() => {
        setStockOutModalVisible(false);
        // Refresh your ingredient list
        fetchIngredients();
      }}
    />
    
    <IngredientStockTakeModal
      visible={stockTakeModalVisible}
      onCancel={() => setStockTakeModalVisible(false)}
      ingredient={selectedIngredient}
      onSuccess={() => {
        setStockTakeModalVisible(false);
        // Refresh your ingredient list
        fetchIngredients();
      }}
    />
    
    <IngredientTransactionHistoryModal
      visible={transactionHistoryModalVisible}
      onCancel={() => setTransactionHistoryModalVisible(false)}
      ingredient={selectedIngredient}
    />
  </div>
);
```

## Navigation Integration

### Add to Your Routes

```jsx
// In your routes configuration
import InventoryManagement from '../pages/admin/ingredient/InventoryManagement';

const routes = [
  {
    path: '/admin/ingredients',
    component: IngredientManagement,
  },
  {
    path: '/admin/ingredient-inventory',
    component: InventoryManagement,
  },
];
```

### Add to Navigation Menu

```jsx
// In your navigation component
{
  key: 'ingredient-management',
  icon: <AppstoreOutlined />,
  label: 'Ingredient Management',
  children: [
    {
      key: 'ingredients',
      label: 'Ingredients',
      path: '/admin/ingredients',
    },
    {
      key: 'ingredient-inventory',
      label: 'Inventory Management',
      path: '/admin/ingredient-inventory',
    },
  ],
}
```

## Dashboard Cards Integration

Add inventory summary cards to your main dashboard:

```jsx
import { useIngredientInventoryStore } from '../../../store/ingredientInventory';

const IngredientDashboard = () => {
  const { lowStockItems, expiringItems, totalStockValue } = useIngredientInventoryStore();
  
  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card>
          <Statistic
            title="Low Stock Items"
            value={lowStockItems.length}
            valueStyle={{ color: '#cf1322' }}
            prefix={<AlertOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Expiring Soon"
            value={expiringItems.length}
            valueStyle={{ color: '#fa8c16' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic
            title="Total Stock Value"
            value={totalStockValue}
            precision={2}
            prefix="$"
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
```

## API Integration

Make sure your existing ingredient fetching includes stock levels:

```jsx
// In your ingredient fetching function
const fetchIngredients = async () => {
  try {
    const response = await ingredientAPI.getIngredientsWithStock(storeCode);
    setIngredients(response.data);
  } catch (error) {
    message.error('Failed to fetch ingredients');
  }
};
```

## Real-time Updates

To keep stock levels updated in real-time:

```jsx
import { useEffect } from 'react';
import { useIngredientInventoryStore } from '../../../store/ingredientInventory';

const YourComponent = () => {
  const { fetchStockBalances } = useIngredientInventoryStore();
  
  useEffect(() => {
    // Fetch initial stock balances
    fetchStockBalances();
    
    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      fetchStockBalances();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
};
```

## Conclusion

The new inventory management components are designed to seamlessly integrate with your existing ingredient management system. They provide:

1. **Modal-based Operations** - Non-intrusive inventory operations
2. **Real-time Updates** - Immediate reflection of inventory changes
3. **Comprehensive Tracking** - Full audit trail for all operations
4. **User-friendly Interface** - Consistent with existing UI patterns
5. **Error Handling** - Robust error management and user feedback

Follow this integration guide to add comprehensive inventory management capabilities to your existing ingredient management system.
