import React from 'react'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Greetings from '../components/home/Greetings';
import MiniCart from '../components/home/MiniCart';
import { BsCash } from "react-icons/bs";
import { RiProgress5Line } from "react-icons/ri";
import RecentOrders from '../components/home/RecentOrders';
import Popular from '../components/home/Popular';
const Home = () => {
  return (
    <Container>
      <Row>
        <Col sm={8} className='bg-container'>
          <Greetings />
          <div className='d-flex'>
            <MiniCart title="Total Earnings" icon={<BsCash size={20} />} number={512} footerNum={1.6} />
            <MiniCart title="In Progress" icon={<RiProgress5Line size={20} />} number={16} footerNum={3.6} />
          </div>
          <RecentOrders />
        </Col>
        <Col sm={4} className='bg-container'>
          <Popular />
        </Col>
      </Row>
  </Container>
  )
}
export default Home