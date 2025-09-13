import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  ShoppingCartOutlined, 
  PlusOutlined, 
  MinusOutlined, 
  DeleteOutlined,
  ClearOutlined,
  PrinterOutlined,
  DollarOutlined,
  SearchOutlined,
  FilterOutlined,
  FireOutlined
} from "@ant-design/icons";
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Input, 
  Select, 
  Table, 
  InputNumber, 
  Modal, 
  Form, 
  message, 
  Divider,
  Space,
  Typography,
  Badge,
  Avatar,
  Spin,
  Empty
} from "antd";
import { useParams } from "react-router";
import { posAPI } from '@/request/pos.api';
import useOrderContext from '@/hooks/useOrderContext';

const { Title, Text } = Typography;
const { Search } = Input;

const SellManagerPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { storeCode } = useParams();
  const { getOrderContext, isReady, user, storeActive } = useOrderContext();
  
  // Check if user context is ready
  useEffect(() => {
    if (!isReady) {
      message.warning('Vui lòng đăng nhập và chọn cửa hàng để sử dụng tính năng bán hàng');
    }
  }, [isReady]);
  
  // Utility function to parse Decimal128 from MongoDB
  const parseDecimal = (value) => {
    if (!value) return 0;
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return parseFloat(value.toString());
  };

  // Transform product data from server
  const transformProductData = (products) => {
    console.log('🔧 Transforming products:', products);
    
    return products.map(product => {
      // DEBUG: Log each product transformation
      const transformed = {
        ...product,
        // Use posPrice for POS, fallback to retailPrice for backward compatibility
        retailPrice: parseDecimal(product.posPrice || product.retailPrice),
        price: parseDecimal(product.posPrice || product.price),
        costPrice: parseDecimal(product.costPrice),
        // Add POS specific fields - ensure posType is set correctly
        posType: product.posType || (product.isComposite ? 'composite' : 'regular'),
        posDisplayName: product.posDisplayName || product.name,
        posDescription: product.posDescription || product.description,
        // Fix stock calculation - use posStock from backend (standardized)
        stock: product.posStock !== undefined && product.posStock !== null 
          ? product.posStock 
          : (product.stockQuantity !== undefined && product.stockQuantity !== null 
            ? product.stockQuantity 
            : 0), // Use 0 instead of 999 to show actual stock status
        // Ensure unit field exists for regular products
        unit: product.unit || 'phần'
      };
      
      console.log(`🔧 Product "${product.name}": isComposite=${product.isComposite}, posType=${transformed.posType}, stock=${transformed.stock}`);
      
      return transformed;
    });
  };
  
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState('all'); // 'all', 'regular', 'composite'
  
  // Order state
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Khách lẻ',
    phone: '',
    email: ''
  });
  
  // Payment modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'cash',
    cashAmount: 0,
    cardAmount: 0,
    transferAmount: 0
  });

  // Invoice modal
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Load initial data
  useEffect(() => {
    if (storeCode) {
      fetchInitialData();
    }
  }, [storeCode]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching POS data for store:', storeCode);
      const { products, categories, store } = await posAPI.getPOSData(storeCode);
      
      // DEBUG: Log raw data from API
      console.log('🔍 Raw products from API:', products);
      console.log('🔍 Products count:', products?.length);
      console.log('🔍 Categories count:', categories?.length);
      
      if (!products || !Array.isArray(products)) {
        console.warn('⚠️ No products received from API');
        message.warning('Không có sản phẩm nào được tải');
        setProducts([]);
        setCategories(categories || []);
        return;
      }
      
      const transformedProducts = transformProductData(products || []);
      
      // DEBUG: Log transformed data
      console.log('🔍 Transformed products:', transformedProducts);
      console.log('🔍 Product types breakdown:', {
        total: transformedProducts.length,
        regular: transformedProducts.filter(p => p.posType === 'regular').length,
        composite: transformedProducts.filter(p => p.posType === 'composite').length,
        compositeChild: transformedProducts.filter(p => p.posType === 'composite-child').length,
        undefined: transformedProducts.filter(p => !p.posType).length
      });
      
      setProducts(transformedProducts);
      setCategories(categories || []);
      
      // message.success(`Đã tải ${transformedProducts.length} sản phẩm thành công`);
    } catch (error) {
      console.error('❌ Error loading POS data:', error);
      message.error('Lỗi khi tải dữ liệu: ' + (error.message || 'Unknown error'));
      
      // Set empty arrays to prevent undefined errors
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!storeCode) return;
    
    setLoading(true);
    try {
      const response = await posAPI.productAPI.getProductsByStore(storeCode);
      setProducts(transformProductData(response.data || []));
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!storeCode) return;
    
    try {
      const response = await posAPI.categoryAPI.getCategoriesByStore(storeCode);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Lỗi khi tải danh mục');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         (product.productCode && product.productCode.toLowerCase().includes(searchText.toLowerCase()));
    
    // Handle different category structures
    let matchesCategory = selectedCategory === 'all';
    if (!matchesCategory) {
      // Check if product has categories array (populated)
      if (product.categories && Array.isArray(product.categories)) {
        matchesCategory = product.categories.some(cat => 
          typeof cat === 'string' ? cat === selectedCategory : cat._id === selectedCategory
        );
      }
      // Check if product has direct category field
      else if (product.category) {
        matchesCategory = product.category === selectedCategory;
      }
    }
    
    // Filter by product type - more lenient approach
    let matchesType = selectedProductType === 'all';
    if (!matchesType) {
      if (selectedProductType === 'composite') {
        matchesType = product.posType === 'composite' || product.posType === 'composite-child' || product.isComposite;
      } else if (selectedProductType === 'regular') {
        matchesType = product.posType === 'regular' || (!product.posType && !product.isComposite);
      }
    }
    
    // DEBUG: Log filtering details for first few products
    if (products.indexOf(product) < 3) {
      console.log(`🔍 Product "${product.name}":`, {
        posType: product.posType,
        isComposite: product.isComposite,
        stock: product.stock,
        matchesSearch,
        matchesCategory,
        matchesType,
        selectedProductType,
        finalResult: matchesSearch && matchesCategory && matchesType
      });
    }
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // DEBUG: Log final filtered results
  console.log('🔍 Filtered products result:', {
    total: filteredProducts.length,
    regular: filteredProducts.filter(p => p.posType === 'regular').length,
    composite: filteredProducts.filter(p => p.posType === 'composite').length,
    compositeChild: filteredProducts.filter(p => p.posType === 'composite-child').length,
    products: filteredProducts.map(p => ({ name: p.name, posType: p.posType }))
  });

  // Cart functions
  const addToCart = (product) => {
    console.log('🛒 Adding product to cart:', product);
    
    // Check if product has required fields
    if (!product || !product._id || !product.name) {
      console.error('❌ Invalid product data:', product);
      message.error('Sản phẩm không hợp lệ');
      return;
    }
    
    // Check if product price is valid
    const price = product.retailPrice || product.price || 0;
    if (price <= 0) {
      console.error('❌ Invalid product price:', price);
      message.error('Giá sản phẩm không hợp lệ');
      return;
    }
    
    // Warn if adding out-of-stock product
    if (product.stock <= 0) {
      console.warn('⚠️ Adding out-of-stock product:', product.name);
      message.warning(`⚠️ Sản phẩm "${product.posDisplayName || product.name}" hiện hết hàng!`);
    }
    
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
      console.log('📝 Updating existing item quantity');
      updateCartQuantity(product._id, existingItem.quantity + 1);
    } else {
      const cartItem = {
        productId: product._id,
        productName: product.posDisplayName || product.name,
        productCode: product.productCode || '',
        unitPrice: price,
        quantity: 1,
        unit: product.unit || 'phần',
        totalPrice: price
      };
      
      console.log('➕ Adding new cart item:', cartItem);
      setCart([...cart, cartItem]);
      message.success(`Đã thêm "${cartItem.productName}" vào giỏ hàng`);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxRate = 0; // 0% tax for now
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Handle payment
  const handlePayment = () => {
    if (cart.length === 0) {
      message.warning('Giỏ hàng trống');
      return;
    }
    
    if (!isReady) {
      message.warning('Vui lòng đăng nhập và chọn cửa hàng để tiếp tục');
      return;
    }
    
    setPaymentDetails({
      method: 'cash',
      cashAmount: total,
      cardAmount: 0,
      transferAmount: 0
    });
    setPaymentModalVisible(true);
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      
      // Get real user and store context
      const orderContext = getOrderContext();
      
      // Create order object with real data
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        items: cart,
        taxRate,
        discountRate: 0,
        paymentMethod: paymentDetails.method,
        paymentDetails,
        employeeId: orderContext.employeeId,
        storeId: orderContext.storeId,
        storeCode: orderContext.storeCode,
        // notes: `Đơn hàng tạo bởi ${orderContext.employeeName} tại ${orderContext.storeName}`
      };

      // Use POS API to process sale
      const response = await posAPI.processSale(orderData);
      const order = response.data;

      setCurrentOrder(order);
      setPaymentModalVisible(false);
      setInvoiceModalVisible(true);
      clearCart();
      
      message.success('Thanh toán thành công!');
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Lỗi khi xử lý thanh toán';
      if (error.message) {
        if (error.message.includes('authenticated')) {
          errorMessage = 'Vui lòng đăng nhập lại để tiếp tục';
        } else if (error.message.includes('Store')) {
          errorMessage = 'Vui lòng chọn cửa hàng để tiếp tục';
        } else {
          errorMessage = error.message;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Print invoice
  const printInvoice = () => {
    window.print();
  };

  return (
    <div style={{ padding: 24, height: '100vh', overflow: 'hidden' }}>
      <Row gutter={16} style={{ height: 'calc(100vh - 120px)' }}>
        {/* Products Section */}
        <Col span={16}>
          <Card 
            title="Danh sách sản phẩm" 
            style={{ height: '100%' }}
          >
            {/* Search and Filter */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Search
                  placeholder="Tìm kiếm sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn danh mục"
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  suffixIcon={<FilterOutlined />}
                >
                  <Select.Option value="all">Tất cả danh mục</Select.Option>
                  {categories.map(cat => (
                    <Select.Option key={cat._id} value={cat._id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Loại sản phẩm"
                  value={selectedProductType}
                  onChange={setSelectedProductType}
                >
                  <Select.Option value="all">Tất cả loại</Select.Option>
                  <Select.Option value="composite">🍽️ Sản phẩm tổng hợp</Select.Option>
                  <Select.Option value="regular">📦 Sản phẩm thường</Select.Option>
                </Select>
              </Col>
              <Col span={6}>
                <Button 
                  onClick={() => {
                    // console.log('🔍 DEBUG - Current state:', {
                    //   productsCount: products.length,
                    //   filteredCount: filteredProducts.length,
                    //   selectedProductType,
                    //   storeCode,
                    //   loading,
                    //   products: products.map(p => ({ 
                    //     name: p.name, 
                    //     posType: p.posType, 
                    //     isComposite: p.isComposite,
                    //     imageUrl: p.imageUrl,
                    //     imageUrlLength: p.imageUrl ? p.imageUrl.length : 'N/A',
                    //     imageUrlValid: p.imageUrl && p.imageUrl !== '',
                    //     compositeProductName: p.compositeProductName,
                    //     stock: p.stock,
                    //     retailPrice: p.retailPrice
                    //   }))
                    // });

                    console.log(products);
                    
                  }}
                  type="dashed"
                >
                  Debug Info
                </Button>
              </Col>
            </Row>
            
            {/* Reload button if no products */}
            {products.length === 0 && !loading && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24} style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    onClick={fetchInitialData}
                    loading={loading}
                    icon={<SearchOutlined />}
                  >
                    Tải lại danh sách sản phẩm
                  </Button>
                </Col>
              </Row>
            )}

            {/* Products Grid */}
            <div style={{ 
              height: 'calc(100% - 80px)', 
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16
            }}>
              {loading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
                  <Empty description="Không tìm thấy sản phẩm" />
                </div>
              ) : (
                filteredProducts.map(product => (
                  <Card
                    key={product._id}
                    hoverable
                    size="small"
                    cover={
                      <div style={{ 
                        height: 120, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: (product.posType === 'composite' || product.posType === 'composite-child') ? '#f0f9ff' : '#f5f5f5',
                        position: 'relative'
                      }}>
                        <Avatar 
                          size={80} 
                          src={product.imageUrl && product.imageUrl !== '' ? product.imageUrl : undefined} 
                          icon={(product.posType === 'composite' || product.posType === 'composite-child') ? <FireOutlined /> : <ShoppingCartOutlined />}
                          style={{
                            backgroundColor: (product.imageUrl && product.imageUrl !== '') ? 'transparent' : undefined
                          }}
                          onError={(e) => {
                            console.log(`❌ Image failed to load for ${product.name}:`, product.imageUrl);
                            return false; // This will show the fallback icon
                          }}
                        />
                      </div>
                    }
                    actions={[
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => addToCart(product)}
                        disabled={false} // Allow adding even with low stock for demo purposes
                        style={{
                          backgroundColor: (product.posType === 'composite' || product.posType === 'composite-child') ? '#1890ff' : undefined
                        }}
                      >
                        {product.stock <= 0 ? 'Thêm (Hết hàng)' : 'Thêm'}
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div>
                          <Text strong style={{ fontSize: 14 }}>{product.posDisplayName}</Text>
                          {(product.posType === 'composite' || product.posType === 'composite-child') && (
                            <div style={{ fontSize: '10px', color: '#1890ff', marginTop: '2px' }}>
                              {product.posType === 'composite-child' ? 
                                `🍽️ Từ combo "${product.compositeProductName}"` : 
                                '🍽️ Sản phẩm tổng hợp'
                              }
                            </div>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {product.productCode}
                          </Text>
                          <br />
                          {product.posDescription && (
                            <Text type="secondary" style={{ fontSize: '10px' }}>
                              {product.posDescription}
                            </Text>
                          )}
                          <br />
                          <Text strong style={{ 
                            color: (product.posType === 'composite' || product.posType === 'composite-child') ? '#1890ff' : '#52c41a', 
                            fontSize: 16 
                          }}>
                            {product.retailPrice.toLocaleString('vi-VN')}đ
                            {product.posType === 'regular' && `/${product.unit}`}
                            {product.posType === 'composite-child' && ` (combo)`}
                          </Text>
                          <br />
                          <Badge 
                            count={product.stock} 
                            style={{ 
                              backgroundColor: product.stock > 10 ? '#52c41a' : (product.stock > 0 ? '#faad14' : '#f5222d')
                            }}
                            title={`Tồn kho: ${product.stock} ${product.unit}`}
                          />
                          {product.stock <= 0 && (
                            <div style={{ color: '#f5222d', fontSize: '10px', marginTop: '2px' }}>
                              ⚠️ Hết hàng
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                ))
              )}
            </div>
          </Card>
        </Col>

        {/* Cart Section */}
        <Col span={8}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Giỏ hàng ({cart.length})</span>
                <Button 
                  icon={<ClearOutlined />} 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Xóa tất cả
                </Button>
              </div>
            }
            style={{ height: '100%' }}
          >
            {/* Customer Info */}
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Input
                placeholder="Tên khách hàng"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                style={{ marginBottom: 8 }}
              />
              <Input
                placeholder="Số điện thoại"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              />
            </div>

            {/* Cart Items */}
            <div style={{ height: 300, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Empty description="Giỏ hàng trống" />
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Text strong>{item.productName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.unitPrice.toLocaleString('vi-VN')}đ/{item.unit}
                        </Text>
                      </div>
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeFromCart(item.productId)}
                        danger
                        size="small"
                      />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Space>
                        <Button 
                          icon={<MinusOutlined />} 
                          size="small"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        />
                        <InputNumber
                          size="small"
                          min={1}
                          value={item.quantity}
                          onChange={(value) => updateCartQuantity(item.productId, value)}
                          style={{ width: 60 }}
                        />
                        <Button 
                          icon={<PlusOutlined />} 
                          size="small"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        />
                      </Space>
                      <Text strong style={{ color: '#1890ff' }}>
                        {item.totalPrice.toLocaleString('vi-VN')}đ
                      </Text>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals and Checkout */}
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Tạm tính:</Text>
                  <Text>{subtotal.toLocaleString('vi-VN')}đ</Text>
                </div>
                {taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text>Thuế ({taxRate}%):</Text>
                    <Text>{taxAmount.toLocaleString('vi-VN')}đ</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Tổng cộng:</Text>
                  <Text strong style={{ fontSize: 18, color: '#f5222d' }}>
                    {total.toLocaleString('vi-VN')}đ
                  </Text>
                </div>
              </div>
              
              <Button 
                type="primary" 
                size="large" 
                block
                icon={<DollarOutlined />}
                onClick={handlePayment}
                disabled={cart.length === 0}
                loading={loading}
              >
                Thanh toán
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Thanh toán"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={processPayment} loading={loading}>
            Xác nhận thanh toán
          </Button>
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                  Tổng tiền: {total.toLocaleString('vi-VN')}đ
                </Title>
              </div>
            </Col>
          </Row>
          
          <Form.Item label="Phương thức thanh toán">
            <Select
              value={paymentDetails.method}
              onChange={(value) => setPaymentDetails({ ...paymentDetails, method: value })}
            >
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="card">Thẻ</Select.Option>
              <Select.Option value="transfer">Chuyển khoản</Select.Option>
              <Select.Option value="mixed">Kết hợp</Select.Option>
            </Select>
          </Form.Item>

          {paymentDetails.method === 'cash' && (
            <Form.Item label="Số tiền nhận">
              <InputNumber
                style={{ width: '100%' }}
                value={paymentDetails.cashAmount}
                onChange={(value) => setPaymentDetails({ ...paymentDetails, cashAmount: value })}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                addonAfter="đ"
              />
              {paymentDetails.cashAmount > total && (
                <Text type="success">
                  Tiền thối: {(paymentDetails.cashAmount - total).toLocaleString('vi-VN')}đ
                </Text>
              )}
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        title="Hóa đơn bán hàng"
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={printInvoice}>
            In hóa đơn
          </Button>,
          <Button key="close" type="primary" onClick={() => setInvoiceModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {currentOrder && (
          <div id="invoice-content" style={{ padding: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3}>HÓA ĐƠN BÁN HÀNG</Title>
              <Text strong>Số HĐ: {currentOrder.orderNumber}</Text>
              <br />
              <Text type="secondary">
                Ngày: {new Date(currentOrder.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Khách hàng: </Text>
              <Text>{currentOrder.customerName}</Text>
              {currentOrder.customerPhone && (
                <>
                  <br />
                  <Text strong>SĐT: </Text>
                  <Text>{currentOrder.customerPhone}</Text>
                </>
              )}
            </div>

            <Table
              dataSource={currentOrder.items}
              pagination={false}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Table.Column title="Sản phẩm" dataIndex="productName" />
              <Table.Column title="SL" dataIndex="quantity" align="center" />
              <Table.Column 
                title="Đơn giá" 
                dataIndex="unitPrice"
                align="right"
                render={(value) => `${parseFloat(value?.toString() || value || 0).toLocaleString('vi-VN')}đ`}
              />
              <Table.Column 
                title="Thành tiền" 
                dataIndex="totalPrice"
                align="right"
                render={(value) => `${parseFloat(value?.toString() || value || 0).toLocaleString('vi-VN')}đ`}
              />
            </Table>

            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 8 }}>
                <Text>Tạm tính: {parseFloat(currentOrder.subtotal?.toString() || currentOrder.subtotal || 0).toLocaleString('vi-VN')}đ</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>
                  Tổng cộng: {parseFloat(currentOrder.totalAmount?.toString() || currentOrder.totalAmount || 0).toLocaleString('vi-VN')}đ
                </Text>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Text type="secondary">Cảm ơn quý khách!</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SellManagerPage;