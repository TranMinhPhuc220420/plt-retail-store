import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create customer user
  const customerPassword = await hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      username: 'customer',
      firstName: 'John',
      lastName: 'Doe',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      slug: 'electronics',
      imageUrl: 'https://example.com/electronics.jpg',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Fashion and apparel',
      slug: 'clothing',
      imageUrl: 'https://example.com/clothing.jpg',
    },
  });

  const books = await prisma.category.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: 'Books',
      description: 'Books and literature',
      slug: 'books',
      imageUrl: 'https://example.com/books.jpg',
    },
  });

  // Create products
  const products = [
    {
      name: 'Smartphone Pro',
      description: 'Latest smartphone with advanced features',
      slug: 'smartphone-pro',
      sku: 'PHONE-001',
      price: 999.99,
      comparePrice: 1099.99,
      stock: 50,
      categoryId: electronics.id,
      imageUrls: ['https://example.com/phone1.jpg', 'https://example.com/phone2.jpg'],
      tags: ['smartphone', 'technology', 'mobile'],
    },
    {
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones',
      slug: 'wireless-headphones',
      sku: 'AUDIO-001',
      price: 249.99,
      comparePrice: 299.99,
      stock: 75,
      categoryId: electronics.id,
      imageUrls: ['https://example.com/headphones1.jpg'],
      tags: ['audio', 'headphones', 'wireless'],
    },
    {
      name: 'Designer T-Shirt',
      description: 'Premium cotton t-shirt with modern design',
      slug: 'designer-t-shirt',
      sku: 'CLOTH-001',
      price: 39.99,
      comparePrice: 49.99,
      stock: 100,
      categoryId: clothing.id,
      imageUrls: ['https://example.com/tshirt1.jpg', 'https://example.com/tshirt2.jpg'],
      tags: ['clothing', 'fashion', 'cotton'],
    },
    {
      name: 'Programming Guide',
      description: 'Complete guide to modern programming',
      slug: 'programming-guide',
      sku: 'BOOK-001',
      price: 29.99,
      stock: 200,
      categoryId: books.id,
      imageUrls: ['https://example.com/book1.jpg'],
      tags: ['programming', 'education', 'technology'],
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    });
  }

  // Create customer address
  await prisma.address.upsert({
    where: { id: 'default-address' },
    update: {},
    create: {
      id: 'default-address',
      userId: customer.id,
      type: 'SHIPPING',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '+1234567890',
      isDefault: true,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`👤 Admin user: admin@example.com / admin123`);
  console.log(`👤 Customer user: customer@example.com / customer123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
