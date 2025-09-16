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
    
    // Helper function to check if value is meaningful (not undefined, null, or empty string)
    const hasValue = (value) => value !== undefined && value !== null && value !== '' && String(value).trim() !== '';
    
    if (hasValue(data.firstName)) dbRecord.First_Name__c = data.firstName;
    if (hasValue(data.lastName)) dbRecord.Last_Name__c = data.lastName;
    if (hasValue(data.email)) dbRecord.Email__c = data.email;
    if (hasValue(data.phone)) dbRecord.Phone__c = data.phone;
    if (hasValue(data.idType)) dbRecord.ID_Type__c = data.idType;
    if (hasValue(data.idNumber)) dbRecord.ID_Number__c = data.idNumber;
    if (hasValue(data.address?.street)) dbRecord.Address_Street__c = data.address.street;
    if (hasValue(data.address?.city)) dbRecord.Address_City__c = data.address.city;
    if (hasValue(data.address?.state)) dbRecord.Address_State__c = data.address.state;
    if (hasValue(data.address?.zipCode)) dbRecord.Address_ZIP_Code__c = data.address.zipCode;
    if (hasValue(data.vipStatus)) dbRecord.VIP_Status__c = data.vipStatus;
    if (hasValue(data.loyaltyProgram?.tier)) dbRecord.Loyalty_Tier__c = data.loyaltyProgram.tier;
    if (hasValue(data.loyaltyProgram?.points)) dbRecord.Loyalty_Points__c = data.loyaltyProgram.points;
    if (hasValue(data.accountType)) dbRecord.Account_Type__c = data.accountType === 'corporate' ? 'Corporate' : 'Individual';
    if (hasValue(data.companyName)) dbRecord.Company_Name__c = data.companyName;
    if (hasValue(data.companyRegistration)) dbRecord.Company_Registration__c = data.companyRegistration;
    if (hasValue(data.taxId)) dbRecord.Tax_ID__c = data.taxId;
    if (hasValue(data.billingContact)) dbRecord.Billing_Contact__c = data.billingContact;
    if (hasValue(data.creditLimit)) dbRecord.Credit_Limit__c = data.creditLimit;
    if (hasValue(data.paymentTerms)) dbRecord.Payment_Terms__c = data.paymentTerms;
    if (hasValue(data.corporateDiscount)) dbRecord.Corporate_Discount__c = data.corporateDiscount;
    
    // Ensure at least one field is present to avoid "Each record must contain at least one field" error
    if (Object.keys(dbRecord).length === 0) {
      // Include firstName even if empty to satisfy API requirement
      dbRecord.First_Name__c = data.firstName || '';
    }
    
    return dbRecord;
  }
}

export default new GuestService();