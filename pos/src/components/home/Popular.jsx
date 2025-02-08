import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { popularItems } from '../../constants';

const Popular = () => {
  return (
    <Container className='Popular-Item-bg-container'>
        <Row className='recentOrders-bg-container-inside mb-3'>
            <Col sm={12} className='text-start'>
                <Row className='recentOrders-bg-container-inside mb-3'>
                    <Col sm={6} className='text-start'>
                        <h6 className="recentOrders__title">Popular Items</h6>
                    </Col>
                    <Col sm={6} className='text-end'>
                        <a className="recentOrders link">View All</a>
                    </Col>
                </Row>
            </Col>
            {
                popularItems.map((item) => {
                    return (
                        <Row key={item.id} className='Popular-Item-bg-container-inside '>
                            <Col sm={1} className='align-items-end d-flex justify-content-center flex-column '>
                                <h5>{item.id}</h5>
                            </Col>
                            <Col sm={1} className='text-start img-Popular-Item'>
                                <img src={item.image} alt="" />
                            </Col>
                            <Col sm={9} className='text-start'>
                                <h6 className='m-0'>{item.name}</h6>
                                <p className='order-time'>Orders: {item.numberOfOrders}</p>
                            </Col>
                        </Row>
                    )
                })
            }
        </Row>
    </Container>
  )
}

export default Popular