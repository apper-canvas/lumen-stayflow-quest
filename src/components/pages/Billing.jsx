import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import reservationService from "@/services/api/reservationService";
import billingService from "@/services/api/billingService";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import FormField from "@/components/molecules/FormField";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Select from "@/components/atoms/Select";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
const Billing = () => {
const [bills, setBills] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTaxSettings, setShowTaxSettings] = useState(false);
  const [billToUpdate, setBillToUpdate] = useState(null);
  const [activeView, setActiveView] = useState("bills"); // bills, create, history, reports
  
  const [formData, setFormData] = useState({
    reservationId: "",
    roomCharges: "",
    additionalCharges: "",
    taxRate: 10,
    notes: ""
  });
  
  const [refundData, setRefundData] = useState({
    amount: "",
    reason: "",
    method: ""
  });
  
  const [adjustmentData, setAdjustmentData] = useState({
    type: "discount",
    amount: "",
    reason: ""
  });
  
  const [taxSettings, setTaxSettings] = useState({
    defaultRate: 10,
    taxName: "Sales Tax",
    taxNumber: "TAX-001"
  });
  
  const [formErrors, setFormErrors] = useState({});
  const paymentMethods = ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Check"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [billsData, reservationsData] = await Promise.all([
        billingService.getAll(),
        reservationService.getAll()
      ]);
      setBills(billsData);
      setReservations(reservationsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = [...bills];

    if (statusFilter !== "all") {
      filtered = filtered.filter(bill => bill.paymentStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.guestName?.toLowerCase().includes(query) ||
        bill.roomNumber?.toString().includes(query) ||
        bill.Id.toString().includes(query)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setFilteredBills(filtered);
  };

const resetForm = () => {
    setFormData({
      reservationId: "",
      roomCharges: "",
      additionalCharges: "",
      taxRate: taxSettings.defaultRate,
      notes: ""
    });
    setFormErrors({});
  };
  
  const resetRefundData = () => {
    setRefundData({
      amount: "",
      reason: "",
      method: ""
    });
  };
  
  const resetAdjustmentData = () => {
    setAdjustmentData({
      type: "discount",
      amount: "",
      reason: ""
    });
  };

const handleCreateBill = () => {
    resetForm();
    setSelectedBill(null);
    setActiveView("create");
  };

const handleProcessPayment = (bill) => {
    setBillToUpdate(bill);
    setShowPaymentModal(true);
  };

  const handleProcessRefund = (bill) => {
    setBillToUpdate(bill);
    resetRefundData();
    setShowRefundModal(true);
  };

  const handleAddAdjustment = (bill) => {
    setBillToUpdate(bill);
    resetAdjustmentData();
    setShowAdjustmentModal(true);
  };

const handlePaymentUpdate = async (paymentMethod, amount = null) => {
    if (!billToUpdate) return;

    try {
      const paymentAmount = amount || billToUpdate.totalAmount;
      
      await billingService.processPayment(billToUpdate.Id, {
        amount: paymentAmount,
        method: paymentMethod,
        transactionId: `TXN-${Date.now()}`
      });
      
      toast.success("Payment processed successfully!");
      setShowPaymentModal(false);
      setBillToUpdate(null);
      loadData();
    } catch (error) {
      toast.error("Failed to process payment");
    }
  };

  const handleRefundSubmit = async () => {
    if (!billToUpdate || !refundData.amount || !refundData.reason) {
      toast.error("Please fill in all refund details");
      return;
    }

    try {
      await billingService.processRefund(billToUpdate.Id, {
        amount: parseFloat(refundData.amount),
        reason: refundData.reason,
        method: refundData.method
      });

      toast.success("Refund processed successfully!");
      setShowRefundModal(false);
      setBillToUpdate(null);
      resetRefundData();
      loadData();
    } catch (error) {
      toast.error("Failed to process refund");
    }
  };

  const handleAdjustmentSubmit = async () => {
    if (!billToUpdate || !adjustmentData.amount || !adjustmentData.reason) {
      toast.error("Please fill in all adjustment details");
      return;
    }

    try {
      await billingService.addAdjustment(billToUpdate.Id, {
        type: adjustmentData.type,
        amount: parseFloat(adjustmentData.amount),
        reason: adjustmentData.reason,
        appliedBy: "Admin"
      });

      toast.success("Adjustment applied successfully!");
      setShowAdjustmentModal(false);
      setBillToUpdate(null);
      resetAdjustmentData();
      loadData();
    } catch (error) {
      toast.error("Failed to apply adjustment");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

const validateForm = () => {
    const errors = {};

    if (!formData.reservationId) errors.reservationId = "Reservation is required";
    if (!formData.roomCharges) errors.roomCharges = "Room charges are required";
    else if (isNaN(formData.roomCharges) || parseFloat(formData.roomCharges) < 0) {
      errors.roomCharges = "Room charges must be a valid number";
    }
    
    if (formData.taxRate && (isNaN(formData.taxRate) || parseFloat(formData.taxRate) < 0 || parseFloat(formData.taxRate) > 100)) {
      errors.taxRate = "Tax rate must be between 0 and 100";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const calculateTotal = () => {
const roomCharges = parseFloat(formData.roomCharges) || 0;
    const additionalCharges = formData.additionalCharges
      ? formData.additionalCharges
          .split(",")
          .map(charge => {
            const amount = parseFloat(charge.trim());
            return isNaN(amount) ? 0 : amount;
          })
          .reduce((sum, amount) => sum + amount, 0)
      : 0;
    
    const subtotal = roomCharges + additionalCharges;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };
  };

const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const reservation = reservations.find(r => r.Id === parseInt(formData.reservationId));
      if (!reservation) {
        toast.error("Invalid reservation selected");
        return;
      }

      const additionalChargesArray = formData.additionalCharges
        ? formData.additionalCharges.split(",").map(charge => {
            const amount = parseFloat(charge.trim());
            return isNaN(amount) ? 0 : amount;
          }).filter(amount => amount > 0)
        : [];

      const totals = calculateTotal();
      
      const billData = {
        reservationId: parseInt(formData.reservationId),
        guestName: reservation.guestName,
        roomNumber: reservation.roomNumber,
        roomCharges: parseFloat(formData.roomCharges),
        additionalCharges: additionalChargesArray,
        taxRate: parseFloat(formData.taxRate),
        notes: formData.notes,
        paymentStatus: "Pending"
      };

      await billingService.create(billData);
      toast.success("Invoice created successfully!");
      setActiveView("bills");
      resetForm();
      loadData();
    } catch (error) {
      toast.error("Failed to create invoice");
    }
  };
  
  const printInvoice = (bill) => {
    // Create a printable invoice
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(bill);
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };
  
  const generateInvoiceHTML = (bill) => {
    const invoiceDate = format(new Date(bill.createdAt), "MMMM d, yyyy");
    const dueDate = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "MMMM d, yyyy");
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${bill.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
          .invoice-number { font-size: 18px; color: #666; }
          .bill-to { margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .table th { background-color: #f8f9fa; font-weight: 600; }
          .totals { margin-top: 20px; text-align: right; }
          .total-line { margin: 5px 0; }
          .grand-total { font-weight: bold; font-size: 18px; color: #1e40af; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">StayFlow Hotel Management</div>
          <div class="invoice-number">Invoice #${bill.invoiceNumber}</div>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <div class="bill-to">
            <strong>Bill To:</strong><br>
            ${bill.guestName}<br>
            Room ${bill.roomNumber}
          </div>
          <div>
            <strong>Invoice Date:</strong> ${invoiceDate}<br>
            <strong>Due Date:</strong> ${dueDate}<br>
            <strong>Status:</strong> ${bill.paymentStatus}
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Charges</td>
              <td>$${bill.roomCharges.toFixed(2)}</td>
            </tr>
            ${bill.additionalCharges && bill.additionalCharges.length > 0 ? 
              bill.additionalCharges.map(charge => `
                <tr>
                  <td>Additional Charges</td>
                  <td>$${charge.toFixed(2)}</td>
                </tr>
              `).join('') : ''
            }
            ${bill.adjustments && bill.adjustments.length > 0 ?
              bill.adjustments.map(adj => `
                <tr>
                  <td>${adj.type === 'discount' ? 'Discount' : 'Additional Fee'} - ${adj.reason}</td>
                  <td>${adj.type === 'discount' ? '-' : ''}$${adj.amount.toFixed(2)}</td>
                </tr>
              `).join('') : ''
            }
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-line">Subtotal: $${(bill.subtotal || 0).toFixed(2)}</div>
          <div class="total-line">Tax (${bill.taxRate}%): $${(bill.taxAmount || 0).toFixed(2)}</div>
          <div class="total-line grand-total">Total: $${bill.totalAmount.toFixed(2)}</div>
          ${bill.paymentHistory && bill.paymentHistory.length > 0 ? `
            <div class="total-line">Paid: $${bill.paymentHistory.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</div>
            <div class="total-line">Balance: $${(bill.totalAmount - bill.paymentHistory.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}</div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for choosing StayFlow Hotel Management!</p>
          ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  };

  if (loading) return <Loading />;
  if (error) return <Error message="Failed to load billing data" description={error} onRetry={loadData} />;

  if (showForm) {
const unpaidReservations = reservations.filter(reservation => 
      reservation.status === "Checked Out" || reservation.status === "Checked In"
    );
    
    const paymentMethods = [
      "Cash", "Credit Card", "Debit Card", "Bank Transfer", 
      "Check", "Digital Wallet", "Corporate Account"
    ];

    if (activeView === "create") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
              <p className="text-gray-600">Generate a new invoice with tax calculations</p>
            </div>
            <Button 
              variant="secondary"
              onClick={() => setActiveView("bills")}
            >
              <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
              Back to Invoices
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
                  
                  <FormField
                    label="Reservation"
                    type="select"
                    name="reservationId"
                    value={formData.reservationId}
                    onChange={handleFormChange}
                    error={formErrors.reservationId}
                    required
                  >
                    <option value="">Select a reservation</option>
                    {unpaidReservations.map(reservation => (
                      <option key={reservation.Id} value={reservation.Id}>
                        {reservation.guestName} - Room {reservation.roomNumber} ({reservation.status})
                      </option>
                    ))}
                  </FormField>

                  <FormField
                    label="Room Charges"
                    type="number"
                    name="roomCharges"
                    value={formData.roomCharges}
                    onChange={handleFormChange}
                    error={formErrors.roomCharges}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />

                  <FormField
                    label="Additional Charges"
                    name="additionalCharges"
                    value={formData.additionalCharges}
                    onChange={handleFormChange}
                    placeholder="10.50, 25.00, 5.75 (comma separated amounts)"
                  />
                  
                  <FormField
                    label="Tax Rate (%)"
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleFormChange}
                    error={formErrors.taxRate}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="10.0"
                  />
                  
                  <FormField
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Additional notes or comments"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Room Charges:</span>
                      <span>${(parseFloat(formData.roomCharges) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Charges:</span>
                      <span>
                        ${formData.additionalCharges
                          ? formData.additionalCharges
                              .split(",")
                              .map(charge => parseFloat(charge.trim()) || 0)
                              .reduce((sum, amount) => sum + amount, 0)
                              .toFixed(2)
                          : "0.00"
                        }
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateTotal().subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({formData.taxRate}%):</span>
                        <span>${calculateTotal().taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span className="text-primary-600">${calculateTotal().total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveView("bills")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-gradient"
                >
                  Create Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      );
    }
  }

  return (
<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600">Complete billing solution with tax calculation and payment processing</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => setShowTaxSettings(true)}
          >
            <ApperIcon name="Settings" size={16} className="mr-2" />
            Tax Settings
          </Button>
          <Button 
            onClick={() => setActiveView("create")}
            className="btn-gradient"
          >
            <ApperIcon name="Plus" size={16} className="mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by guest name, room number, or bill ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {filteredBills.length === 0 ? (
          <Empty
            icon="CreditCard"
            title="No bills found"
            description={
              searchQuery || statusFilter !== "all"
                ? "No bills match your current filters. Try adjusting your search criteria."
                : "There are no bills created yet. Create your first bill to get started."
            }
            actionLabel={searchQuery || statusFilter !== "all" ? undefined : "Create First Bill"}
            onAction={searchQuery || statusFilter !== "all" ? undefined : handleCreateBill}
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                <div>Bill ID</div>
                <div>Guest</div>
                <div>Room</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <div key={bill.Id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
<div>
                      <p className="font-medium text-gray-900">#{bill.Id}</p>
                      <p className="text-sm text-gray-600">
                        {bill.created_at_c && format(new Date(bill.created_at_c), "MMM d, yyyy")}
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">{bill.guest_name_c}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">Room {bill.room_number_c}</p>
                    </div>
<div>
                      <p className="font-medium text-gray-900">${(bill.total_amount_c || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        Room: ${(bill.room_charges_c || 0).toFixed(2)}
                        {(() => {
                          try {
                            const additionalCharges = typeof bill.additional_charges_c === 'string' 
                              ? JSON.parse(bill.additional_charges_c) 
                              : bill.additional_charges_c;
                            if (Array.isArray(additionalCharges) && additionalCharges.length > 0) {
                              const total = additionalCharges.reduce((sum, charge) => sum + (typeof charge === 'number' ? charge : parseFloat(charge) || 0), 0);
                              return <>, Extras: ${total.toFixed(2)}</>;
                            }
                            return null;
                          } catch {
                            return null;
                          }
                        })()}
                      </p>
                    </div>
                    
                    <div>
                      <Badge 
                        variant={
                          bill.payment_status_c === "Paid" ? "success" :
                          bill.payment_status_c === "Overdue" ? "error" :
                          "pending"
                        }
                      >
                        {bill.payment_status_c}
                      </Badge>
                      {bill.payment_method_c && (
                        <p className="text-xs text-gray-600 mt-1">{bill.payment_method_c}</p>
                      )}
                    </div>
                    
<div className="flex items-center space-x-2">
                      {(bill.paymentStatus === "Pending" || bill.paymentStatus === "Partial") && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleProcessPayment(bill)}
                        >
                          <ApperIcon name="CreditCard" size={14} className="mr-1" />
                          Pay
                        </Button>
                      )}
                      
                      {bill.paymentStatus === "Paid" && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleProcessRefund(bill)}
                        >
                          <ApperIcon name="RotateCcw" size={14} className="mr-1" />
                          Refund
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddAdjustment(bill)}
                      >
                        <ApperIcon name="Edit" size={14} className="mr-1" />
                        Adjust
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printInvoice(bill)}
                      >
                        <ApperIcon name="Printer" size={14} className="mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
</div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && billToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Process Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ApperIcon name="X" size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Guest: <span className="font-medium">{billToUpdate.guestName}</span>
              </p>
              <p className="text-gray-600 mb-2">
                Invoice: <span className="font-medium">{billToUpdate.invoiceNumber}</span>
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Total Amount:</span>
                  <span className="font-semibold">${billToUpdate.totalAmount.toFixed(2)}</span>
                </div>
                {billToUpdate.paymentHistory && billToUpdate.paymentHistory.length > 0 && (
                  <>
                    <div className="flex justify-between mb-1">
                      <span>Paid:</span>
                      <span>${billToUpdate.paymentHistory.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-primary-600">
                      <span>Balance Due:</span>
                      <span>${(billToUpdate.totalAmount - billToUpdate.paymentHistory.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">Select payment method:</p>
            
            <div className="grid grid-cols-1 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method}
                  variant="outline"
                  onClick={() => handlePaymentUpdate(method)}
                  className="justify-start"
                >
                  <ApperIcon 
                    name={
                      method === "Cash" ? "Banknote" :
                      method === "Credit Card" ? "CreditCard" :
                      method === "Debit Card" ? "CreditCard" :
                      method === "Bank Transfer" ? "Building2" :
                      method === "Check" ? "FileText" :
                      method === "Digital Wallet" ? "Smartphone" : "Building2"
                    } 
                    size={16} 
                    className="mr-2" 
                  />
                  {method}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && billToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Process Refund
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ApperIcon name="X" size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Invoice: <span className="font-medium">{billToUpdate.invoiceNumber}</span>
              </p>
              <p className="text-gray-600 mb-2">
                Guest: <span className="font-medium">{billToUpdate.guestName}</span>
              </p>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Total Paid:</span>
                  <span className="font-semibold">
                    ${(billToUpdate.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Previous Refunds:</span>
                  <span>${(billToUpdate.refunds || []).reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <FormField
                label="Refund Amount"
                type="number"
                value={refundData.amount}
                onChange={(e) => setRefundData(prev => ({ ...prev, amount: e.target.value }))}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
              
              <FormField
                label="Refund Reason"
                value={refundData.reason}
                onChange={(e) => setRefundData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for refund"
                required
              />
              
              <FormField
                label="Refund Method"
                type="select"
                value={refundData.method}
                onChange={(e) => setRefundData(prev => ({ ...prev, method: e.target.value }))}
                required
              >
                <option value="">Select method</option>
                <option value="Original Payment Method">Original Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
              </FormField>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowRefundModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRefundSubmit}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Process Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && billToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Adjustment
              </h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ApperIcon name="X" size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Invoice: <span className="font-medium">{billToUpdate.invoiceNumber}</span>
              </p>
              <p className="text-gray-600 mb-2">
                Current Total: <span className="font-medium">${billToUpdate.totalAmount.toFixed(2)}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              <FormField
                label="Adjustment Type"
                type="select"
                value={adjustmentData.type}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <option value="discount">Discount</option>
                <option value="fee">Additional Fee</option>
                <option value="correction">Correction</option>
              </FormField>
              
              <FormField
                label="Amount"
                type="number"
                value={adjustmentData.amount}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
              
              <FormField
                label="Reason"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for adjustment"
                required
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowAdjustmentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustmentSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Apply Adjustment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Settings Modal */}
      {showTaxSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tax Settings
              </h3>
              <button
                onClick={() => setShowTaxSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ApperIcon name="X" size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <FormField
                label="Default Tax Rate (%)"
                type="number"
                value={taxSettings.defaultRate}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultRate: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="100"
                step="0.1"
              />
              
              <FormField
                label="Tax Name"
                value={taxSettings.taxName}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, taxName: e.target.value }))}
                placeholder="Sales Tax, VAT, etc."
              />
              
              <FormField
                label="Tax Registration Number"
                value={taxSettings.taxNumber}
                onChange={(e) => setTaxSettings(prev => ({ ...prev, taxNumber: e.target.value }))}
                placeholder="Tax registration number"
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowTaxSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, taxRate: taxSettings.defaultRate }));
                    toast.success("Tax settings updated!");
                    setShowTaxSettings(false);
                  }}
                  className="btn-gradient"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;