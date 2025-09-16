class GuestService {
class GuestService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'guest_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "First_Name__c"}},
          {"field": {"Name": "Last_Name__c"}},
          {"field": {"Name": "Email__c"}},
          {"field": {"Name": "Phone__c"}},
          {"field": {"Name": "ID_Type__c"}},
          {"field": {"Name": "ID_Number__c"}},
          {"field": {"Name": "Address_Street__c"}},
          {"field": {"Name": "Address_City__c"}},
          {"field": {"Name": "Address_State__c"}},
          {"field": {"Name": "Address_ZIP_Code__c"}},
          {"field": {"Name": "VIP_Status__c"}},
          {"field": {"Name": "Loyalty_Tier__c"}},
          {"field": {"Name": "Loyalty_Points__c"}},
          {"field": {"Name": "Account_Type__c"}},
          {"field": {"Name": "Company_Name__c"}},
          {"field": {"Name": "Company_Registration__c"}},
          {"field": {"Name": "Tax_ID__c"}},
          {"field": {"Name": "Billing_Contact__c"}},
          {"field": {"Name": "Credit_Limit__c"}},
          {"field": {"Name": "Payment_Terms__c"}},
          {"field": {"Name": "Corporate_Discount__c"}}
        ],
        orderBy: [{"fieldName": "Last_Name__c", "sorttype": "ASC"}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching guests:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "First_Name__c"}},
          {"field": {"Name": "Last_Name__c"}},
          {"field": {"Name": "Email__c"}},
          {"field": {"Name": "Phone__c"}},
          {"field": {"Name": "ID_Type__c"}},
          {"field": {"Name": "ID_Number__c"}},
          {"field": {"Name": "Address_Street__c"}},
          {"field": {"Name": "Address_City__c"}},
          {"field": {"Name": "Address_State__c"}},
          {"field": {"Name": "Address_ZIP_Code__c"}},
          {"field": {"Name": "VIP_Status__c"}},
          {"field": {"Name": "Loyalty_Tier__c"}},
          {"field": {"Name": "Loyalty_Points__c"}},
          {"field": {"Name": "Account_Type__c"}},
          {"field": {"Name": "Company_Name__c"}},
          {"field": {"Name": "Company_Registration__c"}},
          {"field": {"Name": "Tax_ID__c"}},
          {"field": {"Name": "Billing_Contact__c"}},
          {"field": {"Name": "Credit_Limit__c"}},
          {"field": {"Name": "Payment_Terms__c"}},
          {"field": {"Name": "Corporate_Discount__c"}}
        ]
      };
      
      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response?.data) {
        throw new Error("Guest not found");
      }
      
      return this.transformFromDB(response.data);
    } catch (error) {
      console.error(`Error fetching guest ${id}:`, error?.response?.data?.message || error);
      throw new Error("Guest not found");
    }
  }

  async create(guestData) {
    try {
      const params = {
        records: [this.transformToDB(guestData)]
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
      console.error("Error creating guest:", error?.response?.data?.message || error);
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
      console.error("Error updating guest:", error?.response?.data?.message || error);
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
      console.error("Error deleting guest:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async getCorporateAccounts() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "First_Name__c"}},
          {"field": {"Name": "Last_Name__c"}},
          {"field": {"Name": "Email__c"}},
          {"field": {"Name": "Phone__c"}},
          {"field": {"Name": "Company_Name__c"}},
          {"field": {"Name": "Account_Type__c"}}
        ],
        where: [{"FieldName": "Account_Type__c", "Operator": "EqualTo", "Values": ["Corporate"]}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching corporate accounts:", error?.response?.data?.message || error);
      return [];
    }
  }

  transformFromDB(record) {
    if (!record) return null;
    
    return {
      Id: record.Id,
      firstName: record.First_Name__c || '',
      lastName: record.Last_Name__c || '',
      email: record.Email__c || '',
      phone: record.Phone__c || '',
      idType: record.ID_Type__c || '',
      idNumber: record.ID_Number__c || '',
      address: {
        street: record.Address_Street__c || '',
        city: record.Address_City__c || '',
        state: record.Address_State__c || '',
        zipCode: record.Address_ZIP_Code__c || ''
      },
      vipStatus: record.VIP_Status__c || false,
      loyaltyProgram: {
        tier: record.Loyalty_Tier__c || '',
        points: record.Loyalty_Points__c || 0,
        joinDate: record.Created_Date__c || ''
      },
      accountType: record.Account_Type__c === 'Corporate' ? 'corporate' : 'individual',
      companyName: record.Company_Name__c || '',
      companyRegistration: record.Company_Registration__c || '',
      taxId: record.Tax_ID__c || '',
      billingContact: record.Billing_Contact__c || '',
      creditLimit: record.Credit_Limit__c || 0,
      paymentTerms: record.Payment_Terms__c || 'net30',
      corporateDiscount: record.Corporate_Discount__c || 0,
      createdAt: record.Created_Date__c,
      stayHistory: []
    };
  }

  transformToDB(data) {
    const dbRecord = {};
    
    if (data.firstName !== undefined) dbRecord.First_Name__c = data.firstName;
    if (data.lastName !== undefined) dbRecord.Last_Name__c = data.lastName;
    if (data.email !== undefined) dbRecord.Email__c = data.email;
    if (data.phone !== undefined) dbRecord.Phone__c = data.phone;
    if (data.idType !== undefined) dbRecord.ID_Type__c = data.idType;
    if (data.idNumber !== undefined) dbRecord.ID_Number__c = data.idNumber;
    if (data.address?.street !== undefined) dbRecord.Address_Street__c = data.address.street;
    if (data.address?.city !== undefined) dbRecord.Address_City__c = data.address.city;
    if (data.address?.state !== undefined) dbRecord.Address_State__c = data.address.state;
    if (data.address?.zipCode !== undefined) dbRecord.Address_ZIP_Code__c = data.address.zipCode;
    if (data.vipStatus !== undefined) dbRecord.VIP_Status__c = data.vipStatus;
    if (data.loyaltyProgram?.tier !== undefined) dbRecord.Loyalty_Tier__c = data.loyaltyProgram.tier;
    if (data.loyaltyProgram?.points !== undefined) dbRecord.Loyalty_Points__c = data.loyaltyProgram.points;
    if (data.accountType !== undefined) dbRecord.Account_Type__c = data.accountType === 'corporate' ? 'Corporate' : 'Individual';
    if (data.companyName !== undefined) dbRecord.Company_Name__c = data.companyName;
    if (data.companyRegistration !== undefined) dbRecord.Company_Registration__c = data.companyRegistration;
    if (data.taxId !== undefined) dbRecord.Tax_ID__c = data.taxId;
    if (data.billingContact !== undefined) dbRecord.Billing_Contact__c = data.billingContact;
    if (data.creditLimit !== undefined) dbRecord.Credit_Limit__c = data.creditLimit;
    if (data.paymentTerms !== undefined) dbRecord.Payment_Terms__c = data.paymentTerms;
    if (data.corporateDiscount !== undefined) dbRecord.Corporate_Discount__c = data.corporateDiscount;
    
    return dbRecord;
}
}

export default new GuestService();