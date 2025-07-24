import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBox, FaList, FaChartBar, FaUsers, FaMapMarkerAlt, FaBars, FaTimes, FaLocationArrow, FaShoppingCart, FaTruck, FaImage, FaTag, FaAddressBook } from 'react-icons/fa';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Inventory', path: '/inventory', icon: <FaBox className="mr-2" /> },
    { name: 'Listing', path: '/listing', icon: <FaList className="mr-2" /> },
    { name: 'Promo Code', path: '/promo-code', icon: <FaTag className="mr-2" /> },
    { name: 'Banner', path: '/banner', icon: <FaImage className="mr-2" /> },
    { name: 'Direct Customer', path: '/direct-customer', icon: <FaUsers className="mr-2" /> },
    { name: 'Direct Enquiry', path: '/direct-enquiry', icon: <FaShoppingCart className="mr-2" /> },
    { name: 'Location', path: '/location', icon: <FaLocationArrow className="mr-2" /> },
    { name: 'Tracking', path: '/tracking', icon: <FaMapMarkerAlt className="mr-2" /> },
    { name: 'Dispatch Customers', path: '/dispatch-customers', icon: <FaTruck className="mr-2" /> },
    { name: 'Report', path: '/report', icon: <FaChartBar className="mr-2" /> },
    { name: 'Sales Analysis', path: '/sales-analysis', icon: <FaAddressBook className="mr-2" /> },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {!isOpen && (
        <button
          className="hundred:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md"
          onClick={toggleSidebar}
        >
          <FaBars size={24} />
        </button>
      )}

      <div
        className={`fixed top-0 left-0 h-screen bg-black/80 text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } hundred:translate-x-0 mobile:w-64 w-64 z-40`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700 flex items-center justify-between">
          Admin
          <button className="hundred:hidden text-white" onClick={toggleSidebar}>
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="flex-1 mt-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center py-3 px-6 text-sm font-medium hover:bg-black/50 transition-colors ${
                      isActive ? 'bg-gray-900 text-white' : ''
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isOpen && (
        <div
          className="hundred:hidden fixed inset-0 bg-black/50 bg-opacity-30 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}