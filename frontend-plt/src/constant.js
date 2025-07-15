// collections
export const EMPLOYEE_COLLECTION = "employees";

export const EMPLOYEE_LEVEL = {
  "1": "Thực tập sinh",
  "2": "Nhân viên sơ cấp",
  "3": "Nhân viên trung cấp",
};

export const POSITION_LIST = [
  { id: "1", name: "Barista" },
  { id: "2", name: "Server" },
  { id: "3", name: "Leader" },
  
];

export const BRANCH_LIST = [
  { id: "1", name: "SaiGon" },
  { id: "2", name: "HaNoi" },
];

export const DATETIME_FORMAT = "DD/MM/YYYY HH:mm:ss";
export const DATE_FORMAT = "DD/MM/YYYY";
export const TIME_FORMAT = "HH:mm:ss";

// Firebase Auth Context
export const DOMAIN_EMAIL_DEFAULT = "@plt.retail.default";
export const ADMIN_ROLE = "ADMIN";
export const USER_ROLE = "USER";

export const AVATAR_DEFAULT = "https://cdn3d.iconscout.com/3d/premium/thumb/programmer-3d-icon-download-in-png-blend-fbx-gltf-file-formats--development-coding-programming-developer-profession-avatar-pack-people-icons-11757512.png?f=webp";

export const BASE_URL = import.meta.env.VITE_VERCEL_SERVER_URL;

export const PRODUCT_TYPE_TEMP_FILE = `${BASE_URL}/public/download-template/product-type-template.xlsx`;