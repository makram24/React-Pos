import React from 'react'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { IoCheckmarkDone } from "react-icons/io5";
import { GrInProgress } from "react-icons/gr";
import { FaCircle } from "react-icons/fa";
import { FaUserLarge } from "react-icons/fa6";


const OrderList = ({EmployeeName, Time, Table, OrderStaus, ServeStatus}) => {
  return (
    <div>
            <Row className='recentOrders-bg-container1-inside'>
                <Col sm={1} className='text-start icon-Order-User'>
                  <FaUserLarge size={20}/>
                </Col>
                <Col sm={3} className='text-start'>
                    <h6>{EmployeeName}</h6>
                    <p className='order-time'>{Time}</p>
                </Col>
                <Col sm={4} className='justify-content-center d-flex'>
                    <h6 className="table-num">Table No: {Table}</h6>
                </Col>
                <Col sm={4} className='justify-content-end align-items-end flex-column d-flex'>
                    <h6 className={OrderStaus == "Ready" ? 'OrderStaus green' : 'OrderStaus orange'}>{OrderStaus == "Ready" ? <IoCheckmarkDone /> : <GrInProgress />} {OrderStaus}</h6>
                    <p className={ServeStatus == "Served" ? 'ServeStatus green' : 'ServeStatus orange'}><FaCircle /> {ServeStatus == "Served" ? 'Served' : 'Waiting'}</p>

                </Col>
            </Row>
    </div>
  )
}

export default OrderList