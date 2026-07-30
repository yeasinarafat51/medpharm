import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

function MainLayout() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default MainLayout;
