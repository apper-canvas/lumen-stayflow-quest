class ReservationService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'reservation_c';
  }

  async getAll() {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Guest_Name__c"}},
          {"field": {"Name": "Guest__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Check_In_Date__c"}},
          {"field": {"Name": "Check_Out_Date__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Total_Amount__c"}},
          {"field": {"Name": "Special_Requests__c"}},
          {"field": {"Name": "Group_ID__c"}},
          {"field": {"Name": "Is_Group_Booking__c"}},
          {"field": {"Name": "Corporate_Account__c"}}
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
      console.error("Error fetching reservations:", error?.response?.data?.message || error);
      return [];
    }
  }

  async getById(id) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Guest_Name__c"}},
          {"field": {"Name": "Guest__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Check_In_Date__c"}},
          {"field": {"Name": "Check_Out_Date__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Total_Amount__c"}},
          {"field": {"Name": "Special_Requests__c"}},
          {"field": {"Name": "Group_ID__c"}},
          {"field": {"Name": "Is_Group_Booking__c"}},
          {"field": {"Name": "Corporate_Account__c"}}
        ]
      };
      
      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response?.data) {
        throw new Error("Reservation not found");
      }
      
      return this.transformFromDB(response.data);
    } catch (error) {
      console.error(`Error fetching reservation ${id}:`, error?.response?.data?.message || error);
      throw new Error("Reservation not found");
    }
  }

  async create(reservationData) {
    try {
      // Handle group booking creation
      if (reservationData.isGroupBooking && reservationData.groupRooms) {
        const groupId = `GRP-${Date.now()}`;
        const groupReservations = [];
        
        for (const roomData of reservationData.groupRooms) {
          const record = this.transformToDB({
            ...reservationData,
            ...roomData,
            groupId,
            isGroupBooking: true
          });
          
          const params = {
            records: [record]
          };
          
          const response = await this.apperClient.createRecord(this.tableName, params);
          
          if (response.success && response.results) {
            const successful = response.results.filter(r => r.success);
            if (successful.length > 0) {
              groupReservations.push(this.transformFromDB(successful[0].data));
            }
          }
        }
        
        return groupReservations;
      }
      
      // Handle single reservation creation
      const params = {
        records: [this.transformToDB(reservationData)]
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
      console.error("Error creating reservation:", error?.response?.data?.message || error);
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
      console.error("Error updating reservation:", error?.response?.data?.message || error);
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
      console.error("Error deleting reservation:", error?.response?.data?.message || error);
      throw error;
    }
  }

  async cancelWithRefund(id, cancellationReason, refundAmount = 0) {
    try {
      const reservation = await this.getById(id);
      
      // Calculate refund amount based on cancellation policy if not provided
      if (refundAmount === 0) {
        const checkInDate = new Date(reservation.checkIn);
        const now = new Date();
        const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
        
        // Simple cancellation policy logic
        if (daysUntilCheckIn >= 7) {
          refundAmount = reservation.totalAmount; // Full refund
        } else if (daysUntilCheckIn >= 3) {
          refundAmount = reservation.totalAmount * 0.5; // 50% refund
        } else {
          refundAmount = 0; // No refund
        }
      }
      
      return this.update(id, {
        status: 'Cancelled',
        modificationReason: `Cancelled: ${cancellationReason}`,
        refundAmount
      });
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      throw error;
    }
  }

  async getGroupReservations(groupId) {
    try {
      const params = {
        fields: [
          {"field": {"Name": "Guest_Name__c"}},
          {"field": {"Name": "Guest__c"}},
          {"field": {"Name": "Room__c"}},
          {"field": {"Name": "Room_Number__c"}},
          {"field": {"Name": "Check_In_Date__c"}},
          {"field": {"Name": "Check_Out_Date__c"}},
          {"field": {"Name": "Status__c"}},
          {"field": {"Name": "Total_Amount__c"}},
          {"field": {"Name": "Special_Requests__c"}},
          {"field": {"Name": "Group_ID__c"}},
          {"field": {"Name": "Is_Group_Booking__c"}},
          {"field": {"Name": "Corporate_Account__c"}}
        ],
        where: [{"FieldName": "Group_ID__c", "Operator": "EqualTo", "Values": [groupId]}]
      };
      
      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(this.transformFromDB);
    } catch (error) {
      console.error("Error fetching group reservations:", error?.response?.data?.message || error);
      return [];
    }
  }

  transformFromDB(record) {
    if (!record) return null;
    
    return {
      Id: record.Id,
      guestName: record.Guest_Name__c || '',
      guestId: record.Guest__c?.Id || record.Guest__c || null,
      roomId: record.Room__c?.Id || record.Room__c || null,
      roomNumber: record.Room_Number__c || '',
      checkIn: record.Check_In_Date__c || '',
      checkOut: record.Check_Out_Date__c || '',
      status: record.Status__c || 'Pending',
      totalAmount: record.Total_Amount__c || 0,
      specialRequests: record.Special_Requests__c || '',
      groupId: record.Group_ID__c || null,
      isGroupBooking: record.Is_Group_Booking__c || false,
      corporateAccount: record.Corporate_Account__c ? {
        Id: record.Corporate_Account__c.Id || record.Corporate_Account__c,
        companyName: record.Corporate_Account__c.Company_Name__c || ''
      } : null,
      createdAt: record.Created_Date__c,
      modificationHistory: []
    };
  }

  transformToDB(data) {
    const dbRecord = {};
    
    if (data.guestName !== undefined) dbRecord.Guest_Name__c = data.guestName;
    if (data.guestId !== undefined) dbRecord.Guest__c = data.guestId;
    if (data.roomId !== undefined) dbRecord.Room__c = data.roomId;
    if (data.roomNumber !== undefined) dbRecord.Room_Number__c = data.roomNumber;
    if (data.checkIn !== undefined) dbRecord.Check_In_Date__c = data.checkIn;
    if (data.checkOut !== undefined) dbRecord.Check_Out_Date__c = data.checkOut;
    if (data.status !== undefined) dbRecord.Status__c = data.status;
    if (data.totalAmount !== undefined) dbRecord.Total_Amount__c = data.totalAmount;
    if (data.specialRequests !== undefined) dbRecord.Special_Requests__c = data.specialRequests;
    if (data.groupId !== undefined) dbRecord.Group_ID__c = data.groupId;
    if (data.isGroupBooking !== undefined) dbRecord.Is_Group_Booking__c = data.isGroupBooking;
    if (data.corporateAccount !== undefined) dbRecord.Corporate_Account__c = data.corporateAccount?.Id || data.corporateAccount;
    
    return dbRecord;
  }
}

export default new ReservationService();
export default new ReservationService();
export default new ReservationService();