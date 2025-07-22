import React, { useState, useEffect } from "react";
import "../../App.css";
import Sidebar from "../Sidebar/Sidebar";
import { API_BASE_URL } from "../../../Config";
import Logout from "../Logout";

export default function Localcustomer() {
  const [formData, setFormData] = useState({
    customerName: "", state: "", district: "", mobileNumber: "", email: "", address: "",
    customerType: "Customer", agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "",
    custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: ""
  });
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)", borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setStates(data);
      if (data.length > 0 && formData.customerType !== "Customer of Selected Agent") {
        setFormData((prev) => ({ ...prev, state: data[0].name }));
        fetchDistricts(data[0].name);
      }
    } catch (error) {
      setError("Failed to load states.");
      console.error('Error fetching states:', error);
    }
  };

  const fetchDistricts = async (stateName, fieldPrefix = "") => {
    if (!stateName) {
      setDistricts([]);
      setFormData((prev) => ({ ...prev, [`${fieldPrefix}district`]: "" }));
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/states/${stateName}/districts`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setDistricts(data);
      if (data.length > 0) setFormData((prev) => ({ ...prev, [`${fieldPrefix}district`]: data[0].id }));
    } catch (error) {
      setError(`Failed to load districts for ${stateName}.`);
      setDistricts([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/directcust/agents`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const formattedAgents = data.map(agent => ({ id: agent.id, name: agent.name || agent.customer_name }));
      setAgents(formattedAgents);
    } catch (error) {
      setError("Failed to load agents.");
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (["mobileNumber", "agentContact", "custAgentContact"].includes(name)) {
      value = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);

    if (name === "state") {
      fetchDistricts(value);
      setFormData((prev) => ({ ...prev, district: "" }));
    } else if (name === "agentState") {
      fetchDistricts(value, "agent");
      setFormData((prev) => ({ ...prev, agentDistrict: "" }));
    } else if (name === "custAgentState") {
      fetchDistricts(value, "custAgent");
      setFormData((prev) => ({ ...prev, custAgentDistrict: "" }));
    } else if (name === "customerType") {
      const newType = value.trim();
      const resetData = {
        customerName: "", state: "", district: "", mobileNumber: "", email: "", address: newType === "Customer" ? "123 Main St, Apt 4B" : "",
        customerType: newType, agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "",
        custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: ""
      };
      setFormData(resetData);
      setSelectedAgent("");
      setAgents([]);
      if (newType === "Customer of Selected Agent") fetchAgents();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requiredCheck = () => {
      const { customerType, customerName, state, district, mobileNumber, address, agentName, agentContact, agentState, agentDistrict, custAgentName, custAgentContact, custAgentState, custAgentDistrict, custAgentAddress } = formData;
      const isEmpty = (val) => !val || typeof val !== "string" || !val.trim();
      if (customerType === "Customer" && (isEmpty(customerName) || isEmpty(state) || isEmpty(district) || isEmpty(mobileNumber) || isEmpty(address))) {
        return "Please fill all required fields for Customer.";
      } else if (customerType === "Agent" && (isEmpty(agentName) || isEmpty(agentContact) || isEmpty(agentState) || isEmpty(agentDistrict))) {
        return "Please fill all required fields for Agent.";
      } else if (customerType === "Customer of Selected Agent" && (!selectedAgent || isEmpty(custAgentName) || isEmpty(custAgentContact) || isEmpty(custAgentState) || isEmpty(custAgentDistrict) || isEmpty(custAgentAddress))) {
        return "Please fill all required fields for Customer of Selected Agent.";
      }
      return null;
    };

    const validationError = requiredCheck();
    if (validationError) {
      setError(validationError);
      return;
    }

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
      const response = await fetch(`${API_BASE_URL}/api/directcust/customers`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error((await response.json()).error || `HTTP error! Status: ${response.status}`);
      setSuccess(true);
      setError(null);
      setFormData({
        customerName: "", state: "", district: "", mobileNumber: "", email: "", address: "",
        customerType: "Customer", agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "",
        custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: ""
      });
      setSelectedAgent("");
      setDistricts([]);
    } catch (error) {
      setError(error.message || "Failed to save customer.");
      setSuccess(false);
    }
  };

  const renderInput = (id, name, label, type = "text", placeholder, required = false, pattern = null) => (
    <div className="sm:col-span-3">
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">{label}</label>
      <div className="mt-2">
        <input
          type={type} name={name} id={id} value={formData[name]} onChange={handleChange} pattern={pattern || (["mobileNumber", "agentContact", "custAgentContact"].includes(name) ? "\\d{10}" : null)}
          className="block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 border-gray-300 dark:border-gray-600 px-3 py-1.5 text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm sm:leading-6"
          placeholder={placeholder} required={required} style={styles.input}
        />
      </div>
    </div>
  );

  const renderSelect = (id, name, label, options, disabled = false, required = false, placeholder = "Select an option") => (
    <div className="sm:col-span-3">
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">{label}</label>
      <div className="mt-2 grid grid-cols-1">
        <select
          id={id} name={name} value={name === "selectedAgent" ? selectedAgent : formData[name]}
          onChange={name === "selectedAgent" ? (e) => setSelectedAgent(e.target.value) : handleChange}
          disabled={disabled} className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-gray-900 text-gray-900 border-gray-300 dark:border-gray-600 py-1.5 pr-8 pl-3 text-base focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm sm:leading-6"
          required={required} style={styles.input}
        >
          <option value="">{agents.length === 0 && name === "selectedAgent" ? "Loading agents..." : placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
        <svg className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 dark:text-gray-400 sm:size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );

  const renderTextarea = (id, name, label, placeholder, required = false) => (
    <div className="col-span-full">
      <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-300">{label}</label>
      <div className="mt-2">
        <textarea
          name={name} id={id} rows="3" value={formData[name]} onChange={handleChange}
          className="block w-full rounded-md bg-white dark:bg-gray-900 text-gray-900 border-gray-300 dark:border-gray-600 px-3 py-1.5 text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-600 dark:focus:outline-blue-500 sm:text-sm sm:leading-6"
          placeholder={placeholder} required={required} style={styles.input}
        />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 hundred:ml-[15%] onefifty:ml-[15%] mobile:ml-[0%]">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">Add Customer</h1>
          {error && <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg text-center">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded-lg text-center">Data entered successfully</div>}
          <div className="space-y-12">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">Select Customer Type</h2>
              {renderSelect("customerType", "customerType", "Customer Type", [
                { id: "Customer", name: "Customer" }, { id: "Agent", name: "Agent" }, { id: "Customer of Selected Agent", name: "Customer of Selected Agent" }
              ], false, true)}
              {formData.customerType === "Customer" && (
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {renderInput("customerName", "customerName", "Customer Name", "text", "Jane Smith", true)}
                  {renderSelect("state", "state", "State", states.map((s) => ({ id: s.name, name: s.name })), false, true)}
                  {renderSelect("district", "district", "District", districts, !formData.state, true)}
                  {renderInput("mobileNumber", "mobileNumber", "Mobile Number", "text", "1234567890", true)}
                  {renderInput("email", "email", "Email (Optional)", "email", "jane@example.com")}
                  {renderTextarea("address", "address", "Address", "123 Main St, Apt 4B", true)}
                </div>
              )}
              {formData.customerType === "Agent" && (
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {renderInput("agentName", "agentName", "Agent Name", "text", "Agent Name", true)}
                  {renderInput("agentContact", "agentContact", "Agent Contact", "text", "1234567890", true)}
                  {renderInput("agentEmail", "agentEmail", "Agent Email (Optional)", "email", "agent@example.com")}
                  {renderSelect("agentState", "agentState", "Agent State", states.map((s) => ({ id: s.name, name: s.name })), false, true)}
                  {renderSelect("agentDistrict", "agentDistrict", "Agent District", districts, !formData.agentState, true)}
                  {renderTextarea("address", "address", "Agent Address", "123 Main St, Apt 4B", true)}
                </div>
              )}
              {formData.customerType === "Customer of Selected Agent" && (
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
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
            <div className="mt-6 flex items-center justify-end gap-x-6">
              <button
                type="button" className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => {
                  setFormData({
                    customerName: "", state: "", district: "", mobileNumber: "", email: "", address: "",
                    customerType: "Customer", agentName: "", agentContact: "", agentEmail: "", agentState: "", agentDistrict: "",
                    custAgentName: "", custAgentContact: "", custAgentEmail: "", custAgentAddress: "", custAgentDistrict: "", custAgentState: ""
                  });
                  setSelectedAgent(""); setError(null); setSuccess(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button" onClick={handleSubmit}
                className="rounded-md px-3 py-2 text-sm font-semibold text-white dark:text-gray-100 shadow-sm hover:bg-indigo-700 dark:hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-blue-500"
                style={styles.button}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}