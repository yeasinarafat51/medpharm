function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2>Total Medicines</h2>

          <p className="text-4xl font-bold mt-4">250</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2>Total Sales</h2>

          <p className="text-4xl font-bold mt-4">920</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2>Low Stock</h2>

          <p className="text-4xl font-bold mt-4">12</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2>Expired</h2>

          <p className="text-4xl font-bold mt-4">4</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
