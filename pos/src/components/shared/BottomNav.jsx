import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Navbar from 'react-bootstrap/Navbar';
import { IoHomeOutline , IoCartOutline} from "react-icons/io5";
import { MdOutlineTableBar } from "react-icons/md";
import { CgMoreVertical } from "react-icons/cg";
import { FaRegBell } from "react-icons/fa";
import { Link } from 'react-router';

 
const BottomNav = () => {
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('1');

  const radios = [
    { icon: <IoHomeOutline size={20} className='icon-btn'/> , name: 'Home', value: '1' },
    { icon: <IoCartOutline size={20} className='icon-btn'/> , name: 'Orders', value: '2' },
    { icon: <MdOutlineTableBar size={20} className='icon-btn'/> , name: 'Tables', value: '3' },
    { icon: <FaRegBell size={20} className='icon-btn'/> , name: 'Alerts', value: '4' },
    { icon: <CgMoreVertical size={20} className='icon-btn'/> , name: 'More', value: '5' },
  ];

  return (
    <>
      <Navbar className="bg-body-dark navbar-dark mt-3" fixed="bottom">
        <Container>
          <ButtonGroup className='w-100'>
            {radios.map((radio, idx) => (
              <ToggleButton
                key={idx}
                id={`radio-${idx}`}
                type="radio"
                variant='outline-light'
                name="radio"
                value={radio.value}
                checked={radioValue === radio.value}
                onChange={(e) => setRadioValue(e.currentTarget.value)}
              >
                <div className='d-flex justify-content-center align-items-center'>
                  <Link to={ "/" + radio.name}>
                    {radio.icon}
                    {radio.name}
                  </Link>
                </div>
                
              </ToggleButton>
            ))}
            
          </ButtonGroup>
        </Container>
      </Navbar>
  </>
  )
}

export default BottomNav