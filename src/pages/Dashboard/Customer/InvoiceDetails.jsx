import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

const API_URL = "https://medpharm-server-sgs6.vercel.app";

function InvoiceDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // LOAD INVOICE
  // ============================================

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/orders/${id}`);

      console.log("Invoice Response:", res.data);

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
  // PRINT
  // ============================================

  const handlePrint = () => {
    window.print();
  };

  // ============================================
  // DOWNLOAD PDF
  // ============================================

  const downloadPDF = () => {
    if (!order) return;

    try {
      const items = order.items || [];

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 220],
      });

      const pageWidth = 80;
      const margin = 5;
      const contentWidth = pageWidth - margin * 2;

      let y = 7;

      // ============================================
      // BASIC DATA
      // ============================================

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
        order.paymentMethod || order.paymentStatus || "CASH";

      // ============================================
      // TOTAL CALCULATION
      // ============================================

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
        Number(order.totalPaid) || Number(order.paidAmount) || grandTotal;

      const dueAmount = Math.max(grandTotal - totalPaid, 0);

      // ============================================
      // FONT
      // ============================================

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      // ============================================
      // PDF HEADER
      // ============================================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);

      pdf.text("NOVACARE", pageWidth / 2, y, {
        align: "center",
      });

      y += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);

      pdf.text("Pharmacy Management System", pageWidth / 2, y, {
        align: "center",
      });

      y += 4;

      pdf.text("WhatsApp: 01620316751", pageWidth / 2, y, {
        align: "center",
      });

      y += 5;

      // ============================================
      // LINE
      // ============================================

      pdf.setLineWidth(0.2);

      pdf.line(margin, y, pageWidth - margin, y);

      y += 5;

      // ============================================
      // INVOICE TITLE
      // ============================================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);

      pdf.text("RETAIL INVOICE", pageWidth / 2, y, {
        align: "center",
      });

      y += 6;

      // ============================================
      // ORDER INFORMATION
      // ============================================

      pdf.setFontSize(7);

      pdf.setFont("helvetica", "bold");

      pdf.text("ORDER:", margin, y);

      pdf.setFont("helvetica", "normal");

      pdf.text(invoiceNumber, margin + 13, y);

      y += 4;

      pdf.setFont("helvetica", "bold");

      pdf.text("DATE:", margin, y);

      pdf.setFont("helvetica", "normal");

      pdf.text(orderDate.toLocaleDateString(), margin + 13, y);

      y += 4;

      pdf.setFont("helvetica", "bold");

      pdf.text("TIME:", margin, y);

      pdf.setFont("helvetica", "normal");

      pdf.text(
        orderDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        margin + 13,
        y,
      );

      y += 5;

      // ============================================
      // CUSTOMER
      // ============================================

      pdf.setFont("helvetica", "bold");

      pdf.text("CUSTOMER:", margin, y);

      pdf.setFont("helvetica", "normal");

      const customerText = pdf.splitTextToSize(customerName, contentWidth - 18);

      pdf.text(customerText, margin + 18, y);

      y += 4 * customerText.length;

      // ============================================
      // PHONE
      // ============================================

      pdf.setFont("helvetica", "bold");

      pdf.text("PHONE:", margin, y);

      pdf.setFont("helvetica", "normal");

      pdf.text(customerPhone, margin + 14, y);

      y += 4;

      // ============================================
      // ADDRESS
      // ============================================

      pdf.setFont("helvetica", "bold");

      pdf.text("ADDRESS:", margin, y);

      pdf.setFont("helvetica", "normal");

      const addressText = pdf.splitTextToSize(
        customerAddress,
        contentWidth - 18,
      );

      pdf.text(addressText, margin + 18, y);

      y += 4 * addressText.length;

      y += 2;

      // ============================================
      // LINE
      // ============================================

      pdf.line(margin, y, pageWidth - margin, y);

      y += 5;

      // ============================================
      // TABLE HEADER
      // ============================================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);

      pdf.text("SL", margin, y);

      pdf.text("ITEM", margin + 8, y);

      pdf.text("PRICE", 49, y, {
        align: "right",
      });

      pdf.text("QTY", 60, y, {
        align: "right",
      });

      pdf.text("TOTAL", 75, y, {
        align: "right",
      });

      y += 3;

      pdf.line(margin, y, pageWidth - margin, y);

      y += 4;

      // ============================================
      // MEDICINES
      // ============================================

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

        const itemLines = pdf.splitTextToSize(medicineName, 38);

        pdf.text(String(index + 1), margin, y);

        pdf.text(itemLines, margin + 8, y);

        pdf.text(unitPrice.toFixed(2), 49, y, {
          align: "right",
        });

        pdf.text(String(quantity), 60, y, {
          align: "right",
        });

        pdf.text(totalPrice.toFixed(2), 75, y, {
          align: "right",
        });

        y += Math.max(4, itemLines.length * 3.5);

        // Strength
        if (item.strength) {
          pdf.setFontSize(6);

          pdf.setTextColor(90, 90, 90);

          pdf.text(String(item.strength), margin + 8, y);

          pdf.setTextColor(0, 0, 0);

          pdf.setFontSize(7);

          y += 3;
        }

        // Company
        if (item.company) {
          pdf.setFontSize(6);

          pdf.setTextColor(90, 90, 90);

          pdf.text(String(item.company), margin + 8, y);

          pdf.setTextColor(0, 0, 0);

          pdf.setFontSize(7);

          y += 3;
        }

        y += 1;
      });

      // ============================================
      // TOTAL LINE
      // ============================================

      pdf.line(margin, y, pageWidth - margin, y);

      y += 5;

      // ============================================
      // TOTAL
      // ============================================

      pdf.setFontSize(8);

      pdf.setFont("helvetica", "normal");

      pdf.text("Total:", 48, y);

      pdf.text(`BDT ${subtotal.toFixed(2)}`, 75, y, {
        align: "right",
      });

      y += 4;

      pdf.text("Discount:", 48, y);

      pdf.text(`BDT ${discount.toFixed(2)}`, 75, y, {
        align: "right",
      });

      y += 5;

      // ============================================
      // NET AMOUNT
      // ============================================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);

      pdf.text("NET AMOUNT:", 42, y);

      pdf.text(`BDT ${grandTotal.toFixed(2)}`, 75, y, {
        align: "right",
      });

      y += 5;

      // ============================================
      // PAID
      // ============================================

      pdf.setFontSize(8);

      pdf.text("Total Paid:", 48, y);

      pdf.text(`BDT ${totalPaid.toFixed(2)}`, 75, y, {
        align: "right",
      });

      y += 4;

      pdf.setFont("helvetica", "normal");

      pdf.text("Due:", 48, y);

      pdf.text(`BDT ${dueAmount.toFixed(2)}`, 75, y, {
        align: "right",
      });

      y += 5;

      // ============================================
      // PAYMENT
      // ============================================

      pdf.line(margin, y, pageWidth - margin, y);

      y += 5;

      pdf.setFont("helvetica", "bold");

      pdf.text("Paid By:", margin, y);

      pdf.setFont("helvetica", "normal");

      pdf.text(paymentMethod, margin + 15, y);

      y += 7;

      // ============================================
      // FOOTER
      // ============================================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);

      pdf.text("Thank you for choosing NovaCare!", pageWidth / 2, y, {
        align: "center",
      });

      y += 4;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);

      pdf.text("Powered and Managed by NovaCare", pageWidth / 2, y, {
        align: "center",
      });

      // ============================================
      // SAVE PDF
      // ============================================

      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div
            className="
              mx-auto
              h-12
              w-12
              animate-spin
              rounded-full
              border-4
              border-gray-300
              border-t-blue-600
            "
          />

          <h2 className="mt-4 text-xl font-bold text-gray-700">
            Loading Invoice...
          </h2>

          <p className="mt-1 text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT FOUND
  // ============================================

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="text-5xl">📄</div>

          <h2 className="mt-4 text-2xl font-bold text-red-600">
            Invoice Not Found
          </h2>

          <p className="mt-2 text-gray-600">Invoice ID: {id}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // DATA
  // ============================================

  const items = order.items || [];

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
    Number(order.totalPaid) || Number(order.paidAmount) || grandTotal;

  const dueAmount = Math.max(grandTotal - totalPaid, 0);

  const paymentMethod = order.paymentMethod || order.paymentStatus || "CASH";

  // ============================================
  // SCREEN
  // ============================================

  return (
    <>
      <div className="invoice-page min-h-screen bg-gray-200 px-3 py-6">
        {/* ========================================
            INVOICE
        ======================================== */}

        <div
          id="invoice"
          className="
            invoice
            mx-auto
            w-full
            max-w-[420px]
            bg-white
            px-4
            py-5
            text-black
            shadow-lg
          "
        >
          {/* ========================================
              HEADER
          ======================================== */}

          <div className="text-center">
            <h1 className="text-3xl font-black tracking-wide">NOVACARE</h1>

            <p className="mt-1 text-xs font-semibold">
              Pharmacy Management System
            </p>

            {/* WhatsApp */}

            <p className="text-xs">WhatsApp: 01620316751</p>
          </div>

          <div className="my-3 border-t border-dashed border-black" />

          {/* ========================================
              TITLE
          ======================================== */}

          <h2 className="text-center text-xl font-bold">RETAIL INVOICE</h2>

          {/* ========================================
              ORDER INFORMATION
          ======================================== */}

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {/* ORDER */}

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

            {/* CUSTOMER */}

            <div className="text-right">
              <p className="font-bold">Customer</p>

              <p className="break-words">
                {order.customerName || "Walk-in Customer"}
              </p>

              <p className="mt-1">{order.phone || "N/A"}</p>

              <p className="mt-1 font-bold">Address</p>

              <p className="break-words leading-4">{order.address || "N/A"}</p>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-black" />

          {/* ========================================
              TABLE HEADER
          ======================================== */}

          <div
            className="
              grid
              grid-cols-[25px_1fr_52px_30px_55px]
              gap-1
              text-xs
              font-bold
            "
          >
            <div>SL</div>

            <div>ITEM</div>

            <div className="text-right">PRICE</div>

            <div className="text-right">QTY</div>

            <div className="text-right">TOTAL</div>
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          {/* ========================================
              MEDICINES
          ======================================== */}

          <div>
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
                  className="
                    mb-3
                    grid
                    grid-cols-[25px_1fr_52px_30px_55px]
                    gap-1
                    text-xs
                  "
                >
                  <div>{index + 1}</div>

                  <div className="min-w-0">
                    <p className="break-words font-bold uppercase">
                      {item.medicineName || item.name || "Medicine"}
                    </p>

                    {item.strength && (
                      <p className="text-[10px]">{item.strength}</p>
                    )}

                    {item.company && (
                      <p className="text-[10px]">{item.company}</p>
                    )}
                  </div>

                  <div className="text-right">{unitPrice.toFixed(2)}</div>

                  <div className="text-right">{quantity}</div>

                  <div className="text-right font-bold">
                    {totalPrice.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-black" />

          {/* ========================================
              TOTAL
          ======================================== */}

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Total:</span>

              <span>৳ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Discount:</span>

              <span>- ৳ {discount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-black">
              <span>NET AMOUNT:</span>

              <span>৳ {grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Paid:</span>

              <span>৳ {totalPaid.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Due:</span>

              <span>৳ {dueAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-black" />

          {/* ========================================
              PAYMENT
          ======================================== */}

          <div className="text-center text-xs">
            <strong>Paid By:</strong> {paymentMethod}
          </div>

          <div className="my-3 border-t border-dashed border-black" />

          {/* ========================================
              FOOTER
          ======================================== */}

          <div className="text-center">
            <p className="text-sm font-bold">
              Thank you for choosing NovaCare!
            </p>

            <p className="mt-1 text-[10px]">Powered and Managed by NovaCare</p>
          </div>
        </div>

        {/* ========================================
            BUTTONS
        ======================================== */}

        <div
          className="
            print-hidden
            mx-auto
            mt-5
            flex
            max-w-[420px]
            gap-3
          "
        >
          <button
            onClick={handlePrint}
            className="
              flex-1
              rounded-lg
              bg-blue-600
              px-4
              py-3
              font-bold
              text-white
              transition
              hover:bg-blue-700
            "
          >
            🖨️ Print Invoice
          </button>

          <button
            onClick={downloadPDF}
            className="
              flex-1
              rounded-lg
              bg-green-600
              px-4
              py-3
              font-bold
              text-white
              transition
              hover:bg-green-700
            "
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* ============================================
          PRINT CSS
      ============================================ */}

      <style>{`

        @media print {

          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 80mm !important;
            min-width: 80mm !important;

            margin: 0 !important;
            padding: 0 !important;

            background: white !important;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif !important;

            color: #000 !important;

            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #invoice,
          #invoice * {
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

            font-family:
              Arial,
              Helvetica,
              sans-serif !important;

            color: #000 !important;

            font-size: 10px !important;

            line-height: 1.3 !important;
          }

          #invoice h1 {

            font-size: 22px !important;

            line-height: 1.1 !important;

            font-weight: 900 !important;
          }

          #invoice h2 {

            font-size: 15px !important;

            line-height: 1.2 !important;

            font-weight: 800 !important;
          }

          #invoice p,
          #invoice div,
          #invoice span {

            color: #000 !important;
          }

          #invoice .text-xs {
            font-size: 10px !important;
          }

          #invoice .text-sm {
            font-size: 12px !important;
          }

          #invoice .text-base {
            font-size: 14px !important;
          }

          #invoice .text-xl {
            font-size: 15px !important;
          }

          #invoice .text-3xl {
            font-size: 22px !important;
          }

          #invoice .text-\\[10px\\] {
            font-size: 9px !important;
          }

          #invoice .border-dashed {
            border-color: #000 !important;
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

          #invoice {

            min-height: 0 !important;

            height: auto !important;
          }

          /* Prevent text cutting */

          #invoice p {

            overflow-wrap: anywhere !important;

            word-break: normal !important;
          }

          /* Keep medicine rows together */

          #invoice > div {

            break-inside: avoid !important;

            page-break-inside: avoid !important;
          }

        }

      `}</style>
    </>
  );
}

export default InvoiceDetails;
