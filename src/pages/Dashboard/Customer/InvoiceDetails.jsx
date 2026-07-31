import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function InvoiceDetails() {
  const { invoiceNo } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const downloadPDF = async () => {
    const input = document.getElementById("invoice");

    const canvas = await html2canvas(input);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);

    pdf.save(`${invoice.invoiceNo}.pdf`);
  };

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/orders/invoice/${invoiceNo}`,
        );

        if (res.data.success) {
          setInvoice(res.data.invoice);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceNo]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h2 className="text-3xl font-bold text-blue-600">Loading Invoice...</h2>
      </div>
    );
  }

  if (!invoice) {
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
        <div className="flex flex-col justify-between gap-5 border-b pb-6 md:flex-row">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">💊 MedPharm</h1>

            <p className="text-gray-500">Pharmacy Management System</p>

            <p className="mt-2 text-gray-500">Cumilla, Bangladesh</p>
          </div>

          <div className="text-left md:text-right">
            <h2 className="text-3xl font-bold">INVOICE</h2>

            <p className="mt-2">
              <strong>Invoice No:</strong> {invoice.invoiceNo}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-bold">Customer Information</h3>

            <p>
              <strong>Name:</strong> {invoice.customerName}
            </p>

            <p>
              <strong>Email:</strong> {invoice.customerEmail}
            </p>

            <p>
              <strong>Phone:</strong> {invoice.phone}
            </p>

            <p>
              <strong>Address:</strong> {invoice.address}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-bold">Payment Information</h3>

            <p>
              <strong>Payment Status:</strong>

              <span
                className={`ml-3 rounded-full px-3 py-1 text-white ${
                  invoice.paymentStatus === "Paid"
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </p>

            <p className="mt-4">
              <strong>Order Status:</strong> {invoice.orderStatus}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-10 overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border p-3">#</th>
                <th className="border p-3">Medicine</th>
                <th className="border p-3">Company</th>
                <th className="border p-3">Qty</th>
                <th className="border p-3">Unit Price</th>
                <th className="border p-3">Total</th>
              </tr>
            </thead>

            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="border p-3">{index + 1}</td>

                  <td className="border p-3">{item.medicineName}</td>

                  <td className="border p-3">{item.company}</td>

                  <td className="border p-3">{item.quantity}</td>

                  <td className="border p-3">৳ {item.unitPrice}</td>

                  <td className="border p-3 font-bold">৳ {item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-10 flex justify-end">
          <div className="w-full max-w-sm rounded-lg border p-6">
            <div className="mb-3 flex justify-between">
              <span>Subtotal</span>

              <span>৳ {invoice.subtotal}</span>
            </div>

            <div className="mb-3 flex justify-between">
              <span>Discount</span>

              <span>৳ {invoice.discount}</span>
            </div>

            <div className="mb-3 flex justify-between">
              <span>VAT</span>

              <span>৳ {invoice.vat}</span>
            </div>

            <hr className="my-3" />

            <div className="flex justify-between text-2xl font-bold text-blue-700">
              <span>Grand Total</span>

              <span>৳ {invoice.grandTotal}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap gap-4">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            🖨 Print Invoice
          </button>

          <button
            onClick={downloadPDF}
            className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
          >
            ⬇ Download PDF
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t pt-6 text-center text-gray-500">
          <p>Thank you for choosing MedPharm.</p>

          <p className="mt-2">This is a computer generated invoice.</p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceDetails;
