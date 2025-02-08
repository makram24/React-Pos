import React from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { BsSearch } from "react-icons/bs";



const Header = () => {
  return (
    <>
    {['lg'].map((expand) => (
      <Navbar key={expand} expand={expand} className="bg-body-dark navbar-dark mb-3">
        <Container>
          <Navbar.Brand href="#">EVOLVE POS</Navbar.Brand>
          <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
          <Form className="d-flex w-100 justify-content-center align-items-center">
            <InputGroup className="w-50">
                <Button variant="outline-secondary" className='search-btn' id="button-addon1">
                  <BsSearch />
                </Button>
                <Form.Control
                    type="search"
                    placeholder="Search"
                    className="me-2 search-bar"
                    aria-label="Search"
                />
            </InputGroup>
         </Form>
          <Navbar.Offcanvas
            id={`offcanvasNavbar-expand-${expand}`}
            aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>
                Offcanvas
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link href="#action2">Logout</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    ))}
  </>
  )
}

export default Header