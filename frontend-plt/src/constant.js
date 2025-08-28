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

export const BASE_URL = import.meta.env.VITE_VERCEL_BASE_URL;
export const SERVER_URL = import.meta.env.VITE_VERCEL_SERVER_URL;

export const DATETIME_FORMAT = "DD/MM/YYYY HH:mm:ss";
export const DATE_FORMAT = "DD/MM/YYYY";
export const TIME_FORMAT = "HH:mm:ss";

// Firebase Auth Context
export const DOMAIN_EMAIL_DEFAULT = "@plt.retail.default";
export const ADMIN_ROLE = "admin";
export const MANAGER_ROLE = "manager";
export const STAFF_ROLE = "staff";
export const USER_ROLE = "user";

// Role hierarchy for easier permission checking
export const ROLE_HIERARCHY = {
  [ADMIN_ROLE]: 4,
  [MANAGER_ROLE]: 3,
  [STAFF_ROLE]: 2,
  [USER_ROLE]: 1
};

export const AVATAR_DEFAULT = "https://cdn3d.iconscout.com/3d/premium/thumb/programmer-3d-icon-download-in-png-blend-fbx-gltf-file-formats--development-coding-programming-developer-profession-avatar-pack-people-icons-11757512.png?f=webp";

// Product related constants
export const IMAGE_PRODUCT_EXAMPLE = `https://img.freepik.com/free-psd/product-backdrop-psd-modern-style-with-marble-podium-gold-palm-leaf_53876-140457.jpg`;
export const PRODUCT_TYPE_TEMP_FILE = `${SERVER_URL}/download-template/product-type-template.xlsx`;
export const UNIT_LIST_SUGGESTION = [
  { id: "kg", name: "kg" },
  { id: "lit", name: "lit" },
  { id: "pice", name: "pice" },
];
export const PRODUCT_STATUS_LIST = [
  { key: "selling", value: "Đang bán" },
  { key: "stopped_selling", value: "Ngưng bán" },
  { key: "in_stock", value: "Còn hàng" },
  { key: "out_of_stock", value: "Hết hàng" },
  { key: "coming_soon", value: "Sắp về hàng" },
  { key: "discontinued", value: "Ngừng sản xuất" },
  { key: "recalled", value: "Sản phẩm lỗi/Đã thu hồi" },
  { key: "demo_product", value: "Hàng demo/Hàng trưng bày" },
  { key: "gift_product", value: "Hàng tặng kèm" },
  { key: "almost_out_of_stock", value: "Sắp hết hàng" },
  { key: "temporarily_out_of_stock", value: "Tạm hết hàng" },
];

export const REGEX_PHONE_VN = /^(0[3|5|7|8|9][0-9]{8}|[1-9][0-9]{6,10})$/;
export const REGEX_PHONE_VN_ALLOW_EMPTY = /^(0[3|5|7|8|9][0-9]{8}|[1-9][0-9]{6,10})?$/;
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const REGEX_NUMBER = /^[0-9]+$/;