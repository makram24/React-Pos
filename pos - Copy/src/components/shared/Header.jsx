import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';


import { IoCartOutline } from "react-icons/io5";
import { MdOutlineTableBar, MdKitchen ,MdOutlineInventory2 } from "react-icons/md";
import { IoLogoReact } from "react-icons/io5";
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import { LuLayoutDashboard } from "react-icons/lu";
import { FiLogOut } from "react-icons/fi";


import { Link } from 'react-router';

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { Button } from 'react-bootstrap';

const Header = () => {
  const { data } = useParams();
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState();

  const active = (value) => {
    setChecked(value);
  }

  // Determine user role
  const userRole = currentUser?.role || '';
  
  // Check if user has specific roles
  const isAdmin = userRole === 'Admin';
  const isChef = userRole === 'Chef' || userRole === 'chef';
  const isKitchenStaff = isAdmin || isChef;
  const isCashier = userRole === 'Cashier';
  const isWaiter = userRole === 'Waiter';
  const isManager = userRole === 'Manager';

  // Check if we should hide the header (on auth pages)
  const hideHeader = location.pathname === '/' || location.pathname.startsWith('/auth');

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (hideHeader) {
    return null; // Don't render the header on auth pages
  }

  return (
    <>
      <Navbar className="bg-body-dark navbar-dark mb-3">
        <Container className="d-flex justify-content-between">
        <div className="d-flex align-items-center">
          <div className='d-flex justify-content-center align-items-center'>
              <Link>
                <IoLogoReact size={30} /><br />Logo
              </Link>
            </div>
          </div>
          <div className="d-flex">
            
            {/* Visible to all except kitchen-only staff */}
            {(isAdmin || isManager || isCashier || isWaiter || !isKitchenStaff) && (
              <div className={checked == "Orders" ? 'd-flex justify-content-center align-items-center m-20 Nav-active' : 'd-flex justify-content-center align-items-center m-20'}>
                <Link onClick={() => { active("Orders") }} to={"/Orders"}>
                  <IoCartOutline size={20} className='icon-btn' />Orders
                </Link>
              </div>
            )}
            
            {/* Tables visible to waiters, managers, and admins */}
            {(isAdmin || isManager || isWaiter) && (
              <div className={checked == "Tables" ? 'd-flex justify-content-center align-items-center m-20 Nav-active' : 'd-flex justify-content-center align-items-center m-20'}>
                <Link onClick={() => { active("Tables") }} to={"/Tables"}>
                  <MdOutlineTableBar size={20} className='icon-btn' />Tables
                </Link>
              </div>
            )}
            
            {/* Kitchen visible to kitchen staff */}
            {isKitchenStaff && (
              <div className={checked == "Kitchen" ? 'd-flex justify-content-center align-items-center m-20 Nav-active' : 'd-flex justify-content-center align-items-center m-20'}>
                <Link onClick={() => { active("Kitchen") }} to={"/kitchen"}>
                  <MdKitchen size={20} className='icon-btn' /> Kitchen
                </Link>
              </div>
            )}
            
            {/* Inventory link for managers and admins */}
            {(isAdmin || isManager) && (
              <div className={checked == "Inventory" ? 'd-flex justify-content-center align-items-center m-20 Nav-active' : 'd-flex justify-content-center align-items-center m-20'}>
                <Link  onClick={() => { active("Inventory") }} className="nav-link" to="/inventory">
                <MdOutlineInventory2 size={20} className='icon-btn'/> Inventory
                </Link>
              </div>
            )}
            
            {/* Analytics for managers and admins */}
            {(isAdmin || isManager) && (
              <div className={checked == "Analytics" ? 'd-flex justify-content-center align-items-center m-20 Nav-active' : 'd-flex justify-content-center align-items-center m-20'}>
                <Link  onClick={() => { active("Analytics") }} className="nav-link" to="/analytics">
                <TbBrandGoogleAnalytics size={20} className='icon-btn'/> Analytics
                </Link>
              </div>
            )}
            
            {/* Admin Dashboard only for admins */}
            {isAdmin && (
              <div className={checked == "Dashboard" ? 'd-flex justify-content-center align-items-center m-20 Nav-active' : 'd-flex justify-content-center align-items-center'}>
                <Link  onClick={() => { active("Dashboard") }} className="nav-link" to="/admin">
                <LuLayoutDashboard size={20} className='icon-btn'/> Admin Dashboard
                </Link>
              </div>
            )}
          </div>
          
          {currentUser && (
            <div className="d-flex align-items-center">
              <span className="text-light me-3">
                {currentUser.name}
                {userRole && <small className="ms-2 text-light ">({userRole})</small>}
              </span>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleSignOut}
                className="d-flex align-items-center"
              >
                <FiLogOut className="me-1" /> Sign Out
              </Button>
            </div>
          )}
        </Container>
      </Navbar>
    </>
  )
}

export default Header