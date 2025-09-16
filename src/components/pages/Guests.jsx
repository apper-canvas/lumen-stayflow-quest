import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import guestService from "@/services/api/guestService";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import FormField from "@/components/molecules/FormField";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Empty from "@/components/ui/Empty";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";

const Guests = () => {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idType: "",
    idNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: ""
    },
    preferences: [],
    vipStatus: false,
    loyaltyProgram: {
      tier: "",
      points: 0,
      joinDate: ""
    },
    // Corporate account fields
    accountType: "individual",
    companyName: "",
    companyRegistration: "",
    taxId: "",
    billingContact: "",
    creditLimit: 0,
    paymentTerms: "net30",
    corporateDiscount: 0
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadGuests();
  }, []);

const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  
  useEffect(() => {
    filterGuests();
  }, [guests, searchQuery, accountTypeFilter]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await guestService.getAll();
      setGuests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterGuests = () => {
let filtered = [...guests];

    // Filter by account type
    if (accountTypeFilter !== "all") {
      filtered = filtered.filter(guest => 
        guest.accountType === accountTypeFilter
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(guest =>
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(query) ||
        guest.email.toLowerCase().includes(query) ||
        guest.phone.includes(query) ||
        (guest.companyName && guest.companyName.toLowerCase().includes(query))
      );
    }

    // Sort by last name, then first name
    filtered.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredGuests(filtered);
  };

  const resetForm = () => {
setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      idType: "",
      idNumber: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: ""
      },
      preferences: [],
      vipStatus: false,
      loyaltyProgram: {
        tier: "",
        points: 0,
        joinDate: ""
      },
      accountType: "individual",
      companyName: "",
      companyRegistration: "",
      taxId: "",
      billingContact: "",
      creditLimit: 0,
      paymentTerms: "net30",
      corporateDiscount: 0
    });
    setFormErrors({});
  };

  const handleCreateGuest = () => {
    resetForm();
    setSelectedGuest(null);
    setShowForm(true);
  };

  const handleEditGuest = (guest) => {
setFormData({
      firstName: guest.firstName || "",
      lastName: guest.lastName || "",
      email: guest.email || "",
      phone: guest.phone || "",
      idType: guest.idType || "",
      idNumber: guest.idNumber || "",
      address: {
        street: guest.address?.street || "",
        city: guest.address?.city || "",
        state: guest.address?.state || "",
        zipCode: guest.address?.zipCode || ""
      },
      preferences: guest.preferences || [],
      vipStatus: guest.vipStatus || false,
      loyaltyProgram: {
        tier: guest.loyaltyProgram?.tier || "",
        points: guest.loyaltyProgram?.points || 0,
        joinDate: guest.loyaltyProgram?.joinDate || ""
      },
      accountType: guest.accountType || "individual",
      companyName: guest.companyName || "",
      companyRegistration: guest.companyRegistration || "",
      taxId: guest.taxId || "",
      billingContact: guest.billingContact || "",
      creditLimit: guest.creditLimit || 0,
      paymentTerms: guest.paymentTerms || "net30",
      corporateDiscount: guest.corporateDiscount || 0
    });
    setSelectedGuest(guest);
    setFormErrors({});
    setShowForm(true);
  };

  const handleDeleteGuest = async (guest) => {
    if (window.confirm(`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`)) {
      try {
        await guestService.delete(guest.Id);
        toast.success("Guest deleted successfully!");
        loadGuests();
      } catch (error) {
        toast.error("Failed to delete guest");
      }
    }
  };

const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name === "vipStatus") {
      setFormData(prev => ({ ...prev, [name]: value === "true" }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.idType.trim()) errors.idType = "ID type is required";
    if (!formData.idNumber.trim()) errors.idNumber = "ID number is required";
    
    // Corporate account validation
    if (formData.accountType === "corporate") {
      if (!formData.companyName.trim()) errors.companyName = "Company name is required";
      if (!formData.companyRegistration.trim()) errors.companyRegistration = "Company registration is required";
      if (!formData.taxId.trim()) errors.taxId = "Tax ID is required";
      if (!formData.billingContact.trim()) errors.billingContact = "Billing contact is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
const guestData = {
        ...formData,
        stayHistory: selectedGuest?.stayHistory || [],
        createdAt: selectedGuest?.createdAt || new Date().toISOString(),
        loyaltyProgram: {
          ...formData.loyaltyProgram,
          joinDate: formData.loyaltyProgram.joinDate || new Date().toISOString().split('T')[0]
        },
        // Ensure corporate fields are properly handled
        creditLimit: formData.accountType === "corporate" ? formData.creditLimit : 0,
        corporateDiscount: formData.accountType === "corporate" ? formData.corporateDiscount : 0
      };

      if (selectedGuest) {
        await guestService.update(selectedGuest.Id, guestData);
        toast.success("Guest updated successfully!");
      } else {
        await guestService.create(guestData);
        toast.success("Guest created successfully!");
      }

      setShowForm(false);
      loadGuests();
    } catch (error) {
      toast.error("Failed to save guest");
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message="Failed to load guests" description={error} onRetry={loadGuests} />;

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedGuest ? "Edit Guest" : "New Guest"}
            </h1>
            <p className="text-gray-600">
              {selectedGuest ? "Update guest information" : "Add a new guest to the system"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                
                <FormField
                  label="Account Type"
                  type="select"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleFormChange}
                  required
                >
                  <option value="individual">Individual Guest</option>
                  <option value="corporate">Corporate Account</option>
                </FormField>

                {formData.accountType === "corporate" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-blue-900 flex items-center">
                      <ApperIcon name="Building2" size={16} className="mr-2" />
                      Corporate Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleFormChange}
                        error={formErrors.companyName}
                        required
                        placeholder="Enter company name"
                      />

                      <FormField
                        label="Company Registration"
                        name="companyRegistration"
                        value={formData.companyRegistration}
                        onChange={handleFormChange}
                        error={formErrors.companyRegistration}
                        required
                        placeholder="Registration number"
                      />

                      <FormField
                        label="Tax ID"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleFormChange}
                        error={formErrors.taxId}
                        required
                        placeholder="Tax identification number"
                      />

                      <FormField
                        label="Billing Contact"
                        name="billingContact"
                        value={formData.billingContact}
                        onChange={handleFormChange}
                        error={formErrors.billingContact}
                        required
                        placeholder="Billing contact person"
                      />

                      <FormField
                        label="Credit Limit ($)"
                        type="number"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={handleFormChange}
                        min="0"
                        step="100"
                        placeholder="0"
                      />

                      <FormField
                        label="Payment Terms"
                        type="select"
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleFormChange}
                      >
                        <option value="net30">Net 30 days</option>
                        <option value="net60">Net 60 days</option>
                        <option value="net90">Net 90 days</option>
                        <option value="due_on_receipt">Due on Receipt</option>
                      </FormField>

                      <FormField
                        label="Corporate Discount (%)"
                        type="number"
                        name="corporateDiscount"
                        value={formData.corporateDiscount}
                        onChange={handleFormChange}
                        min="0"
                        max="50"
                        step="1"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    error={formErrors.firstName}
                    required
                  />
                  <FormField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    error={formErrors.lastName}
                    required
                  />
                </div>

                <FormField
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  error={formErrors.email}
                  required
                />

                <FormField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
error={formErrors.phone}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="ID Type"
                  name="idType"
                  value={formData.idType}
                  onChange={handleFormChange}
                  placeholder="e.g. Passport, Driver's License"
                  error={formErrors.idType}
                  required
                />
                <FormField
                  label="ID Number"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleFormChange}
                  placeholder="Enter ID number"
                  error={formErrors.idNumber}
                  required
                />
              </div>

<div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                
                <FormField
                  label="Street Address"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleFormChange}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="City"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleFormChange}
                  />
                  <FormField
                    label="State"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleFormChange}
                  />
                </div>

                <FormField
                  label="ZIP Code"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleFormChange}
                />
              </div>
              
              {/* VIP Status Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">VIP Status</h3>
                
                <FormField
                  label="VIP Status"
                  name="vipStatus"
                  type="select"
                  value={formData.vipStatus.toString()}
                  onChange={handleFormChange}
                >
                  <option value="false">Regular Guest</option>
                  <option value="true">VIP Guest</option>
                </FormField>
              </div>

              {/* Loyalty Program Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Loyalty Program</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Loyalty Tier"
                    name="loyaltyProgram.tier"
                    type="select"
                    value={formData.loyaltyProgram.tier}
                    onChange={handleFormChange}
                  >
                    <option value="">No Program</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </FormField>
                  
                  <FormField
                    label="Loyalty Points"
                    name="loyaltyProgram.points"
                    type="number"
                    value={formData.loyaltyProgram.points}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>

                <FormField
                  label="Program Join Date"
                  name="loyaltyProgram.joinDate"
                  type="date"
                  value={formData.loyaltyProgram.joinDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-gradient"
              >
                {selectedGuest ? "Update Guest" : "Create Guest"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guests & Corporate Accounts</h1>
          <p className="text-gray-600">Manage guest information, profiles, and corporate accounts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setFormData(prev => ({ ...prev, accountType: "corporate" }));
              handleCreateGuest();
            }}
            variant="outline"
          >
            <ApperIcon name="Building2" size={16} className="mr-2" />
            Add Corporate
          </Button>
          <Button 
            onClick={handleCreateGuest}
            className="btn-gradient"
          >
            <ApperIcon name="UserPlus" size={16} className="mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search by name, email, phone, or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="md:w-48">
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Account Types</option>
              <option value="individual">Individual Guests</option>
              <option value="corporate">Corporate Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guests List */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {filteredGuests.length === 0 ? (
          <Empty
            icon="Users"
            title="No guests found"
            description={
              searchQuery
                ? "No guests match your search criteria. Try adjusting your search terms."
                : "There are no guests registered yet. Add your first guest to get started."
            }
            actionLabel={searchQuery ? undefined : "Add First Guest"}
            onAction={searchQuery ? undefined : handleCreateGuest}
          />
        ) : (
          <>
            {/* Table Header */}
<div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4 text-sm font-medium text-gray-700">
                <div>Name / Company</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Account Type</div>
                <div>ID Info</div>
                <div>Location</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Table Body */}
{/* Table Body */}
<div className="divide-y divide-gray-200">
              {filteredGuests.map((guest) => (
                <div key={guest.Id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
<div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {guest.first_name_c} {guest.last_name_c}
                          {guest.vip_status_c && (
                            <span className="ml-2">
                              <ApperIcon name="Star" size={16} className="inline text-yellow-500" />
                            </span>
                          )}
                        </p>
                        {guest.account_type_c === "corporate" && (
                          <Badge variant="secondary" size="sm">
                            <ApperIcon name="Building2" size={12} className="mr-1" />
                            Corporate
                          </Badge>
                        )}
                      </div>
                      {guest.account_type_c === "corporate" && guest.company_name_c && (
                        <p className="text-sm text-blue-600 font-medium">{guest.company_name_c}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-gray-900">{guest.email_c}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-900">{guest.phone_c}</p>
                    </div>
                    
                    <div>
                      <Badge 
                        variant={guest.account_type_c === "corporate" ? "info" : "default"} 
                        size="sm"
                      >
                        {guest.account_type_c === "corporate" ? "Corporate" : "Individual"}
                      </Badge>
                      {guest.account_type_c === "corporate" && guest.corporate_discount_c > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {guest.corporate_discount_c}% discount
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">{guest.id_type_c || "N/A"}</p>
                      <p className="text-sm text-gray-600">{guest.id_number_c || "Not provided"}</p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {(() => {
                          try {
                            const address = typeof guest.address_c === 'string' ? JSON.parse(guest.address_c) : guest.address_c;
                            return address?.city && address?.state 
                              ? `${address.city}, ${address.state}` 
                              : "Not provided";
                          } catch {
                            return "Not provided";
                          }
                        })()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          try {
                            const address = typeof guest.address_c === 'string' ? JSON.parse(guest.address_c) : guest.address_c;
                            return address?.zipCode || "";
                          } catch {
                            return "";
                          }
                        })()}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-1">
                      {guest.vip_status_c && (
                        <Badge variant="warning" size="sm">
                          VIP Guest
                        </Badge>
                      )}
                      {(() => {
                        try {
                          const loyalty = typeof guest.loyalty_program_c === 'string' ? JSON.parse(guest.loyalty_program_c) : guest.loyalty_program_c;
                          return loyalty?.tier && (
                            <Badge 
                              variant={loyalty.tier.toLowerCase() === "gold" ? "warning" : "info"} 
                              size="sm"
                            >
                              {loyalty.tier} ({loyalty.points || 0} pts)
                            </Badge>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                      {guest.account_type_c === "corporate" && guest.credit_limit_c > 0 && (
                        <Badge variant="success" size="sm">
                          Credit: ${guest.credit_limit_c}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditGuest(guest)}
                      >
                        <ApperIcon name="Edit" size={14} className="mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGuest(guest)}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      >
                        <ApperIcon name="Trash2" size={14} />
                      </Button>
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

export default Guests;