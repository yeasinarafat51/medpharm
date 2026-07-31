import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { RouterProvider } from "react-router-dom";

import "./index.css";

import router from "./routes/Router";

import AuthProvider from "./context/AuthProvider";
import CartProvider from "./context/CartContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
);
