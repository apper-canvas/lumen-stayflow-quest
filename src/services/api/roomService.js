class RoomService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'room_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Room_Type__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Nightly_Rate__c"}},
          {"field": {"Name": "Amenities__c"}},
          {"field": {"Name": "Notes__c"}},
          {"field": {"Name": "Last_Cleaned__c"}}
        ],
        orderBy: [{"fieldName": "Room_Number__c", "sorttype": "ASC"}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching rooms:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Room_Type__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Nightly_Rate__c"}},
          {"field": {"Name": "Amenities__c"}},
          {"field": {"Name": "Notes__c"}},
          {"field": {"Name": "Last_Cleaned__c"}}
        ]
      };
      
      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response?.data) {
        throw new Error("Room not found");
      }
      
      return this.transformFromDB(response.data);
    } catch (error) {
      console.error(`Error fetching room ${id}:`, error?.response?.data?.message || error);
      throw new Error("Room not found");
    }
  }

  async create(roomData) {
    try {
      const params = {
        records: [this.transformToDB(roomData)]
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
      console.error("Error creating room:", error?.response?.data?.message || error);
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
      console.error("Error updating room:", error?.response?.data?.message || error);
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
      console.error("Error deleting room:", error?.response?.data?.message || error);
      throw error;
    }
  }

  transformFromDB(record) {
    if (!record) return null;
    
    return {
      Id: record.Id,
      number: record.Room_Number__c || '',
      type: record.Room_Type__c || '',
      status: record.Status__c || 'Available',
      rate: record.Nightly_Rate__c || 0,
      amenities: record.Amenities__c ? record.Amenities__c.split(',').map(a => a.trim()) : [],
      notes: record.Notes__c || '',
      lastCleaned: record.Last_Cleaned__c || record.Created_Date__c
    };
  }

  transformToDB(data) {
    const dbRecord = {};
    
    if (data.number !== undefined) dbRecord.Room_Number__c = data.number;
    if (data.type !== undefined) dbRecord.Room_Type__c = data.type;
    if (data.status !== undefined) dbRecord.Status__c = data.status;
    if (data.rate !== undefined) dbRecord.Nightly_Rate__c = parseFloat(data.rate);
    if (data.amenities !== undefined) dbRecord.Amenities__c = Array.isArray(data.amenities) ? data.amenities.join(', ') : data.amenities;
    if (data.notes !== undefined) dbRecord.Notes__c = data.notes;
    if (data.lastCleaned !== undefined) dbRecord.Last_Cleaned__c = data.lastCleaned;
    
    return dbRecord;
  }
}

export default new RoomService();