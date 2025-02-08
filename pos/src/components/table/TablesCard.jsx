import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router';

const TablesCard = ({No, Availablity}) => {
  return (
        <Col sm={3} className='text-start'>
            <Link to={ "/TableOrder/" + No}>
                <Container className='Popular-Item-bg-container'>
                    <Row className='Tablecards-bg-container-inside mb-1'>
                        <Col sm={12} className='text-start'>
                            <Row className='Tablecards-bg-container-inside mb-3'>
                                <Col sm={6} className='text-start'>
                                    <h6 className="Tablecards__title">Table {No}</h6>
                                </Col>
                                <Col sm={6} className='text-end'>
                                    <div className={Availablity == "Available" ? 'Tablecards-Available' : 'Tablecards-booked '}>{Availablity}</div>
                                </Col>
                                <Col sm={12} className='text-center d-flex justify-content-center'>
                                    <h6 className={Availablity == "Available" ? 'Tablecards-Available-Number' : 'Tablecards-booked-Number '}>{No}</h6>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </Link>
        </Col>
  )
}

export default TablesCard