// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router';

// import { 
//   Card, 
//   Table, 
//   Button, 
//   Space, 
//   Tag, 
//   Tabs, 
//   Modal, 
//   message, 
//   Row, 
//   Col, 
//   Statistic,
//   Tooltip,
//   Typography,
//   Popconfirm,
//   Divider,
//   Alert
// } from 'antd';
// import { 
//   LinkOutlined, 
//   DisconnectOutlined, 
//   CalculatorOutlined, 
//   EyeOutlined,
//   StarOutlined,
//   StarFilled,
//   ShoppingCartOutlined,
//   BookOutlined
// } from '@ant-design/icons';
// import { useTranslation } from 'react-i18next';
// import useProductRecipeStore from '../store/productRecipe';
// import useStoreProduct from '../store/product';
// import useRecipeStore from '../store/recipe';
// import RecipeSelector from '../components/ProductRecipe/RecipeSelector';
// import ProductSelector from '../components/ProductRecipe/ProductSelector';
// import CostBreakdown from '../components/ProductRecipe/CostBreakdown';

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;

// const ProductRecipeManagement = () => {
//   const { storeCode } = useParams();

//   const { t } = useTranslation();
  
//   // Product store
//   const { 
//     products, 
//     isLoading: productLoading, 
//     fetchProducts 
//   } = useStoreProduct();
  
//   // Recipe store
//   const { 
//     recipes, 
//     isLoading: recipeLoading, 
//     fetchRecipes 
//   } = useRecipeStore();
  
//   // Product-Recipe relationship store
//   const {
//     isLoading: relationshipLoading,
//     linkRecipe,
//     unlinkRecipe,
//     setDefaultRecipe,
//     linkProduct,
//     unlinkProduct,
//     fetchProductWithRecipes,
//     productWithRecipes,
//     recipeWithProducts
//   } = useProductRecipeStore();

//   const [activeTab, setActiveTab] = useState('products');
//   const [recipeSelectorVisible, setRecipeSelectorVisible] = useState(false);
//   const [productSelectorVisible, setProductSelectorVisible] = useState(false);
//   const [costBreakdownVisible, setCostBreakdownVisible] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [selectedRecipe, setSelectedRecipe] = useState(null);
//   const [selectedCostData, setSelectedCostData] = useState(null);

//   const loading = productLoading || recipeLoading || relationshipLoading;

//   useEffect(() => {
//     // Load products and recipes
//     fetchProducts(storeCode);
//     fetchRecipes();
//   }, [fetchProducts, fetchRecipes]);

//   const refreshData = () => {
//     fetchProducts(storeCode);
//     fetchRecipes();
//   };

//   const handleLinkRecipe = async (productId, recipeIds, setAsDefault = false) => {
//     try {
//       // Link each recipe to the product
//       for (const recipeId of recipeIds) {
//         await linkRecipe(productId, recipeId, { setAsDefault: setAsDefault && recipeIds.length === 1 });
//       }
//       message.success(t('MSG_LINK_SUCCESS'));
//       setRecipeSelectorVisible(false);
//       setSelectedProduct(null);
//       // Refresh the product data to show updated relationships
//       refreshData();
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_LINK_RECIPE'));
//     }
//   };

//   const handleUnlinkRecipe = async (productId, recipeId) => {
//     try {
//       await unlinkRecipe(productId, recipeId);
//       message.success(t('MSG_LINK_SUCCESS'));
//       // Refresh the product data to show updated relationships
//       refreshData();
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_UNLINK_RECIPE'));
//     }
//   };

//   const handleSetDefaultRecipe = async (productId, recipeId) => {
//     try {
//       await setDefaultRecipe(productId, recipeId);
//       message.success(t('MSG_LINK_SUCCESS'));
//       // Refresh the product data to show updated relationships
//       refreshData();
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_SET_DEFAULT_RECIPE'));
//     }
//   };

//   const handleLinkProduct = async (recipeId, productIds) => {
//     try {
//       // Link each product to the recipe
//       for (const productId of productIds) {
//         await linkProduct(recipeId, productId);
//       }
//       message.success(t('MSG_LINK_SUCCESS'));
//       setProductSelectorVisible(false);
//       setSelectedRecipe(null);
//       // Refresh the data to show updated relationships
//       refreshData();
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_LINK_PRODUCT'));
//     }
//   };

//   const handleUnlinkProduct = async (recipeId, productId) => {
//     try {
//       await unlinkProduct(recipeId, productId);
//       message.success(t('MSG_LINK_SUCCESS'));
//       // Refresh the data to show updated relationships
//       refreshData();
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_UNLINK_PRODUCT'));
//     }
//   };

//   const handleCalculateCost = async (productId, recipeId) => {
//     try {
//       // TODO: Add calculate cost method
//       message.success(t('MSG_LINK_SUCCESS'));
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_CALCULATE_COST'));
//     }
//   };

//   const handleViewCostBreakdown = async (productId, recipeId) => {
//     try {
//       // TODO: Add cost breakdown method
//       const breakdown = {}; // Placeholder
//       setSelectedCostData(breakdown);
//       setCostBreakdownVisible(true);
//     } catch (error) {
//       message.error(t('MSG_FAILED_TO_GET_COST_BREAKDOWN'));
//     }
//   };

//   const productColumns = [
//     {
//       title: t('TXT_PRODUCT_NAME'),
//       dataIndex: 'name',
//       key: 'name',
//       width: 200,
//     },
//     {
//       title: t('TXT_CATEGORY'),
//       dataIndex: ['productCategory', 'name'],
//       key: 'category',
//       width: 150,
//     },
//     {
//       title: t('TXT_COST_PRICE'),
//       dataIndex: 'costPrice',
//       key: 'costPrice',
//       width: 120,
//       render: (price) => price ? `${price.toLocaleString()} VND` : '-',
//     },
//     {
//       title: t('TXT_SELLING_PRICE'),
//       dataIndex: 'sellingPrice',
//       key: 'sellingPrice',
//       width: 120,
//       render: (price) => price ? `${price.toLocaleString()} VND` : '-',
//     },
//     {
//       title: t('TXT_LINKED_RECIPES'),
//       key: 'linkedRecipes',
//       width: 200,
//       render: (_, record) => {
//         const recipeCount = record.recipes?.length || 0;
//         const hasDefault = record.defaultRecipeId;
        
//         return (
//           <Space>
//             <Tag color={recipeCount > 0 ? 'blue' : 'default'}>
//               {recipeCount} {t('TXT_RECIPES')}
//             </Tag>
//             {hasDefault && (
//               <Tag color="gold" icon={<StarFilled />}>
//                 {t('TXT_HAS_DEFAULT')}
//               </Tag>
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       key: 'action',
//       width: 200,
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Button
//             type="primary"
//             size="small"
//             icon={<LinkOutlined />}
//             onClick={() => {
//               setSelectedProduct(record);
//               setRecipeSelectorVisible(true);
//             }}
//           >
//             {t('TXT_LINK_RECIPE')}
//           </Button>
          
//           {record.recipes?.map(recipe => (
//             <Space key={recipe._id} wrap>
//               <Tooltip title={recipe.dishName || recipe.name}>
//                 <Tag
//                   color="blue"
//                   closable
//                   onClose={() => handleUnlinkRecipe(record._id, recipe._id)}
//                 >
//                   {recipe.dishName || recipe.name}
//                 </Tag>
//               </Tooltip>
              
//               {record.defaultRecipeId?._id !== recipe._id && (
//                 <Button
//                   size="small"
//                   type="text"
//                   icon={<StarOutlined />}
//                   onClick={() => handleSetDefaultRecipe(record._id, recipe._id)}
//                   title={t('TXT_SET_DEFAULT_RECIPE')}
//                 />
//               )}
              
//               <Button
//                 size="small"
//                 type="text"
//                 icon={<CalculatorOutlined />}
//                 onClick={() => handleCalculateCost(record._id, recipe._id)}
//                 title={t('TXT_CALCULATE_COST')}
//               />
              
//               <Button
//                 size="small"
//                 type="text"
//                 icon={<EyeOutlined />}
//                 onClick={() => handleViewCostBreakdown(record._id, recipe._id)}
//                 title={t('TXT_VIEW_DETAILS')}
//               />
//             </Space>
//           ))}
//         </Space>
//       ),
//     },
//   ];

//   const recipeColumns = [
//     {
//       title: t('TXT_RECIPE_NAME'),
//       dataIndex: 'name',
//       key: 'name',
//       width: 200,
//     },
//     {
//       title: t('TXT_DESCRIPTION'),
//       dataIndex: 'description',
//       key: 'description',
//       width: 250,
//       ellipsis: true,
//     },
//     {
//       title: t('TXT_YIELD_QUANTITY'),
//       key: 'yield',
//       width: 150,
//       render: (_, record) => {
//         if (record.yield) {
//           return `${record.yield.quantity} ${record.yield.unit}`;
//         }
//         return '-';
//       },
//     },
//     {
//       title: t('TXT_RECIPE_COST'),
//       dataIndex: 'costPerUnit',
//       key: 'costPerUnit',
//       width: 120,
//       render: (cost) => {
//         if (cost && cost.$numberDecimal) {
//           return `${parseFloat(cost.$numberDecimal).toLocaleString()} VND`;
//         }
//         return t('TXT_NOT_CALCULATED');
//       },
//     },
//     {
//       title: t('TXT_LINKED_PRODUCTS'),
//       key: 'linkedProducts',
//       width: 200,
//       render: (_, record) => {
//         const productCount = record.products?.length || 0;
        
//         return (
//           <Tag color={productCount > 0 ? 'green' : 'default'}>
//             {productCount} {t('TXT_PRODUCTS')}
//           </Tag>
//         );
//       },
//     },
//     {
//       title: t('TXT_ACTION'),
//       key: 'action',
//       width: 250,
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Button
//             type="primary"
//             size="small"
//             icon={<LinkOutlined />}
//             onClick={() => {
//               setSelectedRecipe(record);
//               setProductSelectorVisible(true);
//             }}
//           >
//             {t('TXT_LINK_PRODUCT')}
//           </Button>
          
//           {record.products?.map(product => (
//             <Tooltip key={product._id} title={product.name}>
//               <Tag
//                 color="green"
//                 closable
//                 onClose={() => handleUnlinkProduct(record._id, product._id)}
//               >
//                 {product.name}
//               </Tag>
//             </Tooltip>
//           ))}
//         </Space>
//       ),
//     },
//   ];

//   const getProductStats = () => {
//     const totalProducts = products.length;
//     const productsWithRecipes = products.filter(
//       product => product.recipes && product.recipes.length > 0
//     ).length;
//     const productsWithDefault = products.filter(
//       product => product.defaultRecipeId
//     ).length;

//     return { totalProducts, productsWithRecipes, productsWithDefault };
//   };

//   const getRecipeStats = () => {
//     const totalRecipes = recipes.length;
//     const recipesWithProducts = recipes.filter(
//       recipe => recipe.products && recipe.products.length > 0
//     ).length;

//     return { totalRecipes, recipesWithProducts };
//   };

//   const { totalProducts, productsWithRecipes, productsWithDefault } = getProductStats();
//   const { totalRecipes, recipesWithProducts } = getRecipeStats();

//   return (
//     <div style={{ padding: '24px' }}>
//       <Title level={2}>
//         <BookOutlined /> {t('TXT_PRODUCT_RECIPE_MANAGEMENT')}
//       </Title>
//       <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
//         {t('TXT_MANAGE_RELATIONSHIPS_BETWEEN_PRODUCTS_AND_RECIPES')}
//       </Text>

//       <Row gutter={16} style={{ marginBottom: '24px' }}>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title={t('TXT_PRODUCTS')}
//               value={totalProducts}
//               prefix={<ShoppingCartOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title={t('TXT_PRODUCTS_WITH_RECIPES')}
//               value={productsWithRecipes}
//               valueStyle={{ color: '#3f8600' }}
//               prefix={<LinkOutlined />}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title={t('TXT_DEFAULT_RECIPES_SET')}
//               value={productsWithDefault}
//               valueStyle={{ color: '#cf1322' }}
//               prefix={<StarFilled />}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title={t('TXT_RECIPES_WITH_PRODUCTS')}
//               value={recipesWithProducts}
//               valueStyle={{ color: '#722ed1' }}
//               prefix={<BookOutlined />}
//             />
//           </Card>
//         </Col>
//       </Row>

//       <Card>
//         <Tabs 
//           activeKey={activeTab} 
//           onChange={setActiveTab}
//           items={[
//             {
//               key: 'products',
//               label: (
//                 <span>
//                   <ShoppingCartOutlined />
//                   {t('TXT_PRODUCTS_VIEW')}
//                 </span>
//               ),
//               children: (
//                 <Table
//                   columns={productColumns}
//                   dataSource={products}
//                   rowKey="_id"
//                   loading={loading}
//                   scroll={{ x: 1200 }}
//                   pagination={{
//                     showSizeChanger: true,
//                     showQuickJumper: true,
//                     showTotal: (total, range) =>
//                       `${range[0]}-${range[1]} of ${total} items`,
//                   }}
//                 />
//               ),
//             },
//             {
//               key: 'recipes',
//               label: (
//                 <span>
//                   <BookOutlined />
//                   {t('TXT_RECIPES_VIEW')}
//                 </span>
//               ),
//               children: (
//                 <Table
//                   columns={recipeColumns}
//                   dataSource={recipes}
//                   rowKey="_id"
//                   loading={loading}
//                   scroll={{ x: 1200 }}
//                   pagination={{
//                     showSizeChanger: true,
//                     showQuickJumper: true,
//                     showTotal: (total, range) =>
//                       `${range[0]}-${range[1]} of ${total} items`,
//                   }}
//                 />
//               ),
//             },
//           ]}
//         />
//       </Card>

//       {/* Recipe Selector Modal */}
//       <RecipeSelector
//         visible={recipeSelectorVisible}
//         onCancel={() => {
//           setRecipeSelectorVisible(false);
//           setSelectedProduct(null);
//         }}
//         onConfirm={handleLinkRecipe}
//         product={selectedProduct}
//         existingRecipeIds={
//           selectedProduct ? 
//           (selectedProduct.recipes?.map(r => r._id) || []) : 
//           []
//         }
//       />

//       {/* Product Selector Modal */}
//       <ProductSelector
//         visible={productSelectorVisible}
//         onCancel={() => {
//           setProductSelectorVisible(false);
//           setSelectedRecipe(null);
//         }}
//         onConfirm={handleLinkProduct}
//         recipe={selectedRecipe}
//         existingProductIds={
//           selectedRecipe ? 
//           (selectedRecipe.products?.map(p => p._id) || []) : 
//           []
//         }
//       />

//       {/* Cost Breakdown Modal */}
//       <CostBreakdown
//         visible={costBreakdownVisible}
//         onCancel={() => {
//           setCostBreakdownVisible(false);
//           setSelectedCostData(null);
//         }}
//         costData={selectedCostData}
//       />
//     </div>
//   );
// };

// export default ProductRecipeManagement;
