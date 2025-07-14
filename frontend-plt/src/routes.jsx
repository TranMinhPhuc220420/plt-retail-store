import React from "react";

import { Routes, Route, createBrowserRouter } from "react-router";

// Layouts
import LayoutOverview from "@/layout/overview";
import LayoutAdmin from "@/layout/admin";
import LayoutEmployee from "@/layout/employee";

// Pages
import StoreManagerPage from "@/pages/admin/store/manager";

import DashboardPage from "@/pages/admin/DashboardPage";
import RevenueManagerPage from "@/pages/admin/revenue/manager";
import ProductManagerPage from "@/pages/admin/product/manager";
import InventoryManagerPage from "@/pages/admin/inventory/manager";
import ReportPage from "@/pages/admin/ReportPage";

import ManagerEmployeePage from "@/pages/admin/manager";
import DashboardEmployeePage from "@/pages/employee/DashboardPage";
import SellManagerPage from "@/pages/employee/sell/manager";
import ClientManagerPage from "@/pages/employee/client/manager";
import InvoiceManagerPage from "@/pages/employee/invoice/manager";
import ShiftHandoverManagerPage from "@/pages/employee/shiftHandover/manager";

import LoginPage from "@/pages/login";

const router = createBrowserRouter([
  {
    path: "/dang-nhap",
    element: <LoginPage />,
  },

  // Store management routes
  {
    path: '/overview',
    element: <LayoutOverview />,
    children: [
      {
        index: true,
        element: <StoreManagerPage />,
      },
    ],
  },

  // Admin routes
  {
    path: '/store/:storeCode/admin',
    element: <LayoutAdmin />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'quan-ly-san-pham',
        element: <ProductManagerPage />,
      },
      {
        path: 'quan-ly-kho',
        element: <InventoryManagerPage />,
      },
      {
        path: 'nhan-vien',
        children: [
          {
            path: 'quan-ly',
            element: <ManagerEmployeePage />,
          },
        ],
      },
    ],
  },

  // Client routes
  {
    path: '/store/:storeCode',
    element: <LayoutEmployee />,
    children: [
      {
        index: true,
        // path: 'dashboard',
        element: <DashboardEmployeePage />,
      },
      {
        path: 'ban-hang',
        element: <SellManagerPage />,
      },
      {
        path: 'khach-hang',
        element: <ClientManagerPage />,
      },
      {
        path: 'hoa-don',
        element: <InvoiceManagerPage />,
      },
      {
        path: 'giao-ca',
        element: <ShiftHandoverManagerPage />,
      },
    ],
  },

]);

export default router;