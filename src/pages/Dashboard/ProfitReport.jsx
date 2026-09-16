import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "https://medpharm-server-bz7t.vercel.app";

const ProfitReport = () => {
  const { user, loading: authLoading } = useAuth();

  const [reports, setReports] = useState([]);

  const [summary, setSummary] = useState({
    totalPurchaseAmount: 0,
    totalSalesAmount: 0,
    totalProfit: 0,
    totalQuantity: 0,
    totalMedicines: 0,
  });

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(true);

  const loadProfitReport = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (from) {
        params.append("from", from);
      }

      if (to) {
        params.append("to", to);
      }

      const queryString = params.toString();

      const url = queryString
        ? `${API_URL}/api/profit/report?${queryString}`
        : `${API_URL}/api/profit/report`;

      const response = await axios.get(url);

      if (response.data?.success) {
        setReports(response.data.reports || []);

        setSummary({
          totalPurchaseAmount: Number(
            response.data.summary?.totalPurchaseAmount || 0,
          ),
          totalSalesAmount: Number(
            response.data.summary?.totalSalesAmount || 0,
          ),
          totalProfit: Number(response.data.summary?.totalProfit || 0),
          totalQuantity: Number(response.data.summary?.totalQuantity || 0),
          totalMedicines: Number(response.data.summary?.totalMedicines || 0),
        });
      } else {
        setReports([]);

        setSummary({
          totalPurchaseAmount: 0,
          totalSalesAmount: 0,
          totalProfit: 0,
          totalQuantity: 0,
          totalMedicines: 0,
        });

        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data?.message || "Failed to load profit report.",
        });
      }
    } catch (error) {
      console.error("Profit Report Error:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load profit report.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadProfitReport();
  }, [user, authLoading]);

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Please Login",
        text: "Please login first.",
      });

      return;
    }

    loadProfitReport();
  };

  const clearFilter = () => {
    setSearch("");
    setFrom("");
    setTo("");

    setTimeout(() => {
      loadProfitReport();
    }, 0);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

          <h2 className="text-xl font-semibold text-blue-600">
            Checking authentication...
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-md">
          <h2 className="mb-2 text-2xl font-bold text-red-600">
            Authentication Required
          </h2>

          <p className="text-gray-600">
            Please login to view the profit report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Profit Report</h1>

          <p className="mt-2 text-gray-500">
            Purchase, sales and profit report
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">Total Purchase</p>

            <h2 className="mt-3 text-3xl font-bold text-red-600">
              ৳ {formatCurrency(summary.totalPurchaseAmount)}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">Total Sales</p>

            <h2 className="mt-3 text-3xl font-bold text-blue-600">
              ৳ {formatCurrency(summary.totalSalesAmount)}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">Total Profit</p>

            <h2 className="mt-3 text-3xl font-bold text-green-600">
              ৳ {formatCurrency(summary.totalProfit)}
            </h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <p className="text-sm font-medium text-gray-500">Sold Quantity</p>

            <h2 className="mt-3 text-3xl font-bold text-purple-600">
              {Number(summary.totalQuantity || 0).toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-md">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine or company"
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Search"}
            </button>

            <button
              type="button"
              onClick={clearFilter}
              disabled={loading}
              className="rounded-lg bg-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Medicine Profit Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {reports.length} medicine records
              </p>
            </div>

            <button
              type="button"
              onClick={loadProfitReport}
              disabled={loading}
              className="w-fit rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    #
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Medicine
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Company
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Purchase Price
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Selling Price
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Sold Qty
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Purchase Amount
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Sales Amount
                  </th>

                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    Profit
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

                        <span className="text-gray-500">
                          Loading profit report...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No profit data found.
                    </td>
                  </tr>
                ) : (
                  reports.map((item, index) => (
                    <tr
                      key={`${item.medicineId}-${index}`}
                      className="border-t transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800">
                          {item.medicineName || "Unknown Medicine"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {item.company || "N/A"}
                      </td>

                      <td className="px-4 py-4 text-right font-medium text-red-600">
                        ৳ {formatCurrency(item.purchasePrice)}
                      </td>

                      <td className="px-4 py-4 text-right font-medium text-blue-600">
                        ৳ {formatCurrency(item.sellingPrice)}
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-gray-700">
                        {Number(item.soldQuantity || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-right font-medium text-red-600">
                        ৳ {formatCurrency(item.purchaseAmount)}
                      </td>

                      <td className="px-4 py-4 text-right font-medium text-blue-600">
                        ৳ {formatCurrency(item.salesAmount)}
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-green-600">
                        ৳ {formatCurrency(item.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {!loading && reports.length > 0 && (
                <tfoot className="bg-gray-100">
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-4 text-right font-bold text-gray-800"
                    >
                      Total
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-red-600">
                      ৳ {formatCurrency(summary.totalPurchaseAmount)}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-blue-600">
                      ৳ {formatCurrency(summary.totalSalesAmount)}
                    </td>

                    <td className="px-4 py-4 text-right font-bold text-green-600">
                      ৳ {formatCurrency(summary.totalProfit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitReport;
