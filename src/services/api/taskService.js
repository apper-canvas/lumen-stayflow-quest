class TaskService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'task_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Title__c"}},
          {"field": {"Name": "Description__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Assigned_To__c"}},
          {"field": {"Name": "Priority__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Estimated_Duration__c"}},
          {"field": {"Name": "Scheduled_Date__c"}}
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
      console.error("Error fetching tasks:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Title__c"}},
          {"field": {"Name": "Description__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Assigned_To__c"}},
          {"field": {"Name": "Priority__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Estimated_Duration__c"}},
          {"field": {"Name": "Scheduled_Date__c"}}
        ]
      };
      
      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response?.data) {
        throw new Error("Task not found");
      }
      
      return this.transformFromDB(response.data);
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error);
      throw new Error("Task not found");
    }
  }

  async create(taskData) {
    try {
      const params = {
        records: [this.transformToDB(taskData)]
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
      console.error("Error creating task:", error?.response?.data?.message || error);
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
      console.error("Error updating task:", error?.response?.data?.message || error);
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
      console.error("Error deleting task:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async getByRoom(roomId) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Title__c"}},
          {"field": {"Name": "Description__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Assigned_To__c"}},
          {"field": {"Name": "Priority__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Estimated_Duration__c"}},
          {"field": {"Name": "Scheduled_Date__c"}}
        ],
        where: [{"FieldName": "Room__c", "Operator": "EqualTo", "Values": [parseInt(roomId)]}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching tasks by room:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getByStatus(status) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Title__c"}},
          {"field": {"Name": "Description__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Assigned_To__c"}},
          {"field": {"Name": "Priority__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Estimated_Duration__c"}},
          {"field": {"Name": "Scheduled_Date__c"}}
        ],
        where: [{"FieldName": "Status__c", "Operator": "EqualTo", "Values": [status]}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching tasks by status:", error?.response?.data?.message || error);
      return [];
    }
  }

  transformFromDB(record) {
    if (!record) return null;
    
    return {
      Id: record.Id,
      title: record.Title__c || '',
      description: record.Description__c || '',
      roomId: record.Room__c?.Id || record.Room__c || null,
      assignedTo: record.Assigned_To__c || '',
      priority: record.Priority__c || 'Medium',
      status: record.Status__c || 'Pending',
      estimatedDuration: record.Estimated_Duration__c || '',
      scheduledDate: record.Scheduled_Date__c || '',
      createdAt: record.Created_Date__c,
      updatedAt: record.Last_Modified_Date__c
    };
  }

  transformToDB(data) {
    const dbRecord = {};
    
    if (data.title !== undefined) dbRecord.Title__c = data.title;
    if (data.description !== undefined) dbRecord.Description__c = data.description;
    if (data.roomId !== undefined) dbRecord.Room__c = data.roomId ? parseInt(data.roomId) : null;
    if (data.assignedTo !== undefined) dbRecord.Assigned_To__c = data.assignedTo;
    if (data.priority !== undefined) dbRecord.Priority__c = data.priority;
    if (data.status !== undefined) dbRecord.Status__c = data.status;
    if (data.estimatedDuration !== undefined) dbRecord.Estimated_Duration__c = data.estimatedDuration;
    if (data.scheduledDate !== undefined) dbRecord.Scheduled_Date__c = data.scheduledDate;
    
    return dbRecord;
  }
}

export default new TaskService();