import React from "react";
import { Routes, Route, createBrowserRouter } from "react-router";

// Layouts
import LayoutOverview from "@/layout/overview";
import LayoutAdmin from "@/layout/admin";
import LayoutSalesEmployee from "@/layout/employee/LayoutSalesEmployee";

// Pages
import StoreManagerPage from "@/pages/admin/store/manager";
import ProductTypeManager from "@/pages/admin/product-types/manager";

import DashboardPage from "@/pages/admin/DashboardPage";
import RevenueManagerPage from "@/pages/admin/revenue/manager";
import ProductManagerPage from "@/pages/admin/product/manager";
import CompositeProductManagerPage from "@/pages/admin/composite-product/manager";
import InventoryManagerPage from "@/pages/admin/inventory/manager";
import InventoryDetailPage from "@/pages/admin/inventory/manager/detail";
import InventoryManagement from "@/pages/admin/inventory/management";
import IngredientManagerPage from "@/pages/admin/ingredient";
import IngredientInventoryPage from "@/pages/admin/ingredient/InventoryManagement";
import RecipeManagerPage from "@/pages/admin/recipe";
import ProductRecipeManagement from "@/pages/admin/ProductRecipeManagement";
import ReportPage from "@/pages/admin/ReportPage";

// Supplier pages
import SuppliersPage from "@/pages/admin/suppliers";
import SupplierDetailPage from "@/pages/admin/suppliers/[id]";

// Cost Analysis page
import CostAnalysisPage from "@/pages/admin/cost-analysis";

// Profile page
import ProfilePage from "@/pages/profile/ProfilePage";

import ManagerEmployeePage from "@/pages/admin/manager";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import SalesAccountManagement from "@/pages/admin/SalesAccountManagement";
import DashboardEmployeePage from "@/pages/employee/DashboardPage";
import SellManagerPage from "@/pages/employee/sell/manager";
import ClientManagerPage from "@/pages/employee/client/manager";
import InvoiceManagerPage from "@/pages/employee/invoice/manager";
import ShiftHandoverManagerPage from "@/pages/employee/shiftHandover/manager";

import LoginPage from "@/pages/login";
import SalesLoginPage from "@/pages/sales/SalesLoginPage";
import LandingPage from "@/pages/landing/LandingPage";

import AuthProvider from "@/provider/AuthProvider";
import SalesAuthProvider from "@/provider/SalesAuthProvider";
import SalesLoginProvider from "@/provider/SalesLoginProvider";
import ProtectedSalesRoute from "@/components/auth/ProtectedSalesRoute";

// Higher-Order Component for protected routes
const ProtectedRoute = ({ element }) => {
  return <AuthProvider>{element}</AuthProvider>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dang-nhap",
    element: (
      <ProtectedRoute
        element={<LoginPage />}
      />
    ),
  },

  // Sales login route
  {
    path: "/store/:storeCode/sales-login",
    element: (
      <SalesLoginProvider>
        <SalesLoginPage />
      </SalesLoginProvider>
    ),
  },

  {
    path: "/profile",
    element: (
      <ProtectedRoute
        element={<LayoutOverview />}
      />
    ),
    children: [
      {
        index: true,
        element: <ProfilePage />,
      },
    ],
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
        index: true,
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
        path: "san-pham-tong-hop",
        element: <CompositeProductManagerPage />,
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
        path: "ton-kho",
        element: <InventoryManagement />,
      },
      {
        path: "nguyen-lieu",
        element: <IngredientManagerPage />,
      },
      {
        path: "nguyen-lieu/ton-kho",
        element: <IngredientInventoryPage />,
      },
      {
        path: "cong-thuc",
        element: <RecipeManagerPage />,
      },
      {
        path: "san-pham-cong-thuc",
        element: <ProductRecipeManagement />,
      },
      {
        path: "nha-cung-cap",
        element: <SuppliersPage />,
      },
      {
        path: "nha-cung-cap/:supplierId",
        element: <SupplierDetailPage />,
      },
      {
        path: "phan-tich-chi-phi",
        element: <CostAnalysisPage />,
      },
      {
        path: "nhan-vien",
        children: [
          {
            index: true,
            element: <EmployeeManagement />,
          },
        ],
      },
      {
        path: "tai-khoan-ban-hang",
        element: <SalesAccountManagement />,
      },
    ],
  },

  // Sales routes (Employee interface with sales authentication)
  {
    path: "/store/:storeCode",
    element: (
      <SalesAuthProvider>
        <ProtectedSalesRoute>
          <LayoutSalesEmployee />
        </ProtectedSalesRoute>
      </SalesAuthProvider>
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
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
]);

export default router;