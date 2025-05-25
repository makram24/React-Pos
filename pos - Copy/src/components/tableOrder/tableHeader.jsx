import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router';
import { IoArrowBackCircle } from "react-icons/io5";


const TableHeader = ({tableNp, userId}) => {
  return (
        <Container className='Tableorderheader-Item-bg-container'>
            <Row className='Tableorderheader-bg-container-inside mb-1'>
                <Col sm={12} className='text-start'>
                    <Row className='Tableorderheader-bg-container-inside'>
                        <Col sm={2} className='text-start left-nav'>
                            <Link to={"../../Tables/" + userId}>
                                <IoArrowBackCircle size={30}/> Tables
                            </Link>
                        </Col>
                        <Col sm={10} className='text-end d-flex justify-content-center right-info'>
                            <p>Table No: {tableNp}</p>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
  )
}

export default TableHeader