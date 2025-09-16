class BillingService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'billing_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Guest_Name__c"}},
          {"field": {"Name": "Reservation__c"}},
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Room_Charges__c"}},
          {"field": {"Name": "Additional_Charges__c"}},
          {"field": {"Name": "Subtotal__c"}},
          {"field": {"Name": "Tax_Rate__c"}},
          {"field": {"Name": "Tax_Amount__c"}},
          {"field": {"Name": "Total_Amount__c"}},
          {"field": {"Name": "Payment_Status__c"}},
          {"field": {"Name": "Payment_Method__c"}},
          {"field": {"Name": "Invoice_Number__c"}},
          {"field": {"Name": "Notes__c"}}
        ],
        orderBy: [{"fieldName": "Created_Date__c", "sorttype": "DESC"}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching bills:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Guest_Name__c"}},
          {"field": {"Name": "Reservation__c"}},
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Room_Charges__c"}},
          {"field": {"Name": "Additional_Charges__c"}},
          {"field": {"Name": "Subtotal__c"}},
          {"field": {"Name": "Tax_Rate__c"}},
          {"field": {"Name": "Tax_Amount__c"}},
          {"field": {"Name": "Total_Amount__c"}},
          {"field": {"Name": "Payment_Status__c"}},
          {"field": {"Name": "Payment_Method__c"}},
          {"field": {"Name": "Invoice_Number__c"}},
          {"field": {"Name": "Notes__c"}}
        ]
      };
      
      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response?.data) {
        throw new Error("Bill not found");
      }
      
      return this.transformFromDB(response.data);
    } catch (error) {
      console.error(`Error fetching bill ${id}:`, error?.response?.data?.message || error);
      throw new Error("Bill not found");
    }
  }

  async create(billData) {
    try {
      // Calculate taxes if not provided
      const taxRate = billData.taxRate || this.getDefaultTaxRate();
      const subtotal = (billData.roomCharges || 0) + 
                      (Array.isArray(billData.additionalCharges) 
                        ? billData.additionalCharges.reduce((sum, charge) => sum + charge, 0) 
                        : 0);
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;
      
      const billWithCalculations = {
        ...billData,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        invoiceNumber: this.generateInvoiceNumber(),
        paymentStatus: billData.paymentStatus || 'Pending'
      };
      
      const params = {
        records: [this.transformToDB(billWithCalculations)]
      };
      
      const response = await this.apperClient.createRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.message) throw new Error(record.message);
          });
        }
        
        return successful.length > 0 ? this.transformFromDB(successful[0].data) : null;
      }
    } catch (error) {
      console.error("Error creating bill:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const params = {
        records: [{
          Id: id,
          ...this.transformToDB(updateData)
        }]
      };
      
      const response = await this.apperClient.updateRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.message) throw new Error(record.message);
          });
        }
        
        return successful.length > 0 ? this.transformFromDB(successful[0].data) : null;
      }
    } catch (error) {
      console.error("Error updating bill:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const params = { 
        RecordIds: [id]
      };
      
      const response = await this.apperClient.deleteRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.message) throw new Error(record.message);
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting bill:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async processPayment(id, paymentData) {
    try {
      const bill = await this.getById(id);
      
      const totalPaid = (paymentData.amount || bill.totalAmount);
      const paymentStatus = totalPaid >= bill.totalAmount ? 'Paid' : 
                           totalPaid > 0 ? 'Partial' : 'Pending';
      
      return this.update(id, {
        paymentStatus,
        paymentMethod: paymentData.method,
        paidAt: paymentStatus === 'Paid' ? new Date().toISOString() : bill.paidAt
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  }

  async processRefund(id, refundData) {
    try {
      return this.update(id, {
        paymentStatus: 'Refunded',
        refundedAmount: refundData.amount,
        refundReason: refundData.reason
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }

  async addAdjustment(id, adjustmentData) {
    try {
      const bill = await this.getById(id);
      
      const adjustmentAmount = adjustmentData.type === 'discount' ? -adjustmentData.amount : adjustmentData.amount;
      const newSubtotal = bill.subtotal + adjustmentAmount;
      const taxAmount = newSubtotal * (bill.taxRate / 100);
      const totalAmount = newSubtotal + taxAmount;
      
      return this.update(id, {
        subtotal: newSubtotal,
        taxAmount,
        totalAmount,
        adjustmentReason: adjustmentData.reason
      });
    } catch (error) {
      console.error("Error adding adjustment:", error);
      throw error;
    }
  }

  getDefaultTaxRate() {
    return 10; // 10% default tax rate
  }

  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `INV-${year}${month}${day}-${timestamp}`;
  }

  async getTaxReport(startDate, endDate) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Tax_Amount__c"}},
          {"field": {"Name": "Subtotal__c"}},
          {"field": {"Name": "Tax_Rate__c"}},
          {"field": {"Name": "Total_Amount__c"}},
          {"field": {"Name": "Guest_Name__c"}},
          {"field": {"Name": "Invoice_Number__c"}}
        ],
        where: [
          {"FieldName": "Payment_Status__c", "Operator": "EqualTo", "Values": ["Paid"]},
          {"FieldName": "Created_Date__c", "Operator": "GreaterThanOrEqualTo", "Values": [startDate]},
          {"FieldName": "Created_Date__c", "Operator": "LessThanOrEqualTo", "Values": [endDate]}
        ]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return {
          totalTaxCollected: 0,
          totalRevenue: 0,
          billCount: 0,
          averageTaxRate: 0,
          bills: []
        };
      }

      const bills = (response.data || []).map(this.transformFromDB);
      
      return {
        totalTaxCollected: bills.reduce((sum, bill) => sum + (bill.taxAmount || 0), 0),
        totalRevenue: bills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0),
        billCount: bills.length,
        averageTaxRate: bills.length > 0 ? 
          bills.reduce((sum, bill) => sum + (bill.taxRate || 0), 0) / bills.length : 0,
        bills: bills.map(bill => ({
          Id: bill.Id,
          invoiceNumber: bill.invoiceNumber,
          guestName: bill.guestName,
          subtotal: bill.subtotal,
          taxRate: bill.taxRate,
          taxAmount: bill.taxAmount,
          totalAmount: bill.totalAmount,
          createdAt: bill.createdAt
        }))
      };
    } catch (error) {
      console.error("Error generating tax report:", error?.response?.data?.message || error);
      return {
        totalTaxCollected: 0,
        totalRevenue: 0,
        billCount: 0,
        averageTaxRate: 0,
        bills: []
      };
    }
  }

  transformFromDB(record) {
    if (!record) return null;
    
    return {
      Id: record.Id,
      guestName: record.Guest_Name__c || '',
      reservationId: record.Reservation__c?.Id || record.Reservation__c || null,
      roomNumber: record.Room_Number__c || '',
      roomCharges: record.Room_Charges__c || 0,
      additionalCharges: record.Additional_Charges__c ? 
        (typeof record.Additional_Charges__c === 'string' ? 
          record.Additional_Charges__c.split(',').map(c => parseFloat(c.trim())).filter(c => !isNaN(c)) :
          [record.Additional_Charges__c]) : [],
      subtotal: record.Subtotal__c || 0,
      taxRate: record.Tax_Rate__c || 10,
      taxAmount: record.Tax_Amount__c || 0,
      totalAmount: record.Total_Amount__c || 0,
      paymentStatus: record.Payment_Status__c || 'Pending',
      paymentMethod: record.Payment_Method__c || '',
      invoiceNumber: record.Invoice_Number__c || '',
      notes: record.Notes__c || '',
      createdAt: record.Created_Date__c,
      paymentHistory: [],
      adjustments: [],
      refunds: []
    };
  }

  transformToDB(data) {
    const dbRecord = {};
    
    if (data.guestName !== undefined) dbRecord.Guest_Name__c = data.guestName;
    if (data.reservationId !== undefined) dbRecord.Reservation__c = data.reservationId;
    if (data.roomNumber !== undefined) dbRecord.Room_Number__c = data.roomNumber;
    if (data.roomCharges !== undefined) dbRecord.Room_Charges__c = data.roomCharges;
    if (data.additionalCharges !== undefined) dbRecord.Additional_Charges__c = 
      Array.isArray(data.additionalCharges) ? data.additionalCharges.join(',') : data.additionalCharges;
    if (data.subtotal !== undefined) dbRecord.Subtotal__c = data.subtotal;
    if (data.taxRate !== undefined) dbRecord.Tax_Rate__c = data.taxRate;
    if (data.taxAmount !== undefined) dbRecord.Tax_Amount__c = data.taxAmount;
    if (data.totalAmount !== undefined) dbRecord.Total_Amount__c = data.totalAmount;
    if (data.paymentStatus !== undefined) dbRecord.Payment_Status__c = data.paymentStatus;
    if (data.paymentMethod !== undefined) dbRecord.Payment_Method__c = data.paymentMethod;
    if (data.invoiceNumber !== undefined) dbRecord.Invoice_Number__c = data.invoiceNumber;
    if (data.notes !== undefined) dbRecord.Notes__c = data.notes;
    
    return dbRecord;
  }
}

export default new BillingService();