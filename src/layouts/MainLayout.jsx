import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import HeadlineBar from "../components/Headline/HeadlineBar";

function MainLayout() {
  return (
    <>
      <Navbar />
      <HeadlineBar />
      <main className="min-h-screen max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default MainLayout;
