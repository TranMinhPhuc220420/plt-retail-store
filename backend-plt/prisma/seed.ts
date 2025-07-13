import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const AVATAR_DEFAULT = "https://cdn3d.iconscout.com/3d/premium/thumb/programmer-3d-icon-download-in-png-blend-fbx-gltf-file-formats--development-coding-programming-developer-profession-avatar-pack-people-icons-11757512.png?f=webp";
const USER_DEV = {
  id: 'dev-user-id',
  email: 'dev_test@plt.retail.default',
  role: 'ADMIN',
  fullname: 'Dev User',
  avatar: AVATAR_DEFAULT,
  username: 'dev_user',
  isActive: true,
};

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a default user
  const user = await prisma.user.upsert({
    where: { id: USER_DEV.id },
    update: {},
    create: {
      id: USER_DEV.id,
      email: USER_DEV.email,
      role: USER_DEV.role as any, // Cast to 'any' or 'UserRole' if imported
      fullname: USER_DEV.fullname,
      avatar: USER_DEV.avatar,
      username: USER_DEV.username,
      isActive: USER_DEV.isActive,
    },
  });

  console.log('✅ Seed completed successfully!');
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
