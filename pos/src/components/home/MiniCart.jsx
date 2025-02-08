import React from 'react'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const MiniCart = ({title, icon, number, footerNum}) => {
  return (
    <Container className='card-bg-container'>
            <Row className='card-bg-container-inside'>
                <Col sm={10} className='text-start'>
                    <h6 className="mini-cart__title">{title}</h6>
                    
                </Col>
                <Col sm={2} className='mini-cart__icon text-end pt-3'>
                    {icon}
                </Col>
            </Row>
            <Row className='card-bg-container-inside'>
                <Col sm={12} className='text-start'>
                    <h3>{number}</h3>
                </Col>
                <Col sm={12} className='text-start'>
                    <p className='percentage'><span className='footernum'>{footerNum}%</span> than Yesterday</p>
                </Col>
            </Row>
        </Container>
  )
}

export default MiniCart