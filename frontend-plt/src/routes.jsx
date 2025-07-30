import React from "react";
import { Routes, Route, createBrowserRouter } from "react-router";

// Layouts
import LayoutOverview from "@/layout/overview";
import LayoutAdmin from "@/layout/admin";
import LayoutEmployee from "@/layout/employee";

// Pages
import StoreManagerPage from "@/pages/admin/store/manager";
import ProductTypeManager from "@/pages/admin/product-types/manager";

import DashboardPage from "@/pages/admin/DashboardPage";
import RevenueManagerPage from "@/pages/admin/revenue/manager";
import ProductManagerPage from "@/pages/admin/product/manager";
import InventoryManagerPage from "@/pages/admin/inventory/manager";
import InventoryDetailPage from "@/pages/admin/inventory/manager/detail";
import IngredientManagerPage from "@/pages/admin/ingredient";
import RecipeManagerPage from "@/pages/admin/recipe";
import ReportPage from "@/pages/admin/ReportPage";

import ManagerEmployeePage from "@/pages/admin/manager";
import DashboardEmployeePage from "@/pages/employee/DashboardPage";
import SellManagerPage from "@/pages/employee/sell/manager";
import ClientManagerPage from "@/pages/employee/client/manager";
import InvoiceManagerPage from "@/pages/employee/invoice/manager";
import ShiftHandoverManagerPage from "@/pages/employee/shiftHandover/manager";

import LoginPage from "@/pages/login";

import AuthProvider from "@/provider/AuthProvider";

// Higher-Order Component for protected routes
const ProtectedRoute = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>;
};

const router = createBrowserRouter([
  {
    path: "/dang-nhap",
    element: (
      <ProtectedRoute
        element={<LoginPage />}
      />
    ),
  },

  // Store management routes
  {
    path: "/overview",
    element: (
      <ProtectedRoute
        element={<LayoutOverview />}
      />
    ),
    children: [
      {
        index: true,
        element: <StoreManagerPage />,
      },
    ],
  },

  // Admin routes
  {
    path: "/store/:storeCode/admin",
    element: (
      <ProtectedRoute
        element={<LayoutAdmin />}
      />
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "loai-san-pham",
        element: <ProductTypeManager />,
      },
      {
        path: "san-pham",
        element: <ProductManagerPage />,
      },
      {
        path: "kho",
        element: <InventoryManagerPage />,
      },
      {
        path: "kho/:warehouseId",
        element: <InventoryDetailPage />,
      },
      {
        path: "nguyen-lieu",
        element: <IngredientManagerPage />,
      },
      {
        path: "cong-thuc",
        element: <RecipeManagerPage />,
      },
      {
        path: "nhan-vien",
        children: [
          {
            path: "quan-ly",
            element: <ManagerEmployeePage />,
          },
        ],
      },
    ],
  },

  // Client routes
  {
    path: "/store/:storeCode",
    element: (
      <ProtectedRoute
        element={<LayoutEmployee />}
      />
    ),
    children: [
      {
        index: true,
        element: <DashboardEmployeePage />,
      },
      {
        path: "ban-hang",
        element: <SellManagerPage />,
      },
      {
        path: "khach-hang",
        element: <ClientManagerPage />,
      },
      {
        path: "hoa-don",
        element: <InvoiceManagerPage />,
      },
      {
        path: "giao-ca",
        element: <ShiftHandoverManagerPage />,
      },
    ],
  },
]);

export default router;