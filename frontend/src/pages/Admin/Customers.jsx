import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Ban, 
  CheckCircle, 
  Trash2, 
  X, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck 
} from 'lucide-react';

import DoubleConfirmModal from '../../components/DoubleConfirmModal';

const Customers = () => {
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmActionType, setConfirmActionType] = useState('danger');

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dob: '',
    gender: 'Male',
    nomineeName: '',
    nomineeMobile: '',
    temporaryPassword: ''
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: { search, status: statusFilter, page, limit: 10 }
      });
      if (response.data.success) {
        setCustomers(response.data.customers);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      showToast('Error loading customer list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      dob: '',
      gender: 'Male',
      nomineeName: '',
      nomineeMobile: '',
      temporaryPassword: ''
    });
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (customer) => {
    setIsEditing(true);
    setEditingId(customer._id);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
      dob: customer.dob ? customer.dob.split('T')[0] : '',
      gender: customer.gender || 'Male',
      nomineeName: customer.nomineeName || '',
      nomineeMobile: customer.nomineeMobile || '',
      temporaryPassword: '' // Blank on edit, reset password is separate
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.mobile) {
      showToast('Name and Mobile are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        // Edit Customer API
        const response = await api.put(`/customers/${editingId}`, formData);
        if (response.data.success) {
          showToast('Customer profile updated successfully.', 'success');
          setModalOpen(false);
          fetchCustomers();
        }
      } else {
        // Create Customer API
        const response = await api.post('/customers', formData);
        if (response.data.success) {
          showToast(response.data.message, 'success');
          setModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = (id, isBlocked) => {
    setConfirmAction(() => async () => {
      const action = isBlocked ? 'activate' : 'block';
      try {
        const response = await api.patch(`/customers/${id}/${action}`);
        if (response.data.success) {
          showToast(response.data.message, 'success');
          fetchCustomers();
        }
      } catch (error) {
        showToast(`Failed to ${isBlocked ? 'unblock' : 'block'} customer.`, 'error');
      }
    });
    setConfirmMessage(isBlocked 
      ? 'Do you want to unblock this customer account?' 
      : 'Do you want to block this customer account? The customer will not be able to log in.'
    );
    setConfirmActionType(isBlocked ? 'success' : 'danger');
    setConfirmOpen(true);
  };

  const handleDelete = (id, name) => {
    setConfirmAction(() => async () => {
      try {
        const response = await api.delete(`/customers/${id}`);
        if (response.data.success) {
          showToast('Customer account deleted.', 'success');
          fetchCustomers();
        }
      } catch (error) {
        showToast('Failed to delete customer.', 'error');
      }
    });
    setConfirmMessage(`Are you sure you want to permanently delete the customer "${name}"?`);
    setConfirmActionType('danger');
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Customer Management</h1>
          <p className="text-xs text-slate-400">Add, edit, block, or delete customer saving ledgers</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 gold-btn-gradient text-slate-950 hover:shadow-lg hover:shadow-gold-500/10 active:scale-95 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 animate-fade-in"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search & Filter Form */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 bg-slate-950 border border-slate-900 rounded-xl p-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by Name, Email, Mobile or Customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-300 rounded-lg px-4 py-2.5 text-xs focus:outline-none transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Blocked">Blocked</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-gold-500 text-slate-300 hover:text-gold-500 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300"
          >
            Find
          </button>
        </div>
      </form>

      {/* Table Data */}
      <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <th className="p-4">Customer ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Email</th>
                <th className="p-4">Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-gold-500">
                      <Link to={`/admin/customers/${c._id}`} className="hover:underline">
                        {c.customerId}
                      </Link>
                    </td>
                    <td className="p-4 font-medium text-slate-200">{c.name}</td>
                    <td className="p-4 font-mono">{c.mobile}</td>
                    <td className="p-4">{c.email}</td>
                    <td className="p-4 font-bold text-slate-100">
                      ₹{c.balance.toLocaleString('en-IN')}
                      {c.pendingAmount > 0 && (
                        <div className="text-[9px] text-amber-500 font-semibold mt-0.5">
                          Pending: ₹{c.pendingAmount}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <Link
                          to={`/admin/customers/${c._id}`}
                          className="p-1.5 hover:bg-slate-900 text-gold-500 hover:text-gold-400 rounded transition-colors"
                          title="View Profile & Transactions"
                        >
                          <Info className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 hover:bg-slate-900 text-blue-400 hover:text-blue-300 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(c._id, c.status === 'Blocked')}
                          className={`p-1.5 hover:bg-slate-900 rounded transition-colors ${
                            c.status === 'Blocked' 
                              ? 'text-emerald-400 hover:text-emerald-300' 
                              : 'text-amber-500 hover:text-amber-400'
                          }`}
                          title={c.status === 'Blocked' ? 'Activate Customer' : 'Block Customer'}
                        >
                          {c.status === 'Blocked' ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.name)}
                          className="p-1.5 hover:bg-slate-900 text-rose-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">No matching customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-900 flex justify-between items-center bg-slate-950/60">
            <span className="text-[11px] text-slate-400">
              Showing Page <strong>{page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} Total Customers)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:hover:border-slate-800 text-slate-400 rounded transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:hover:border-slate-800 text-slate-400 rounded transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-950 border border-gold-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-900 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {isEditing ? 'Modify Customer Details' : 'Create Savings Account'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Column: Account Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Primary Profile
                  </h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Customer Name"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit Phone"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="customer@gmail.com"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth (Optional)</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-2 py-2 text-xs focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column: Address & Nominee */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-gold-500 uppercase tracking-widest border-b border-slate-900 pb-1">
                    Address & Nominee
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Street Address (Optional)</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Address details"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City (Optional)</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pincode (Optional)</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="Pincode"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominee Name (Optional)</label>
                      <input
                        type="text"
                        name="nomineeName"
                        value={formData.nomineeName}
                        onChange={handleInputChange}
                        placeholder="Nominee Name"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominee Mobile (Optional)</label>
                      <input
                        type="tel"
                        name="nomineeMobile"
                        value={formData.nomineeMobile}
                        onChange={handleInputChange}
                        placeholder="Nominee Mobile"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State (Optional)</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                      />
                    </div>

                    {!isEditing && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temp Password</label>
                        <input
                          type="text"
                          name="temporaryPassword"
                          value={formData.temporaryPassword}
                          onChange={handleInputChange}
                          placeholder="Optional (Auto)"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors placeholder:text-slate-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-900 pt-5 flex justify-end gap-3 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 gold-btn-gradient text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    isEditing ? 'Save Changes' : 'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DoubleConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        message={confirmMessage}
        actionType={confirmActionType}
      />
    </div>
  );
};

export default Customers;
