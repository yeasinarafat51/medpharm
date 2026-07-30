import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
// import Dashboard from "../pages/Dashboard/Dashboard";
import AddMedicine from "../pages/Dashboard/Admin/AddMedicine";
import AllMedicine from "../pages/Dashboard/Admin/AllMedicine";
import UpdateMedicine from "../pages/Dashboard/Admin/UpdateMedicine";
import AllItemMedicine from "../pages/Dashboard/Customer/AllItemMedicine";
import AllOrders from "../pages/Dashboard/Admin/AllOrders";
import MyOrders from "../pages/Dashboard/Customer/MyOrders";
import DashboardHome from "../pages/Dashboard/Admin/DashboardHome";
import Users from "../pages/Dashboard/Admin/Users";
import SalesReport from "../pages/Dashboard/Admin/SalesReport";
import AdminRoute from "./AdminRoute";
import Unauthorized from "../pages/Unauthorized";
// import Unauthorized from "./pages/Unauthorized";
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <AllItemMedicine />,
      },
      // {
      //   path: "all-item-medicine",
      //   element: <AllItemMedicine />,
      // },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      // {
      //   path: "dashboard",
      //   element: <Dashboard />,
      // },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "my-orders",
        element: <MyOrders />,
      },
      {
        path: "/unauthorized",
        element: <Unauthorized />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <AdminRoute>
        <Dashboard />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },

      {
        path: "add-medicine",
        element: <AddMedicine />,
      },
      {
        path: "all-medicine",
        element: <AllMedicine />,
      },
      {
        path: "update-medicine/:id",
        element: <UpdateMedicine />,
      },
      // {
      //   path: "all-item-medicine",
      //   element: <AllItemMedicine />,
      // },
      {
        path: "all-orders",
        element: <AllOrders />,
      },
      // {
      //   path: "my-orders",
      //   element: <MyOrders />,
      // },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "sales-report",
        element: <SalesReport />,
      },
    ],
  },
]);

export default router;
