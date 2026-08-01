import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function InvoiceDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await axios.get(
        `https://medpharm-server-sgs6.vercel.app/api/orders/${id}`,
      );

      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const input = document.getElementById("invoice");

    const canvas = await html2canvas(input);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const width = 210;

    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);

    pdf.save(`Invoice-${order._id}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h2 className="text-3xl font-bold">Loading Invoice...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h2 className="text-3xl font-bold text-red-600">Invoice Not Found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div
        id="invoice"
        className="mx-auto max-w-6xl rounded-xl bg-white p-8 shadow-lg"
      >
        {/* Header */}

        <div className="flex justify-between border-b pb-6">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">💊 MedPharm</h1>

            <p>Pharmacy Management System</p>

            <p>Cumilla, Bangladesh</p>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold">INVOICE</h2>

            <p>
              <strong>Invoice :</strong>

              {order.invoiceNo || `INV-${order._id.slice(-6)}`}
            </p>

            <p>
              <strong>Date :</strong>

              {new Date(order.orderDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer */}

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-3">Customer</h2>

            <p>Name : {order.customerName}</p>

            <p>Email : {order.customerEmail}</p>

            <p>Phone : {order.phone}</p>

            <p>Address : {order.address}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Order Status</h2>

            <p>
              Payment :
              <span className="ml-2 font-bold">{order.paymentStatus}</span>
            </p>

            <p>
              Status :
              <span className="ml-2 font-bold">{order.orderStatus}</span>
            </p>
          </div>
        </div>

        {/* Table */}

        <div className="mt-10 overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Company</th>
                <th>MRP</th>
                <th>Discount</th>
                <th>Selling Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {(order.items || []).map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>

                  <td>{item.medicineName}</td>

                  <td>{item.company}</td>

                  <td>৳ {item.mrp}</td>

                  <td>{item.discount}%</td>

                  <td>৳ {item.unitPrice}</td>

                  <td>{item.quantity}</td>

                  <td>৳ {item.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}

        <div className="mt-10 flex justify-end">
          <div className="w-80 rounded-lg border p-6">
            <div className="mb-3 flex justify-between">
              <span>Total Items</span>

              <span>{order.items?.length || 0}</span>
            </div>

            <div className="mb-3 flex justify-between">
              <span>Payment</span>

              <span>{order.paymentStatus}</span>
            </div>

            <hr />

            <div className="mt-3 flex justify-between text-2xl font-bold">
              <span>Grand Total</span>

              <span>৳ {order.grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}

        <div className="mt-10 flex gap-4">
          <button
            onClick={() => window.print()}
            className="rounded bg-blue-600 px-6 py-3 text-white"
          >
            Print Invoice
          </button>

          <button
            onClick={downloadPDF}
            className="rounded bg-green-600 px-6 py-3 text-white"
          >
            Download PDF
          </button>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-gray-500">
          Thank you for choosing MedPharm.
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetails;
