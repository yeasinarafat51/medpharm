import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

const API_URL =
  import.meta.env.VITE_API_URL || "https://medpharm-server-3.onrender.com";

function InvoiceDetails() {
  const { id } = useParams();
  const location = useLocation();

  // AllOrders থেকে পাঠানো সিঙ্গেল অথবা কম্বাইন্ড অর্ডার ডাটা
  const passedOrder = location.state?.combinedOrder || null;

  const [order, setOrder] = useState(passedOrder);
  const [loading, setLoading] = useState(!passedOrder);

  // ============================================
  // LOAD INVOICE
  // ============================================
  useEffect(() => {
    // যদি স্টেট হিসেবে অর্ডার ডাটা চলে এসে থাকে তবে পুনরায় ফেচ করার দরকার নেই
    if (passedOrder) {
      setOrder(passedOrder);
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    loadOrder();
  }, [id, passedOrder]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/orders/${id}`);

      if (res.data?.success && res.data?.order) {
        setOrder(res.data.order);
      } else if (res.data?.order) {
        setOrder(res.data.order);
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error("Invoice Load Error:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PRINT ACTION
  // ============================================
  const handlePrint = () => {
    window.print();
  };

  // ============================================
  // DOWNLOAD PDF (AUTO-SCALING FOR ALL MEDICINES)
  // ============================================
  const downloadPDF = () => {
    if (!order) return;

    try {
      const items = order.items || [];
      const estimatedHeight = Math.max(180, 100 + items.length * 14);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, estimatedHeight],
      });

      const pageWidth = 80;
      const margin = 5;
      const contentWidth = pageWidth - margin * 2;

      let y = 7;

      const invoiceNumber =
        order.invoiceNo ||
        order.orderNo ||
        `INV-${String(order._id || "").slice(-6)}`;

      const orderDate = order.orderDate
        ? new Date(order.orderDate)
        : new Date();

      const customerName = order.customerName || "Walk-in Customer";
      const customerPhone = order.phone || "N/A";
      const customerAddress = order.address || "N/A";
      const paymentMethod =
        order.paymentMethod || order.paymentStatus || "Cash on Delivery";

      const subtotal = items.reduce((sum, item) => {
        const unitPrice =
          Number(item.unitPrice) ||
          Number(item.sellingPrice) ||
          Number(item.price) ||
          0;
        const quantity = Number(item.quantity) || 0;
        const total = Number(item.totalPrice) || unitPrice * quantity;
        return sum + total;
      }, 0);

      const discount = Number(order.discount || 0);
      const grandTotal = Number(order.grandTotal) || subtotal - discount;
      const totalPaid =
        Number(order.totalPaid) ||
        Number(order.paidAmount) ||
        (order.paymentStatus === "Paid" ? grandTotal : 0);
      const dueAmount = Math.max(grandTotal - totalPaid, 0);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      // HEADER
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("NOVACARE", pageWidth / 2, y, { align: "center" });

      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text("Pharmacy Management System", pageWidth / 2, y, {
        align: "center",
      });

      y += 3.5;
      pdf.text("WhatsApp: 01620316751", pageWidth / 2, y, { align: "center" });

      y += 4;
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageWidth - margin, y);

      y += 4;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("RETAIL INVOICE", pageWidth / 2, y, { align: "center" });

      if (order.orderCount && order.orderCount > 1) {
        y += 3.5;
        pdf.setFontSize(6.5);
        pdf.setTextColor(70, 70, 70);
        pdf.text(
          `[COMBINED: ${order.orderCount} Orders Merged into 1 Invoice]`,
          pageWidth / 2,
          y,
          { align: "center" },
        );
        pdf.setTextColor(0, 0, 0);
      }

      y += 5;
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text("INVOICE:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(invoiceNumber, margin + 14, y);

      y += 3.8;
      pdf.setFont("helvetica", "bold");
      pdf.text("DATE:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(orderDate.toLocaleDateString(), margin + 14, y);

      y += 3.8;
      pdf.setFont("helvetica", "bold");
      pdf.text("TIME:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        orderDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        margin + 14,
        y,
      );

      y += 4.5;
      pdf.setFont("helvetica", "bold");
      pdf.text("CUSTOMER:", margin, y);
      pdf.setFont("helvetica", "normal");
      const customerText = pdf.splitTextToSize(customerName, contentWidth - 18);
      pdf.text(customerText, margin + 18, y);
      y += 3.8 * customerText.length;

      pdf.setFont("helvetica", "bold");
      pdf.text("PHONE:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(customerPhone, margin + 14, y);
      y += 3.8;

      pdf.setFont("helvetica", "bold");
      pdf.text("ADDRESS:", margin, y);
      pdf.setFont("helvetica", "normal");
      const addressText = pdf.splitTextToSize(
        customerAddress,
        contentWidth - 18,
      );
      pdf.text(addressText, margin + 18, y);
      y += 3.8 * addressText.length;

      y += 2;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text("SL", margin, y);
      pdf.text("ITEM", margin + 7, y);
      pdf.text("PRICE", 50, y, { align: "right" });
      pdf.text("QTY", 61, y, { align: "right" });
      pdf.text("TOTAL", 75, y, { align: "right" });

      y += 2.5;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 3.5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);

      items.forEach((item, index) => {
        const unitPrice =
          Number(item.unitPrice) ||
          Number(item.sellingPrice) ||
          Number(item.price) ||
          0;
        const quantity = Number(item.quantity) || 0;
        const totalPrice = Number(item.totalPrice) || unitPrice * quantity;
        const medicineName = item.medicineName || item.name || "Medicine";
        const itemLines = pdf.splitTextToSize(medicineName, 36);

        pdf.text(String(index + 1), margin, y);
        pdf.text(itemLines, margin + 7, y);
        pdf.text(unitPrice.toFixed(2), 50, y, { align: "right" });
        pdf.text(String(quantity), 61, y, { align: "right" });
        pdf.text(totalPrice.toFixed(2), 75, y, { align: "right" });

        y += Math.max(3.8, itemLines.length * 3.2);

        if (item.company) {
          pdf.setFontSize(5.5);
          pdf.setTextColor(100, 100, 100);
          pdf.text(String(item.company), margin + 7, y);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(7);
          y += 3;
        }
        y += 1;
      });

      pdf.line(margin, y, pageWidth - margin, y);
      y += 4.5;

      pdf.setFontSize(7.5);
      pdf.text("Total:", 48, y);
      pdf.text(`BDT ${subtotal.toFixed(2)}`, 75, y, { align: "right" });

      if (discount > 0) {
        y += 3.8;
        pdf.text("Discount:", 48, y);
        pdf.text(`BDT ${discount.toFixed(2)}`, 75, y, { align: "right" });
      }

      y += 4.5;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.text("NET AMOUNT:", 40, y);
      pdf.text(`BDT ${grandTotal.toFixed(2)}`, 75, y, { align: "right" });

      y += 4.5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.text("Total Paid:", 48, y);
      pdf.text(`BDT ${totalPaid.toFixed(2)}`, 75, y, { align: "right" });

      y += 3.8;
      pdf.text("Due:", 48, y);
      pdf.text(`BDT ${dueAmount.toFixed(2)}`, 75, y, { align: "right" });

      y += 4;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;

      pdf.setFont("helvetica", "bold");
      pdf.text("Paid By:", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(paymentMethod, margin + 14, y);

      y += 6;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.text("Thank you for choosing NovaCare!", pageWidth / 2, y, {
        align: "center",
      });

      y += 3.5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      pdf.text("Powered and Managed by NovaCare", pageWidth / 2, y, {
        align: "center",
      });

      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-600" />
          <h2 className="mt-3 text-lg font-bold text-gray-700">
            Loading Invoice...
          </h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-4xl mb-2">📄</div>
          <h2 className="text-xl font-bold text-red-600">Invoice Not Found</h2>
          <p className="mt-2 text-xs text-gray-500">
            Could not retrieve order details.
          </p>
          <Link
            to="/dashboard/all-orders"
            className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const isCombined = Boolean(order.orderCount && order.orderCount > 1);

  const invoiceNumber =
    order.invoiceNo ||
    order.orderNo ||
    `INV-${String(order._id || "").slice(-6)}`;

  const orderDate = order.orderDate ? new Date(order.orderDate) : new Date();

  const subtotal = items.reduce((sum, item) => {
    const unitPrice =
      Number(item.unitPrice) ||
      Number(item.sellingPrice) ||
      Number(item.price) ||
      0;
    const quantity = Number(item.quantity) || 0;
    const total = Number(item.totalPrice) || unitPrice * quantity;
    return sum + total;
  }, 0);

  const discount = Number(order.discount || 0);
  const grandTotal = Number(order.grandTotal) || subtotal - discount;
  const totalPaid =
    Number(order.totalPaid) ||
    Number(order.paidAmount) ||
    (order.paymentStatus === "Paid" ? grandTotal : 0);
  const dueAmount = Math.max(grandTotal - totalPaid, 0);
  const paymentMethod =
    order.paymentMethod || order.paymentStatus || "Cash on Delivery";

  return (
    <>
      <div className="invoice-page min-h-screen bg-slate-200 px-3 py-6">
        {/* COMBINED BADGE ON SCREEN */}
        {isCombined && (
          <div className="print-hidden mx-auto mb-3 max-w-[420px] rounded-xl bg-purple-600 p-3 text-center text-xs font-bold text-white shadow-md">
            ✨ {order.orderCount} Orders from 2 PM - 2 PM cycle combined into
            this single invoice!
          </div>
        )}

        {/* INVOICE CONTAINER */}
        <div
          id="invoice"
          className="invoice mx-auto w-full max-w-[420px] bg-white px-5 py-6 text-black shadow-lg rounded-xl"
        >
          {/* HEADER */}
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-wide">NOVACARE</h1>
            <p className="mt-0.5 text-xs font-bold text-slate-700">
              Pharmacy Management System
            </p>
            <p className="text-xs text-slate-600">WhatsApp: 01620316751</p>
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          {/* TITLE */}
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight">RETAIL INVOICE</h2>
            {isCombined ? (
              <span className="inline-block mt-0.5 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-black text-purple-800">
                COMBINED 1-INVOICE ({order.orderCount} ORDERS)
              </span>
            ) : (
              <span className="inline-block mt-0.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                SINGLE ORDER INVOICE
              </span>
            )}
          </div>

          {/* ORDER INFO */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p>
                <strong>ORDER:</strong> {invoiceNumber}
              </p>
              <p className="mt-1">
                <strong>DATE:</strong> {orderDate.toLocaleDateString()}
              </p>
              <p className="mt-1">
                <strong>TIME:</strong>{" "}
                {orderDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold">Customer</p>
              <p className="break-words font-semibold">
                {order.customerName || "Walk-in Customer"}
              </p>
              <p className="mt-0.5">{order.phone || "N/A"}</p>
              <p className="mt-1 font-bold">Address</p>
              <p className="break-words text-[11px] leading-3.5 text-slate-600">
                {order.address || "N/A"}
              </p>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          {/* TABLE HEADER */}
          <div className="grid grid-cols-[25px_1fr_52px_30px_55px] gap-1 text-[11px] font-black uppercase text-slate-700">
            <div>SL</div>
            <div>ITEM</div>
            <div className="text-right">PRICE</div>
            <div className="text-right">QTY</div>
            <div className="text-right">TOTAL</div>
          </div>

          <div className="my-2 border-t border-dashed border-slate-400" />

          {/* MEDICINES LIST */}
          <div className="divide-y divide-dashed divide-slate-200">
            {items.map((item, index) => {
              const unitPrice =
                Number(item.unitPrice) ||
                Number(item.sellingPrice) ||
                Number(item.price) ||
                0;
              const quantity = Number(item.quantity) || 0;
              const totalPrice =
                Number(item.totalPrice) || unitPrice * quantity;

              return (
                <div
                  key={item._id || index}
                  className="grid grid-cols-[25px_1fr_52px_30px_55px] gap-1 py-2 text-xs"
                >
                  <div className="text-slate-500">{index + 1}</div>

                  <div className="min-w-0 pr-1">
                    <p className="break-words font-bold uppercase text-slate-900 leading-tight">
                      {item.medicineName || item.name || "Medicine"}
                    </p>
                    {item.company && (
                      <p className="text-[10px] text-slate-500">
                        {item.company}
                      </p>
                    )}
                  </div>

                  <div className="text-right">{unitPrice.toFixed(2)}</div>
                  <div className="text-right font-bold">{quantity}</div>
                  <div className="text-right font-black text-slate-900">
                    {totalPrice.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="my-2 border-t border-dashed border-slate-400" />

          {/* TOTAL AMOUNTS */}
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>৳ {subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>- ৳ {discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black border-y border-dashed border-slate-300 py-1.5">
              <span>NET AMOUNT:</span>
              <span>৳ {grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Paid:</span>
              <span>৳ {totalPaid.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-800">
              <span>Due:</span>
              <span>৳ {dueAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          {/* PAYMENT METHOD */}
          <div className="text-center text-xs">
            <strong>Paid By:</strong> {paymentMethod}
          </div>

          <div className="my-3 border-t border-dashed border-slate-400" />

          {/* FOOTER */}
          <div className="text-center">
            <p className="text-xs font-bold">
              Thank you for choosing NovaCare!
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500">
              Powered and Managed by NovaCare
            </p>
          </div>
        </div>

        {/* PRINT & DOWNLOAD BUTTONS */}
        <div className="print-hidden mx-auto mt-5 flex max-w-[420px] gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white shadow-md transition hover:bg-slate-800"
          >
            🖨️ Print Invoice
          </button>

          <button
            onClick={downloadPDF}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-md transition hover:bg-emerald-700"
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* PRINT CSS STYLES */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            width: 80mm !important;
            min-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          #invoice, #invoice * {
            visibility: visible !important;
          }
          #invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
          }
          .print-hidden {
            display: none !important;
            visibility: hidden !important;
          }
          .invoice-page {
            min-height: 0 !important;
            height: auto !important;
            width: 80mm !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          #invoice p {
            overflow-wrap: anywhere !important;
          }
        }
      `}</style>
    </>
  );
}

export default InvoiceDetails;
