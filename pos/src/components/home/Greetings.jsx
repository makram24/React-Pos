import React , {useEffect, useState} from 'react'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Greetings = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div>
        <Container>
            <Row>
                <Col sm={6} className='bg-container text-start pt-3'>
                    <h3>Hello, Makram</h3>
                    <p>Give your best today</p>
                </Col>
                <Col sm={6} className='bg-container text-end pt-3'>
                    <h3>{currentTime.toLocaleDateString()}</h3>
                    <p>{currentTime.toLocaleTimeString()}</p>
                </Col>
            </Row>
        </Container>
    </div>
  )
}

export default Greetings