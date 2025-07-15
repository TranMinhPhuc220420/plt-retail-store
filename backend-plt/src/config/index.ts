import { User } from "@/interfaces";

export const ADMINISTRATOR_LIST = [
  'dev-user-id',
  'super-admin-user-id',
]

export const AVATAR_DEFAULT = "https://cdn3d.iconscout.com/3d/premium/thumb/programmer-3d-icon-download-in-png-blend-fbx-gltf-file-formats--development-coding-programming-developer-profession-avatar-pack-people-icons-11757512.png?f=webp";

export const ADMIN_ROLE = "ADMIN";
export const USER_ROLE = "USER";
export const ROLES = [ADMIN_ROLE, USER_ROLE];

export const USER_DEV : User = {
  id: 'dev-user-id',
  email: 'dev_test@plt.retail.default',
  role: ADMIN_ROLE,
  fullname: 'Dev User',
  avatar: AVATAR_DEFAULT,
  username: 'dev_user',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const STORE_DISK_PATH = "./storages/stores/images";
export const STORE_URL_TEMP = "/stores/images/{filename}";

export const PRODUCT_DISK_PATH = "./storages/products/images";
export const PRODUCT_URL_TEMP = "/uploads/products/images/{filename}";

export const PUBLIC_DISK_PATH = "./public";

export const STORAGE_CONFIG = {
  public: {
    disk: PUBLIC_DISK_PATH,
    prefix: "/public/",
  },
  stores: {
    disk: STORE_DISK_PATH,
    prefix: "/stores/images/",
  },
  products: {
    disk: PRODUCT_DISK_PATH,
    prefix: "/products/images/",
  },
};

export const STORE_CODE_NOT_ALLOWED_TO_CREATE = ['admin', 'undefined', 'root', 'null', 'superadmin', 'administrator'];