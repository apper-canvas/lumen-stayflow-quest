import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import reservationService from "@/services/api/reservationService";
import ApperIcon from "@/components/ApperIcon";
import ReservationForm from "@/components/organisms/ReservationForm";
import SearchBar from "@/components/molecules/SearchBar";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const Reservations = () => {
const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [bookingType, setBookingType] = useState("individual"); // individual, group, corporate
  const [showModificationHistory, setShowModificationHistory] = useState(null);
  const [groupFilter, setGroupFilter] = useState("all");
  const [corporateFilter, setCorporateFilter] = useState("all");
  useEffect(() => {
    loadReservations();
  }, []);

useEffect(() => {
    filterReservations();
  }, [reservations, searchQuery, statusFilter, groupFilter, corporateFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reservationService.getAll();
      setReservations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const filterReservations = () => {
    let filtered = [...reservations];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(reservation => 
        reservation.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by group bookings
    if (groupFilter === "group") {
      filtered = filtered.filter(reservation => reservation.isGroupBooking);
    } else if (groupFilter === "individual") {
      filtered = filtered.filter(reservation => !reservation.isGroupBooking);
    }

    // Filter by corporate accounts
    if (corporateFilter === "corporate") {
      filtered = filtered.filter(reservation => reservation.corporateAccount);
    } else if (corporateFilter === "individual") {
      filtered = filtered.filter(reservation => !reservation.corporateAccount);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reservation =>
        reservation.guestName.toLowerCase().includes(query) ||
        reservation.roomNumber.toString().includes(query) ||
        reservation.Id.toString().includes(query) ||
        (reservation.groupId && reservation.groupId.toLowerCase().includes(query)) ||
        (reservation.corporateAccount?.companyName && 
         reservation.corporateAccount.companyName.toLowerCase().includes(query))
      );
    }

    // Sort by check-in date
    filtered.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

    setFilteredReservations(filtered);
  };

  const handleCreateReservation = () => {
    setSelectedReservation(null);
    setShowForm(true);
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowForm(true);
  };

  const handleDeleteReservation = async (reservation) => {
const result = window.confirm(
      "Are you sure you want to cancel this reservation?\n\n" +
      "Please note:\n" +
      "• Cancellation fees may apply based on the cancellation policy\n" +
      "• Refunds will be processed according to the policy terms"
    );
    
    if (result) {
      try {
        const cancellationReason = prompt("Please provide a reason for cancellation:");
        if (cancellationReason !== null) {
          // Calculate refund based on cancellation policy
          const refundAmount = calculateRefund(reservation);
          
          await reservationService.cancelWithRefund(
            reservation.Id, 
            cancellationReason,
            refundAmount
          );
          
          toast.success(
            `Reservation cancelled successfully! ${refundAmount > 0 ? `Refund of $${refundAmount} will be processed.` : ''}`
          );
          loadReservations();
        }
      } catch (error) {
        toast.error("Failed to cancel reservation");
      }
    }

    function calculateRefund(reservation) {
      const checkInDate = new Date(reservation.checkIn);
      const now = new Date();
      const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
      
      // Standard refund policy
      if (daysUntilCheckIn > 7) return reservation.totalAmount * 0.9; // 90% refund
      if (daysUntilCheckIn > 3) return reservation.totalAmount * 0.5; // 50% refund
      if (daysUntilCheckIn > 0) return reservation.totalAmount * 0.25; // 25% refund
      return 0; // No refund for same-day cancellation
    }
  };

  const handleFormSubmit = (reservation) => {
    setShowForm(false);
    setSelectedReservation(null);
    loadReservations();
  };

  const handleCheckIn = async (reservation) => {
    try {
      await reservationService.update(reservation.Id, {
        ...reservation,
        status: "Checked In"
      });
      toast.success("Guest checked in successfully!");
      loadReservations();
    } catch (error) {
      toast.error("Failed to check in guest");
    }
  };

  const handleCheckOut = async (reservation) => {
    try {
      await reservationService.update(reservation.Id, {
        ...reservation,
        status: "Checked Out"
      });
      toast.success("Guest checked out successfully!");
      loadReservations();
    } catch (error) {
      toast.error("Failed to check out guest");
    }
};

  const handleViewGroup = (reservation) => {
    if (reservation.groupId) {
      // Filter reservations by group ID to show all related bookings
      const groupReservations = reservations.filter(r => r.groupId === reservation.groupId);
      
      // Create a summary of the group booking
      const groupSummary = {
        groupId: reservation.groupId,
        totalRooms: groupReservations.length,
        totalGuests: groupReservations.reduce((sum, r) => sum + (r.guestCount || 1), 0),
        checkInDate: reservation.checkIn,
        checkOutDate: reservation.checkOut,
        reservations: groupReservations
      };

      // Show group details in a modal or alert for now
      const message = `Group Booking Details:\n\n` +
        `Group ID: ${groupSummary.groupId}\n` +
        `Total Rooms: ${groupSummary.totalRooms}\n` +
        `Total Guests: ${groupSummary.totalGuests}\n` +
        `Check-in: ${format(new Date(groupSummary.checkInDate), "MMM d, yyyy")}\n` +
        `Check-out: ${format(new Date(groupSummary.checkOutDate), "MMM d, yyyy")}\n\n` +
        `Rooms:\n${groupSummary.reservations.map(r => 
          `• Room ${r.roomNumber} - ${r.guestName}`
        ).join('\n')}`;

      alert(message);
    }
  };
  if (loading) return <Loading />;
  if (error) return <Error message="Failed to load reservations" description={error} onRetry={loadReservations} />;

  if (showForm) {
    return (
<div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedReservation ? "Edit Reservation" : 
               bookingType === "group" ? "New Group Booking" :
               bookingType === "corporate" ? "New Corporate Booking" : 
               "New Reservation"}
            </h1>
            <p className="text-gray-600">
              {selectedReservation ? "Update reservation details" : 
               bookingType === "group" ? "Create a group booking with multiple rooms" :
               bookingType === "corporate" ? "Create a corporate account booking" :
               "Create a new reservation for a guest"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <ReservationForm
            reservation={selectedReservation}
            bookingType={bookingType}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setBookingType("individual");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-600">Manage hotel reservations and bookings</p>
        </div>
        <Button 
          onClick={handleCreateReservation}
          className="btn-gradient"
        >
          <ApperIcon name="Plus" size={16} className="mr-2" />
          New Reservation
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by guest name, room number, or reservation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
<div className="flex flex-wrap gap-4">
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked in">Checked In</option>
                <option value="checked out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            <div className="sm:w-48">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Bookings</option>
                <option value="individual">Individual</option>
                <option value="group">Group Bookings</option>
              </select>
            </div>
            
            <div className="sm:w-48">
              <select
                value={corporateFilter}
                onChange={(e) => setCorporateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Accounts</option>
                <option value="individual">Individual</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {filteredReservations.length === 0 ? (
          <Empty
            icon="Calendar"
            title="No reservations found"
            description={
              searchQuery || statusFilter !== "all"
                ? "No reservations match your current filters. Try adjusting your search criteria."
                : "There are no reservations yet. Create your first reservation to get started."
            }
            actionLabel={searchQuery || statusFilter !== "all" ? undefined : "Create First Reservation"}
            onAction={searchQuery || statusFilter !== "all" ? undefined : handleCreateReservation}
          />
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                <div>Guest</div>
                <div>Room</div>
                <div>Check-in</div>
                <div>Check-out</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
{filteredReservations.map((reservation) => (
                <div key={reservation.Id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{reservation.guestName}</p>
                        {reservation.isGroupBooking && (
                          <Badge variant="info" size="sm">
                            <ApperIcon name="Users" size={12} className="mr-1" />
                            Group
                          </Badge>
                        )}
                        {reservation.corporateAccount && (
                          <Badge variant="secondary" size="sm">
                            <ApperIcon name="Building2" size={12} className="mr-1" />
                            Corporate
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">ID: {reservation.Id}</p>
                      {reservation.groupId && (
                        <p className="text-xs text-blue-600">Group: {reservation.groupId}</p>
                      )}
                      {reservation.corporateAccount && (
                        <p className="text-xs text-purple-600">{reservation.corporateAccount.companyName}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">Room {reservation.roomNumber}</p>
                      <p className="text-sm text-gray-600">{reservation.roomType}</p>
                    </div>
                    
<div>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          const checkInDate = new Date(reservation.checkIn);
                          return !isNaN(checkInDate.getTime()) 
                            ? format(checkInDate, "MMM d, yyyy")
                            : "Invalid date";
                        })()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const checkInDate = new Date(reservation.checkIn);
                          return !isNaN(checkInDate.getTime()) 
                            ? format(checkInDate, "h:mm a")
                            : "Invalid time";
                        })()}
                      </p>
                    </div>
                    
                    <div>
<p className="font-medium text-gray-900">
                        {(() => {
                          const checkOutDate = new Date(reservation.checkOut);
                          return !isNaN(checkOutDate.getTime()) 
                            ? format(checkOutDate, "MMM d, yyyy")
                            : "Invalid date";
                        })()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const checkOutDate = new Date(reservation.checkOut);
                          return !isNaN(checkOutDate.getTime()) 
                            ? format(checkOutDate, "h:mm a")
                            : "Invalid time";
                        })()}
                      </p>
                    </div>
                    <div>
                      <Badge 
                        variant={
                          reservation.status === "Confirmed" ? "confirmed" :
                          reservation.status === "Checked In" ? "checkedin" :
                          reservation.status === "Checked Out" ? "success" :
                          reservation.status === "Cancelled" ? "cancelled" :
                          "pending"
                        }
                      >
                        {reservation.status}
                      </Badge>
                    </div>
                    
<div className="flex items-center space-x-2 flex-wrap">
                      {reservation.status === "Confirmed" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleCheckIn(reservation)}
                        >
                          <ApperIcon name="LogIn" size={14} className="mr-1" />
                          Check In
                        </Button>
                      )}
                      
                      {reservation.status === "Checked In" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(reservation)}
                        >
                          <ApperIcon name="LogOut" size={14} className="mr-1" />
                          Check Out
                        </Button>
                      )}
                      
                      {reservation.modificationHistory && reservation.modificationHistory.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowModificationHistory(reservation)}
                        >
                          <ApperIcon name="History" size={14} className="mr-1" />
                          History
                        </Button>
                      )}
                      
                      {reservation.isGroupBooking && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewGroup(reservation)}
                        >
                          <ApperIcon name="Users" size={14} className="mr-1" />
                          View Group
                        </Button>
                      )}
                      
                      {reservation.status !== "Cancelled" && reservation.status !== "Checked Out" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditReservation(reservation)}
                          >
                            <ApperIcon name="Edit" size={14} />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReservation(reservation)}
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                          >
                            <ApperIcon name="Trash2" size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reservations;