import React, { useState, useEffect } from "react";
import "../../App.css";
import Sidebar from "../Sidebar/Sidebar";
import { API_BASE_URL } from "../../../Config";
import Logout from "../Logout";

const Spinner = ({ size = 'sm', color = 'text-white' }) => (
  <svg className={`animate-spin ${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} ${color}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" color="text-blue-500" />
      <p className="text-sm text-gray-400 font-medium">Loading customers…</p>
    </div>
  </div>
);

export default function Localcustomer() {
  const initialFormData = {
    customerName: "", state: "", district: "", mobileNumber: "", email: "", address: "",
    customerType: "Customer", agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "",
    custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: ""
  };

  const [formData, setFormData] = useState(initialFormData);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedType, setSelectedType] = useState("Customer");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedCustomer, setViewedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const pageSize = 10;
  const totalPages = Math.ceil(customers.length / pageSize);
  const paginatedCustomers = customers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── all original logic/API calls unchanged ────────────────────────────────

  useEffect(() => {
    const initLoad = async () => {
      await Promise.all([fetchStates(), fetchCustomers(selectedType), fetchAgents()]);
      setPageLoading(false);
    };
    initLoad();
  }, []);
  useEffect(() => { fetchCustomers(selectedType); }, [selectedType]);

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setStates(data);
    } catch (error) { setError("Failed to load states."); console.error('Error fetching states:', error); }
  };

  const fetchDistricts = async (stateName, fieldPrefix = "") => {
    if (!stateName) { setDistricts([]); setFormData((prev) => ({ ...prev, [`${fieldPrefix}district`]: "" })); return []; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setDistricts(data);
      return data;
    } catch (error) { setError(`Failed to load districts for ${stateName}.`); setDistricts([]); return []; }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/directcust/agents`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setAgents(data.map(agent => ({ id: agent.id, name: agent.name || agent.customer_name })));
    } catch (error) { setError("Failed to load agents."); console.error('Error fetching agents:', error); setAgents([]); }
  };

  const fetchCustomers = async (type) => {
    try {
      const url = new URL(`${API_BASE_URL}/api/directcust/customers`);
      if (type && type !== "All") url.searchParams.append("type", type);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setCustomers(data.sort((a, b) => b.id - a.id));
    } catch (error) { setError("Failed to load customers."); console.error('Error fetching customers:', error); }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (["mobileNumber", "agentContact", "custAgentContact"].includes(name)) {
      value = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    if (name === "state") { fetchDistricts(value); setFormData((prev) => ({ ...prev, district: "" })); }
    else if (name === "agentState") { fetchDistricts(value, "agent"); setFormData((prev) => ({ ...prev, agentDistrict: "" })); }
    else if (name === "custAgentState") { fetchDistricts(value, "custAgent"); setFormData((prev) => ({ ...prev, custAgentDistrict: "" })); }
    else if (name === "customerType") {
      const newType = value.trim();
      setFormData({ customerName: "", state: "", district: "", mobileNumber: "", email: "", address: newType === "Customer" ? "123 Main St, Apt 4B" : "", customerType: newType, agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "", custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: "" });
      setSelectedAgent(""); setAgents([]);
      if (newType === "Customer of Selected Agent") fetchAgents();
    }
  };

  const handleEdit = async (customer) => {
    setEditId(customer.id);
    setFormData({ ...initialFormData, customerType: customer.customer_type });
    setSelectedAgent(customer.agent_id || "");
    let prefix = "";
    let targetState = customer.state;
    let targetDistrictName = customer.district;
    switch (customer.customer_type) {
      case "Customer":
        prefix = "";
        setFormData((prev) => ({ ...prev, customerName: customer.customer_name || "", state: customer.state || "", mobileNumber: customer.mobile_number || "", email: customer.email || "", address: customer.address || "" }));
        break;
      case "Agent":
        prefix = "agent";
        setFormData((prev) => ({ ...prev, agentName: customer.customer_name || "", agentState: customer.state || "", agentContact: customer.mobile_number || "", agentEmail: customer.email || "", address: customer.address || "" }));
        break;
      case "Customer of Selected Agent":
        prefix = "custAgent";
        await fetchAgents();
        setFormData((prev) => ({ ...prev, custAgentName: customer.customer_name || "", custAgentState: customer.state || "", custAgentContact: customer.mobile_number || "", custAgentEmail: customer.email || "", custAgentAddress: customer.address || "" }));
        break;
      default: break;
    }
    if (targetState) {
      const dists = await fetchDistricts(targetState, prefix);
      const districtId = dists.find((d) => d.name === targetDistrictName)?.id || "";
      setFormData((prev) => ({ ...prev, [`${prefix}state`]: targetState, [`${prefix}district`]: districtId }));
    }
    setSuccess(false); setError(null); setIsModalOpen(true);
  };

  const handleView = (customer) => { setViewedCustomer(customer); setViewModalOpen(true); };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      setDeletingId(id);
      const response = await fetch(`${API_BASE_URL}/api/directcust/customers/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      fetchCustomers(selectedType);
    } catch (error) { setError("Failed to delete customer."); console.error("Error deleting customer:", error); }
    finally { setDeletingId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredCheck = () => {
      const { customerType, customerName, state, district, mobileNumber, address, agentName, agentContact, agentState, agentDistrict, custAgentName, custAgentContact, custAgentState, custAgentDistrict, custAgentAddress } = formData;
      const isEmpty = (val) => !val || typeof val !== "string" || !val.trim();
      if (customerType === "Customer" && (isEmpty(customerName) || isEmpty(state) || isEmpty(district) || isEmpty(mobileNumber) || isEmpty(address))) return "Please fill all required fields for Customer.";
      else if (customerType === "Agent" && (isEmpty(agentName) || isEmpty(agentContact) || isEmpty(agentState) || isEmpty(agentDistrict))) return "Please fill all required fields for Agent.";
      else if (customerType === "Customer of Selected Agent" && (!selectedAgent || isEmpty(custAgentName) || isEmpty(custAgentContact) || isEmpty(custAgentState) || isEmpty(custAgentDistrict) || isEmpty(custAgentAddress))) return "Please fill all required fields for Customer of Selected Agent.";
      return null;
    };
    const validationError = requiredCheck();
    if (validationError) { setError(validationError); return; }
    setLoading(true); setError(null);
    try {
      const payload = {
        customer_name: formData.customerName.trim() || null, state: formData.state.trim() || null, district: formData.district.trim() || null,
        mobile_number: formData.mobileNumber.trim() || null, email: formData.email.trim() || null, address: formData.address.trim() || null,
        customer_type: formData.customerType.trim() || null, agent_id: selectedAgent || null, agent_name: formData.agentName.trim() || null,
        agent_contact: formData.agentContact.trim() || null, agent_email: formData.agentEmail.trim() || null, agent_state: formData.agentState.trim() || null,
        agent_district: formData.agentDistrict.trim() || null, cust_agent_name: formData.custAgentName.trim() || null,
        cust_agent_contact: formData.custAgentContact.trim() || null, cust_agent_email: formData.custAgentEmail.trim() || null,
        cust_agent_address: formData.custAgentAddress.trim() || null, cust_agent_district: formData.custAgentDistrict.trim() || null,
        cust_agent_state: formData.custAgentState.trim() || null
      };
      const url = editId ? `${API_BASE_URL}/api/directcust/customers/${editId}` : `${API_BASE_URL}/api/directcust/customers`;
      const method = editId ? "PUT" : "POST";
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      setSuccess(true); setError(null); setFormData(initialFormData); setSelectedAgent(""); setEditId(null); setDistricts([]);
      fetchCustomers(selectedType); setIsModalOpen(false);
    } catch (error) { setError(error.message || "Failed to save customer. Try again."); setSuccess(false); }
    finally { setLoading(false); }
  };

  const resetAndClose = () => { setFormData(initialFormData); setSelectedAgent(""); setError(null); setSuccess(false); setEditId(null); setIsModalOpen(false); };
  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) { setIsModalOpen(false); resetAndClose(); } };
  const handleViewBackdropClick = (e) => { if (e.target === e.currentTarget) setViewModalOpen(false); };

  // ── shared UI classes ─────────────────────────────────────────────────────
  const ic = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sc = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer";
  const lc = "block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5";
  const btnPrimary = "h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer";
  const btnGhost = "h-9 px-5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-all cursor-pointer";

  const renderInput = (id, name, label, type = "text", placeholder, required = false, pattern = null) => (
    <div className="sm:col-span-3">
      <label htmlFor={id} className={lc}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} name={name} id={id} value={formData[name]} onChange={handleChange}
        pattern={pattern || (["mobileNumber", "agentContact", "custAgentContact"].includes(name) ? "\\d{10}" : null)}
        className={ic} placeholder={placeholder} required={required} />
    </div>
  );

  const renderSelect = (id, name, label, options, disabled = false, required = false, placeholder = "Select an option", onChangeHandler = handleChange) => (
    <div className="sm:col-span-3">
      <label htmlFor={id} className={lc}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <select id={id} name={name} value={name === "selectedAgent" ? selectedAgent : formData[name]}
        onChange={name === "selectedAgent" ? (e) => setSelectedAgent(e.target.value) : onChangeHandler}
        disabled={disabled} className={`${sc} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} required={required}>
        <option value="">{agents.length === 0 && name === "selectedAgent" ? "Loading agents..." : placeholder}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </div>
  );

  const renderTextarea = (id, name, label, placeholder, required = false) => (
    <div className="col-span-full">
      <label htmlFor={id} className={lc}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <textarea name={name} id={id} rows="3" value={formData[name]} onChange={handleChange}
        className={`${ic} resize-none`} placeholder={placeholder} required={required} />
    </div>
  );

  const typeColors = {
    Customer: "bg-blue-50 border-blue-100",
    Agent: "bg-emerald-50 border-emerald-100",
    "Customer of Selected Agent": "bg-amber-50 border-amber-100",
  };

  const typeBadgeColors = {
    Customer: "bg-blue-100 text-blue-700",
    Agent: "bg-emerald-100 text-emerald-700",
    "Customer of Selected Agent": "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <Logout />
      <div className="flex-1 hundred:ml-[15%] onefifty:ml-[15%] mobile:ml-0 hundred:px-8 mobile:px-4 pt-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="pb-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500 mb-0.5">CRM</p>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Customers</h1>
            </div>
            <button onClick={() => { setFormData(initialFormData); setSelectedAgent(""); setEditId(null); setIsModalOpen(true); }}
              className={btnPrimary}>
              + Add Customer
            </button>
          </div>

          {pageLoading ? <PageLoader /> : (
            <>
              {/* Filter */}
              <div className="flex items-center gap-4">
                <div>
                  <label className={lc}>Filter by Type</label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={`${sc} w-52`}>
                    {["All", "Customer", "Agent", "Customer of Selected Agent"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCustomers.map((customer) => (
                  <div key={customer.id} className={`p-4 rounded-xl border shadow-sm ${typeColors[customer.customer_type] || "bg-white border-gray-200"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">{customer.customer_name}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${typeBadgeColors[customer.customer_type] || "bg-gray-100 text-gray-600"}`}>
                          {customer.customer_type}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">📞 {customer.mobile_number}</p>
                    <p className="text-xs text-gray-500">📍 {customer.district}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleView(customer)} className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">View</button>
                      <button onClick={() => handleEdit(customer)} className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">Edit</button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        disabled={deletingId === customer.id}
                        className={`flex-1 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1
                          ${deletingId === customer.id ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        {deletingId === customer.id ? <Spinner /> : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 items-center">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 1 ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  ← Prev
                </button>
                {currentPage > 3 && (
                  <button onClick={() => setCurrentPage(1)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-600 hover:bg-gray-50`}>1</button>
                )}
                {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {pageNum}
                    </button>
                  );
                }).filter(Boolean)}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={handleBackdropClick}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl">
                <h1 className="text-base font-bold text-gray-800 text-center">{editId ? "Edit Customer" : "Add Customer"}</h1>
              </div>
              <div className="px-6 py-6">
                {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">{error}</div>}
                {success && <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm text-center">Data saved successfully</div>}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      {renderSelect("customerType", "customerType", "Customer Type", [
                        { id: "Customer", name: "Customer" }, { id: "Agent", name: "Agent" }, { id: "Customer of Selected Agent", name: "Customer of Selected Agent" }
                      ], !!editId, true)}
                    </div>
                    {formData.customerType === "Customer" && (
                      <div className="grid grid-cols-1 mobile:grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-6 pt-4 border-t border-gray-100">
                        {renderInput("customerName", "customerName", "Customer Name", "text", "Jane Smith", true)}
                        {renderSelect("state", "state", "State", states.map((s) => ({ id: s.name, name: s.name })), false, true)}
                        {renderSelect("district", "district", "District", districts, !formData.state, true)}
                        {renderInput("mobileNumber", "mobileNumber", "Mobile Number", "text", "1234567890", true)}
                        {renderInput("email", "email", "Email (Optional)", "email", "jane@example.com")}
                        {renderTextarea("address", "address", "Address", "123 Main St, Apt 4B", true)}
                      </div>
                    )}
                    {formData.customerType === "Agent" && (
                      <div className="grid grid-cols-1 mobile:grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-6 pt-4 border-t border-gray-100">
                        {renderInput("agentName", "agentName", "Agent Name", "text", "Agent Name", true)}
                        {renderInput("agentContact", "agentContact", "Agent Contact", "text", "1234567890", true)}
                        {renderInput("agentEmail", "agentEmail", "Agent Email (Optional)", "email", "agent@example.com")}
                        {renderSelect("agentState", "agentState", "Agent State", states.map((s) => ({ id: s.name, name: s.name })), false, true)}
                        {renderSelect("agentDistrict", "agentDistrict", "Agent District", districts, !formData.agentState, true)}
                        {renderTextarea("address", "address", "Agent Address", "123 Main St, Apt 4B", true)}
                      </div>
                    )}
                    {formData.customerType === "Customer of Selected Agent" && (
                      <div className="grid grid-cols-1 mobile:grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-6 pt-4 border-t border-gray-100">
                        {renderSelect("selectedAgent", "selectedAgent", "Select Agent", agents, agents.length === 0, true)}
                        {renderInput("custAgentName", "custAgentName", "Customer Agent Name", "text", "Customer Agent Name", true)}
                        {renderInput("custAgentContact", "custAgentContact", "Customer Agent Contact", "text", "1234567890", true)}
                        {renderInput("custAgentEmail", "custAgentEmail", "Customer Agent Email (Optional)", "email", "custagent@example.com")}
                        {renderSelect("custAgentState", "custAgentState", "Customer Agent State", states.map((s) => ({ id: s.name, name: s.name })), false, true)}
                        {renderSelect("custAgentDistrict", "custAgentDistrict", "Customer Agent District", districts, !formData.custAgentState, true)}
                        {renderTextarea("custAgentAddress", "custAgentAddress", "Customer Agent Address", "123 Main St, Apt 4B", true)}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={resetAndClose} disabled={loading} className={btnGhost}>Cancel</button>
                    <button type="submit" disabled={loading}
                      className={`h-9 px-5 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center gap-2 ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                      {loading ? (<><Spinner />Saving…</>) : error && error.includes("Try again") ? "Try Again" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && viewedCustomer && (
        <div className="fixed z-10 inset-0 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={handleViewBackdropClick}>
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-2xl">
                <h1 className="text-base font-bold text-gray-800 text-center">Customer Details</h1>
              </div>
              <div className="px-6 py-6 space-y-3">
                {[
                  ["Name", viewedCustomer.customer_name],
                  ["Type", viewedCustomer.customer_type],
                  ["Mobile Number", viewedCustomer.mobile_number],
                  ["Email", viewedCustomer.email || "N/A"],
                  ["Address", viewedCustomer.address],
                  ["State", viewedCustomer.state],
                  ["District", viewedCustomer.district],
                  ...(viewedCustomer.agent_id ? [["Agent", agents.find(a => a.id === viewedCustomer.agent_id)?.name || "Unknown"]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 w-24 shrink-0 mt-0.5">{label}</span>
                    <span className="text-sm text-gray-800 font-medium">{value}</span>
                  </div>
                ))}
                <div className="pt-4 flex justify-end">
                  <button onClick={() => setViewModalOpen(false)} className={btnGhost}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}