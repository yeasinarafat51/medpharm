import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function InvoiceDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD ORDER
  // ==========================================

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${id}`);

      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.log("Invoice Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DOWNLOAD PDF
  // ==========================================

  const downloadPDF = async () => {
    try {
      const input = document.getElementById("invoice");

      if (!input) {
        return;
      }

      const canvas = await html2canvas(input, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      // 80mm width
      const pdfWidth = 80;

      // Height according to actual content
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save(`Invoice-${order.invoiceNo || order._id}.pdf`);
    } catch (error) {
      console.log("PDF Error:", error);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <h2 className="text-2xl font-bold">Loading Invoice...</h2>
      </div>
    );
  }

  // ==========================================
  // INVOICE NOT FOUND
  // ==========================================

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <h2 className="text-2xl font-bold text-red-600">Invoice Not Found</h2>
      </div>
    );
  }

  // ==========================================
  // ITEMS
  // ==========================================

  const items = order.items || [];

  // ==========================================
  // SUBTOTAL
  // ==========================================

  const subtotal =
    Number(order.totalAmount) ||
    items.reduce((sum, item) => {
      const unitPrice =
        Number(item.unitPrice) || Number(item.sellingPrice) || 0;

      const quantity = Number(item.quantity) || 0;

      const totalPrice = Number(item.totalPrice) || unitPrice * quantity;

      return sum + totalPrice;
    }, 0);

  // ==========================================
  // DISCOUNT
  // ==========================================

  const discount = Number(order.discount || 0);

  // ==========================================
  // GRAND TOTAL
  // ==========================================

  const grandTotal = Number(order.grandTotal) || subtotal - discount;

  // ==========================================
  // TOTAL PAID
  // ==========================================

  const totalPaid =
    Number(order.totalPaid) || Number(order.paidAmount) || grandTotal;

  // ==========================================
  // CUSTOMER BALANCE
  // ==========================================

  const customerBalance =
    Number(order.customerBalance) ||
    Number(order.dueAmount) ||
    Math.max(grandTotal - totalPaid, 0);

  // ==========================================
  // DATE
  // ==========================================

  const orderDate = order.orderDate ? new Date(order.orderDate) : new Date();

  // ==========================================
  // INVOICE NUMBER
  // ==========================================

  const invoiceNumber =
    order.invoiceNo || order.orderNo || `INV-${order._id.slice(-6)}`;

  // ==========================================
  // PAYMENT METHOD
  // ==========================================

  const paymentMethod = order.paymentMethod || order.paymentStatus || "CASH";

  return (
    <>
      {/* ==================================================
          SCREEN
      ================================================== */}

      <div className="min-h-screen bg-gray-200 px-3 py-6">
        {/* ==================================================
            INVOICE
        ================================================== */}

        <div
          id="invoice"
          className="
            mx-auto
            w-full
            max-w-[420px]
            bg-white
            px-3
            py-3
            text-gray-800
            shadow-lg
          "
        >
          {/* ==================================================
              PHARMACY HEADER
          ================================================== */}

          <div className="text-center">
            <h1 className="text-2xl font-extrabold uppercase tracking-wide">
              NOVACARE
            </h1>

            <p className="mt-1 text-[10px] font-semibold">
              Pharmacy Management System
            </p>

            <p className="mt-1 text-[10px]">R-04, H-46, S-13</p>

            <p className="text-[10px]">MOB: 01401977986</p>
          </div>

          {/* ==================================================
              LINE
          ================================================== */}

          <div className="my-2 border-t border-dashed border-gray-500" />

          {/* ==================================================
              RETAIL INVOICE
          ================================================== */}

          <div className="text-center">
            <h2 className="text-lg font-bold uppercase">RETAIL INVOICE</h2>
          </div>

          {/* ==================================================
              ORDER INFORMATION
          ================================================== */}

          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            {/* LEFT */}

            <div>
              <p>
                <span className="font-bold">ORDER#:</span> {invoiceNumber}
              </p>

              <p className="mt-1">
                <span className="font-bold">DATE:</span>{" "}
                {orderDate.toLocaleDateString()}
              </p>

              <p className="mt-1">
                <span className="font-bold">TIME:</span>{" "}
                {orderDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* RIGHT */}

            <div className="text-right">
              <p className="font-bold">Customer Name:</p>

              <p className="break-words">
                {order.customerName || "Walk-in Customer"}
              </p>

              <p className="mt-1 font-bold">Customer Phone:</p>

              <p>{order.phone || "N/A"}</p>
            </div>
          </div>

          {/* ==================================================
              LINE
          ================================================== */}

          <div className="my-2 border-t border-dashed border-gray-500" />

          {/* ==================================================
              TABLE HEADER
          ================================================== */}

          <div
            className="
              grid
              grid-cols-[22px_1fr_48px_28px_48px]
              gap-1
              text-[9px]
              font-bold
            "
          >
            <div>SL.</div>

            <div>Item</div>

            <div className="text-right">Price/Pcs</div>

            <div className="text-right">Qty</div>

            <div className="text-right">Total</div>
          </div>

          {/* ==================================================
              TABLE LINE
          ================================================== */}

          <div className="my-1 border-t border-dashed border-gray-400" />

          {/* ==================================================
              MEDICINES
          ================================================== */}

          <div>
            {items.map((item, index) => {
              const unitPrice =
                Number(item.unitPrice) || Number(item.sellingPrice) || 0;

              const quantity = Number(item.quantity) || 0;

              const totalPrice =
                Number(item.totalPrice) || unitPrice * quantity;

              return (
                <div
                  key={index}
                  className="
                    mb-2
                    grid
                    grid-cols-[22px_1fr_48px_28px_48px]
                    gap-1
                    text-[9px]
                  "
                >
                  {/* SL */}

                  <div>{index + 1}</div>

                  {/* ITEM */}

                  <div className="min-w-0">
                    <p className="break-words font-semibold uppercase">
                      {item.medicineName}
                    </p>

                    {item.strength && (
                      <p className="text-[8px] text-gray-500">
                        {item.strength}
                      </p>
                    )}

                    {item.company && (
                      <p className="text-[8px] text-gray-500">{item.company}</p>
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="text-right">{unitPrice.toFixed(2)}</div>

                  {/* QTY */}

                  <div className="text-right">{quantity}</div>

                  {/* TOTAL */}

                  <div className="text-right font-semibold">
                    {totalPrice.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================================================
              TOTAL LINE
          ================================================== */}

          <div className="border-t border-dashed border-gray-500" />

          {/* ==================================================
              TOTAL SECTION
          ================================================== */}

          <div className="mt-2 space-y-1 text-[9px]">
            {/* TOTAL */}

            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>

              <span className="font-semibold">৳ {subtotal.toFixed(2)}</span>
            </div>

            {/* DISCOUNT */}

            <div className="flex justify-between">
              <span>Discount:</span>

              <span>- ৳ {discount.toFixed(2)}</span>
            </div>

            {/* NET AMOUNT */}

            <div className="flex justify-between text-sm font-bold">
              <span>Net Amount:</span>

              <span>৳ {grandTotal.toFixed(2)}</span>
            </div>

            {/* PAID */}

            <div className="flex justify-between">
              <span className="font-semibold">Total Paid:</span>

              <span className="font-semibold">৳ {totalPaid.toFixed(2)}</span>
            </div>

            {/* BALANCE */}

            <div className="flex justify-between">
              <span>Customer Balance:</span>

              <span>৳ {customerBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* ==================================================
              PAYMENT
          ================================================== */}

          <div className="my-2 border-t border-dashed border-gray-500" />

          <div className="text-center text-[9px]">
            <p>
              <span className="font-bold">Paid by:</span> {paymentMethod}
            </p>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="my-2 border-t border-dashed border-gray-500" />

          {/* <div
            className="
              invoice-footer
              text-center
              text-[8px]
              leading-4
              text-gray-600
            "
          >
            <p className="font-semibold">
              Item purchased can be exchanged within 7 days with receipt.
            </p>

            <p>Item purchased cannot refund for cash.</p>

            <p className="mt-1">Contact our WhatsApp for Home-delivery.</p>

            <p className="mt-2 font-bold text-gray-800">
              Thank you for choosing NovaCare.
            </p>

            <p className="mt-1">Powered and Managed by NovaCare</p>
          </div> */}
        </div>

        {/* ==================================================
            BUTTONS
        ================================================== */}

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
          {/* PRINT */}

          <button
            onClick={() => window.print()}
            className="
              flex-1
              rounded-lg
              bg-blue-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              hover:bg-blue-700
            "
          >
            🖨️ Print Invoice
          </button>

          {/* PDF */}

          <button
            onClick={downloadPDF}
            className="
              flex-1
              rounded-lg
              bg-green-600
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              hover:bg-green-700
            "
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {/* ==================================================
          PRINT CSS
      ================================================== */}

      <style>
        {`

          /* ==============================================
             PRINT
          ============================================== */

          @media print {

            @page {
              size: 80mm auto;
              margin: 0;
            }

            html,
            body {
              width: 80mm !important;

              min-width: 80mm !important;

              height: auto !important;

              min-height: 0 !important;

              margin: 0 !important;

              padding: 0 !important;

              background: white !important;
            }

            /* ==========================================
               HIDE EVERYTHING
            ========================================== */

            body * {
              visibility: hidden !important;
            }

            /* ==========================================
               SHOW ONLY INVOICE
            ========================================== */

            #invoice,
            #invoice * {
              visibility: visible !important;
            }

            /* ==========================================
               INVOICE
            ========================================== */

            #invoice {

              position: absolute !important;

              left: 0 !important;

              top: 0 !important;

              width: 80mm !important;

              max-width: 80mm !important;

              height: auto !important;

              min-height: 0 !important;

              margin: 0 !important;

              padding: 3mm !important;

              background: white !important;

              box-shadow: none !important;

              border: none !important;

              border-radius: 0 !important;

              overflow: visible !important;
            }

            /* ==========================================
               REMOVE SCREEN SPACING
            ========================================== */

            #invoice,
            #invoice * {

              box-sizing: border-box !important;

            }

            /* ==========================================
               HIDE BUTTONS
            ========================================== */

            .print-hidden {

              display: none !important;

              visibility: hidden !important;

            }

            /* ==========================================
               REMOVE EXTRA HEIGHT
            ========================================== */

            #invoice > div {

              min-height: 0 !important;

            }

            /* ==========================================
               FOOTER
            ========================================== */

            .invoice-footer {

              margin-bottom: 0 !important;

              padding-bottom: 0 !important;

            }

          }

        `}
      </style>
    </>
  );
}

export default InvoiceDetails;
