import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useAuth from "../../../hooks/useAuth";

function MyInvoices() {
  const { user } = useAuth();

  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!user?.email) return;

      try {
        const res = await axios.get(
          `http://localhost:5000/api/invoices/customer/${user.email}`,
        );

        if (res.data.success) {
          setInvoices(res.data.invoices);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">Loading...</div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold mb-6">My Invoices</h1>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th>Invoice</th>

              <th>Date</th>

              <th>Total</th>

              <th>Payment</th>

              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNo}</td>
                <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                <td>৳ {invoice.grandTotal}</td>
                <td>{invoice.paymentStatus}</td>

                <td>
                  <Link
                    to={`/invoice/${invoice.invoiceNo}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyInvoices;
