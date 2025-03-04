import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import { IoHomeOutline , IoCartOutline} from "react-icons/io5";
import { MdOutlineTableBar } from "react-icons/md";
import { CgMoreVertical } from "react-icons/cg";
import { Link } from 'react-router';
import { IoLogoReact } from "react-icons/io5";
import { useParams } from "react-router-dom";


const Header = () => {
  const {data} = useParams();
  console.log(data)
    const [checked, setChecked] = useState();

    const active = (value) => {
      setChecked(value);
    }
  return (
    <>
      <Navbar className="bg-body-dark navbar-dark mb-3">
        <Container>
              <div className={ checked == "Home" ? 'd-flex justify-content-center align-items-center Nav-active' : 'd-flex justify-content-center align-items-center'}>
                <Link onClick={() => {active("Home")}} to={ "/Home/" + data}>
                  <IoHomeOutline size={20} className='icon-btn'/>Home
                </Link>
              </div>
              <div className={ checked == "Orders" ? 'd-flex justify-content-center align-items-center Nav-active' : 'd-flex justify-content-center align-items-center'}>
                <Link  onClick={() => {active("Orders")}} to={ "/Orders/" + data}>
                  <IoCartOutline size={20} className='icon-btn'/>Orders
                </Link>
              </div>
              <div className='d-flex justify-content-center align-items-center'>
                <Link  onClick={() => {active("Home")}} to={ "/Home/" + data}>
                  <IoLogoReact size={30}/><br/>Logo
                </Link>
              </div>
              <div className={ checked == "Tables" ? 'd-flex justify-content-center align-items-center Nav-active' : 'd-flex justify-content-center align-items-center'}>
                <Link  onClick={() => {active("Tables")}} to={ "/Tables/" + data}>
                  <MdOutlineTableBar size={20} className='icon-btn'/>Tables
                </Link>
              </div>
              <div className={ checked == "More" ? 'd-flex justify-content-center align-items-center Nav-active' : 'd-flex justify-content-center align-items-center'}>
                <Link  onClick={() => {active("More")}} to={ "/More/" + data}>
                  <CgMoreVertical size={20} className='icon-btn'/> More
                </Link>
              </div>
        </Container>
      </Navbar>
      </>
  )
}

export default Header