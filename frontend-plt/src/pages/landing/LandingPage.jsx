import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Row, Col, Space, Avatar, Timeline, Tabs } from 'antd';
import { 
  ArrowRightOutlined, 
  ShopOutlined, 
  BarChartOutlined, 
  UserOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  RocketOutlined,
  SecurityScanOutlined,
  CloudOutlined,
  MobileOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import ParticlesBackground from '@/components/ParticlesBackground';
import '@/assets/landing.css';

const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: <ShopOutlined className="text-5xl text-blue-600 landing-feature-icon" />,
      title: "Quản lý cửa hàng thông minh",
      description: "Hệ thống quản lý đa cửa hàng với dashboard trực quan, theo dõi doanh thu theo thời gian thực và báo cáo chi tiết"
    },
    {
      icon: <BarChartOutlined className="text-5xl text-green-600 landing-feature-icon" />,
      title: "Phân tích dữ liệu chuyên sâu",
      description: "AI-powered analytics với machine learning để dự đoán xu hướng, tối ưu hóa tồn kho và tăng lợi nhuận"
    },
    {
      icon: <UserOutlined className="text-5xl text-purple-600 landing-feature-icon" />,
      title: "Quản lý nhân viên hiệu quả",
      description: "Hệ thống HR tích hợp với chấm công, quản lý lương, đánh giá hiệu suất và đào tạo nhân viên"
    },
    {
      icon: <SettingOutlined className="text-5xl text-orange-600 landing-feature-icon" />,
      title: "Tự động hóa quy trình",
      description: "Workflow automation, quản lý chuỗi cung ứng, tích hợp thanh toán và đồng bộ đa kênh"
    },
    {
      icon: <SecurityScanOutlined className="text-5xl text-red-600 landing-feature-icon" />,
      title: "Bảo mật dữ liệu tuyệt đối",
      description: "Mã hóa end-to-end, backup tự động, tuân thủ GDPR và các tiêu chuẩn bảo mật quốc tế"
    },
    {
      icon: <CloudOutlined className="text-5xl text-cyan-600 landing-feature-icon" />,
      title: "Cloud Computing",
      description: "Hạ tầng cloud scalable, truy cập mọi lúc mọi nơi với hiệu suất cao và độ tin cậy 99.99%"
    },
    {
      icon: <MobileOutlined className="text-5xl text-pink-600 landing-feature-icon" />,
      title: "Mobile-First Design",
      description: "Ứng dụng mobile native cho iOS/Android, responsive web design và offline capability"
    },
    {
      icon: <GlobalOutlined className="text-5xl text-indigo-600 landing-feature-icon" />,
      title: "Đa ngôn ngữ & Đa tiền tệ",
      description: "Hỗ trợ 25+ ngôn ngữ, 50+ loại tiền tệ với tỷ giá real-time và localization hoàn chỉnh"
    }
  ];

  const testimonials = [
    {
      name: "Nguyễn Văn A",
      position: "CEO, Chuỗi cửa hàng ABC",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "PLT Retail Store đã giúp chúng tôi tăng doanh thu 40% trong 6 tháng đầu. Hệ thống báo cáo thực sự ấn tượng!",
      rating: 5
    },
    {
      name: "Trần Thị B",
      position: "Giám đốc vận hành, Siêu thị XYZ",
      avatar: "https://fchampalimaud.org/sites/default/files/news/rita-fior.jpg",
      content: "Quản lý kho thông minh của PLT đã giúp giảm 60% thời gian kiểm kê và tối ưu hóa tồn kho hiệu quả.",
      rating: 5
    },
    {
      name: "Lê Minh C",
      position: "Chủ cửa hàng thời trang",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "Interface thân thiện, dễ sử dụng. Nhân viên chỉ cần 1 ngày training là có thể thành thạo hệ thống.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "299,000",
      period: "tháng",
      description: "Phù hợp cho cửa hàng nhỏ",
      features: [
        "1 cửa hàng",
        "5 nhân viên",
        "Quản lý sản phẩm cơ bản",
        "Báo cáo doanh thu",
        "Hỗ trợ email"
      ],
      recommended: false
    },
    {
      name: "Professional",
      price: "699,000",
      period: "tháng",
      description: "Dành cho doanh nghiệp vừa",
      features: [
        "5 cửa hàng",
        "50 nhân viên",
        "Quản lý kho thông minh",
        "Analytics nâng cao",
        "API tích hợp",
        "Hỗ trợ 24/7"
      ],
      recommended: true
    },
    {
      name: "Enterprise",
      price: "Liên hệ",
      period: "",
      description: "Giải pháp doanh nghiệp lớn",
      features: [
        "Không giới hạn cửa hàng",
        "Không giới hạn nhân viên",
        "AI & Machine Learning",
        "Custom development",
        "Dedicated support",
        "On-premise deployment"
      ],
      recommended: false
    }
  ];

  const heroSlides = [
    {
      title: "PLT Retail Store",
      subtitle: "Giải pháp quản lý cửa hàng toàn diện",
      description: "Hệ thống quản lý bán lẻ hiện đại, tích hợp đầy đủ chức năng từ quản lý kho đến phân tích doanh thu",
      image: "/images/hero-slide-1.jpg"
    },
    {
      title: "Quản lý thông minh",
      subtitle: "Tối ưu hóa vận hành cửa hàng",
      description: "Theo dõi tồn kho, quản lý nhân viên và phân tích dữ liệu kinh doanh một cách thông minh",
      image: "/images/hero-slide-2.jpg"
    },
    {
      title: "Phát triển bền vững",
      subtitle: "Mở rộng kinh doanh hiệu quả",
      description: "Công cụ hỗ trợ quyết định kinh doanh với báo cáo chi tiết và dự báo xu hướng",
      image: "/images/hero-slide-3.jpg"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    navigate('/dang-nhap');
  };

  const handleViewDemo = () => {
    navigate('/overview');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <img 
                src="https://xaydungphanmem.com/images/app/logo_header-2.png" 
                alt="Retail Store Logo" 
                className="h-12 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Tính năng</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Bảng giá</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Đánh giá</a>
              <Button type="text" onClick={() => navigate('/overview')} className="font-medium">
                Tổng quan
              </Button>
              <Button type="primary" onClick={handleGetStarted} size="large" className="font-semibold">
                Đăng nhập
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <ParticlesBackground />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32" style={{ zIndex: 2 }}>
          <div className="text-center landing-hero">
            <div className="mb-8">
              <Title level={1} className="!text-white !mb-4 !text-5xl md:!text-6xl font-bold landing-hero-title text-reveal">
                <span style={{ animationDelay: '0.1s' }}>{heroSlides[currentSlide].title}</span>
              </Title>
              <Title level={2} className="!text-blue-100 !mb-6 !text-2xl md:!text-3xl landing-hero-subtitle">
                {heroSlides[currentSlide].subtitle}
              </Title>
              <Paragraph className="text-blue-100 text-lg md:text-xl mb-8 max-w-3xl mx-auto">
                {heroSlides[currentSlide].description}
              </Paragraph>
            </div>
            
            <Space size="large" className="flex justify-center flex-wrap">
              <Button 
                type="primary" 
                size="large" 
                onClick={handleGetStarted}
                className="h-12 px-8 text-lg font-semibold bg-white text-blue-600 border-white hover:bg-blue-50 landing-btn-primary glow-effect"
              >
                Bắt đầu ngay <ArrowRightOutlined />
              </Button>
              <Button 
                size="large" 
                onClick={handleViewDemo}
                className="h-12 px-8 text-lg font-semibold text-white border-white hover:bg-white hover:text-blue-600"
              >
                Xem demo
              </Button>
            </Space>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2" style={{ zIndex: 3 }}>
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Title level={2} className="!mb-6 !text-4xl gradient-text">Tính năng vượt trội</Title>
            <Paragraph className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              PLT Retail Store tích hợp AI và công nghệ cloud hiện đại nhất, mang đến trải nghiệm quản lý cửa hàng hoàn toàn mới
            </Paragraph>
          </div>

          <Row gutter={[40, 40]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} lg={8} xl={6} key={index}>
                <Card 
                  className="h-full text-center landing-feature-card feature-card-hover border-0 shadow-lg"
                  bodyStyle={{ padding: '2rem' }}
                >
                  <div className="mb-6">
                    {feature.icon}
                  </div>
                  <Title level={4} className="!mb-4 !text-lg">
                    {feature.title}
                  </Title>
                  <Paragraph className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Title level={2} className="!mb-6 !text-4xl">Cách thức hoạt động</Title>
            <Paragraph className="text-xl text-gray-600 max-w-4xl mx-auto">
              Chỉ với 3 bước đơn giản, bạn đã có thể triển khai hệ thống quản lý hoàn chỉnh
            </Paragraph>
          </div>

          <Row gutter={[48, 48]} className="items-center">
            <Col xs={24} lg={12}>
              <Timeline
                items={[
                  {
                    dot: <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>,
                    children: (
                      <div>
                        <Title level={4} className="!mb-2">Đăng ký và thiết lập</Title>
                        <Paragraph className="text-gray-600">
                          Tạo tài khoản trong 2 phút, import dữ liệu hiện có và cấu hình cửa hàng theo nhu cầu
                        </Paragraph>
                      </div>
                    ),
                  },
                  {
                    dot: <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">2</div>,
                    children: (
                      <div>
                        <Title level={4} className="!mb-2">Đào tạo nhân viên</Title>
                        <Paragraph className="text-gray-600">
                          Nhân viên được đào tạo miễn phí với tài liệu video chi tiết và hỗ trợ trực tuyến
                        </Paragraph>
                      </div>
                    ),
                  },
                  {
                    dot: <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">3</div>,
                    children: (
                      <div>
                        <Title level={4} className="!mb-2">Vận hành và tối ưu</Title>
                        <Paragraph className="text-gray-600">
                          Bắt đầu sử dụng ngay lập tức với AI assistant và continuous optimization
                        </Paragraph>
                      </div>
                    ),
                  },
                ]}
                className="custom-timeline"
              />
            </Col>
            <Col xs={24} lg={12}>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                <img 
                  src="/dashboard.png" 
                  alt="Dashboard Preview" 
                  className="w-full h-80 object-cover rounded-xl shadow-lg"
                />
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Title level={2} className="!mb-6 !text-4xl !text-white">Khách hàng nói gì về chúng tôi</Title>
            <Paragraph className="text-xl text-blue-100 max-w-4xl mx-auto">
              Hơn 10,000 doanh nghiệp đã tin tưởng và đạt được thành công với PLT Retail Store
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {testimonials.map((testimonial, index) => (
              <Col xs={24} md={8} key={index}>
                <Card className="h-full glass-card border-0 text-center">
                  <div className="mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarOutlined key={i} className="text-yellow-400 text-lg" />
                    ))}
                  </div>
                  <Paragraph className="text-gray-700 mb-6 italic text-lg leading-relaxed">
                    "{testimonial.content}"
                  </Paragraph>
                  <div className="flex items-center justify-center space-x-3">
                    <Avatar src={testimonial.avatar} size={48} />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.position}</div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Title level={2} className="!mb-6 !text-4xl gradient-text">Bảng giá linh hoạt</Title>
            <Paragraph className="text-xl text-gray-600 max-w-4xl mx-auto">
              Chọn gói phù hợp với quy mô kinh doanh của bạn. Tất cả gói đều bao gồm bảo mật SSL và backup tự động
            </Paragraph>
          </div>

          <Row gutter={[32, 32]} justify="center">
            {pricingPlans.map((plan, index) => (
              <Col xs={24} md={8} key={index}>
                <Card 
                  className={`h-full text-center relative ${plan.recommended ? 'border-2 border-blue-500 shadow-2xl' : 'border shadow-lg'}`}
                  bodyStyle={{ padding: '2rem' }}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Phổ biến nhất
                      </div>
                    </div>
                  )}
                  
                  <Title level={3} className="!mb-2">{plan.name}</Title>
                  <Paragraph className="text-gray-600 mb-6">{plan.description}</Paragraph>
                  
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                    {plan.period && <span className="text-gray-600 ml-2">₫/{plan.period}</span>}
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircleOutlined className="text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    type={plan.recommended ? "primary" : "default"} 
                    size="large" 
                    block
                    className="font-semibold"
                  >
                    {plan.price === "Liên hệ" ? "Liên hệ tư vấn" : "Bắt đầu dùng thử"}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Title level={2} className="!text-white !mb-4 !text-3xl">Thành tích ấn tượng</Title>
          </div>
          <Row gutter={[32, 32]}>
            <Col xs={12} md={6} className="text-center">
              <div className="text-white">
                <Title level={1} className="!text-white !mb-2 landing-stats-number !text-4xl">10K+</Title>
                <Text className="text-blue-100 text-lg font-medium">Cửa hàng tin dùng</Text>
              </div>
            </Col>
            <Col xs={12} md={6} className="text-center">
              <div className="text-white">
                <Title level={1} className="!text-white !mb-2 landing-stats-number !text-4xl">2.5M+</Title>
                <Text className="text-blue-100 text-lg font-medium">Giao dịch mỗi tháng</Text>
              </div>
            </Col>
            <Col xs={12} md={6} className="text-center">
              <div className="text-white">
                <Title level={1} className="!text-white !mb-2 landing-stats-number !text-4xl">99.99%</Title>
                <Text className="text-blue-100 text-lg font-medium">Thời gian hoạt động</Text>
              </div>
            </Col>
            <Col xs={12} md={6} className="text-center">
              <div className="text-white">
                <Title level={1} className="!text-white !mb-2 landing-stats-number !text-4xl">24/7</Title>
                <Text className="text-blue-100 text-lg font-medium">Hỗ trợ khách hàng</Text>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Title level={2} className="!mb-6 !text-4xl gradient-text">Tại sao chọn PLT Retail Store?</Title>
          </div>

          <Row gutter={[48, 48]} className="items-center">
            <Col xs={24} lg={12}>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                    <TrophyOutlined className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <Title level={4} className="!mb-2">Đã được chứng nhận ISO 27001</Title>
                    <Paragraph className="text-gray-600">
                      Tuân thủ các tiêu chuẩn bảo mật quốc tế cao nhất, đảm bảo dữ liệu khách hàng luôn an toàn
                    </Paragraph>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                    <RocketOutlined className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <Title level={4} className="!mb-2">Triển khai nhanh chóng</Title>
                    <Paragraph className="text-gray-600">
                      Go-live chỉ trong 48 giờ với đội ngũ technical consultant chuyên nghiệp
                    </Paragraph>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
                    <StarOutlined className="text-2xl text-purple-600" />
                  </div>
                  <div>
                    <Title level={4} className="!mb-2">ROI trung bình 300%</Title>
                    <Paragraph className="text-gray-600">
                      Khách hàng trung bình tăng lợi nhuận 300% sau 12 tháng sử dụng PLT Retail Store
                    </Paragraph>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl">
                <img 
                  src="https://cdn.dribbble.com/userupload/16826629/file/original-35a6d04e10e2623f7521c5a5f7f30753.png?resize=1504x1087&vertical=center" 
                  alt="Why Choose Us" 
                  className="w-full h-80 object-cover rounded-xl shadow-lg"
                />
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Title level={2} className="!mb-8 !text-white !text-4xl">
            Sẵn sàng chuyển đổi số cửa hàng của bạn?
          </Title>
          <Paragraph className="text-xl text-blue-100 mb-12 leading-relaxed">
            Tham gia cùng hàng nghìn doanh nghiệp đang sử dụng PLT Retail Store để tối ưu hóa vận hành, 
            tăng doanh thu và mở rộng kinh doanh bền vững
          </Paragraph>
          <Space size="large" className="flex justify-center flex-wrap">
            <Button 
              type="primary" 
              size="large" 
              onClick={handleGetStarted}
              className="h-14 px-10 text-lg font-semibold bg-white text-blue-600 border-white hover:bg-blue-50 shadow-2xl"
            >
              Dùng thử miễn phí 30 ngày <ArrowRightOutlined />
            </Button>
            <Button 
              size="large" 
              onClick={() => window.open('mailto:support@pltretail.com')}
              className="h-14 px-10 text-lg font-semibold text-white border-2 border-white hover:bg-white hover:text-blue-600"
            >
              Đặt lịch demo 1-1
            </Button>
          </Space>
          <div className="mt-8 text-blue-100 text-sm">
            ✅ Không cần thẻ tín dụng • ✅ Thiết lập trong 5 phút • ✅ Hỗ trợ 24/7
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="https://xaydungphanmem.com/images/app/logo_header-2.png" 
                  alt="PLT Retail Store Logo" 
                  className="h-10 w-auto filter brightness-0 invert"
                />
                <span className="text-2xl font-bold text-white">PLT Retail Store</span>
              </div>
              <p className="text-white mb-6 leading-relaxed">
                Nền tảng quản lý cửa hàng bán lẻ hàng đầu Việt Nam với công nghệ AI và cloud computing tiên tiến. 
                Được tin dùng bởi hơn 10,000 doanh nghiệp trên toàn quốc.
              </p>
              <div className="flex space-x-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <span className="text-white text-sm font-medium">ISO 27001</span>
                </div>
                <div className="bg-green-600 p-2 rounded-lg">
                  <span className="text-white text-sm font-medium">99.99% Uptime</span>
                </div>
              </div>
            </div>
            
            <div>
              <Title level={4} className="!text-white !mb-6">Sản phẩm</Title>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors hover:underline">POS System</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Inventory Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Analytics & Reports</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Employee Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Mobile Apps</a></li>
              </ul>
            </div>
            
            <div>
              <Title level={4} className="!text-white !mb-6">Giải pháp</Title>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Cửa hàng nhỏ</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Chuỗi cửa hàng</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Siêu thị</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">F&B</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Fashion & Beauty</a></li>
              </ul>
            </div>
            
            <div>
              <Title level={4} className="!text-white !mb-6">Hỗ trợ</Title>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Knowledge Base</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Video Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Live Chat 24/7</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Phone Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors hover:underline">Developer API</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2025 PLT Retail Store. Tất cả quyền được bảo lưu. 
                <span className="ml-4">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a> • 
                  <a href="#" className="hover:text-white transition-colors ml-2">Terms of Service</a>
                </span>
              </p>
              <div className="text-gray-400 text-sm">
                Hotline: <span className="text-white font-semibold">1900 888 999</span> • 
                Email: <span className="text-white font-semibold ml-1">support@pltretail.com</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
