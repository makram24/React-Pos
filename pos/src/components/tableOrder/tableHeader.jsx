import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router';
import { IoArrowBackCircle } from "react-icons/io5";


const TableHeader = ({tableNp}) => {
  return (
        <Container className='Tableorderheader-Item-bg-container'>
            <Row className='Tableorderheader-bg-container-inside mb-1'>
                <Col sm={12} className='text-start'>
                    <Row className='Tableorderheader-bg-container-inside'>
                        <Col sm={2} className='text-start left-nav'>
                            <Link to={"Tables/"}>
                                <IoArrowBackCircle size={30}/> Menu
                            </Link>
                        </Col>
                        <Col sm={10} className='text-end d-flex justify-content-center right-info'>
                            <h6>Customer Name</h6>
                            <p>Table No: {tableNp}</p>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
  )
}

export default TableHeader