import React, { useState } from 'react'
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import login from '../assets/images/login.png';
import { FaUserLarge } from "react-icons/fa6";
import { PiPasswordBold } from "react-icons/pi";
import InputGroup from 'react-bootstrap/InputGroup';
import { useNavigate } from "react-router-dom";
import { auth, db } from "../constants/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, where, query } from "firebase/firestore";

const Auth = () => {
  const history = useNavigate();
  const { updateUserContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // First authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const usersCollectionRef = collection(db, "users");
      const userQuery = query(usersCollectionRef, where("email", "==", email));
      const userDocs = await getDocs(userQuery);
      
      if (!userDocs.empty) {
        const userData = userDocs.docs[0].data();
        console.log("Found user data:", userData);

        // Update the auth context with user data
        const updatedData = await updateUserContext(user.uid, email);

        if (updatedData) {
          // Navigate based on role
          if (updatedData.role === "Admin" || updatedData.role === "Manager") {
            history('/analytics');
          } else if (updatedData.role === "Cashier") {
            history('/Tables');
          } else if (updatedData.role === "Chef") {
            history('/kitchen');
          } else if (updatedData.role === "Waiter") {
            history('/Orders');
          }
        } else {
          setError('Failed to update user context');
        }
      } else {
        console.error("No user data found in Firestore");
        setError('User data not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
    }
  };

  return (
    <Container>
      <Row className='auth-container'>
        <div className='auth-container-inside'>
        <Col sm={4} className='bg-container login-big-con p-5'>
          <h3 className='Auth_title'>Welcome</h3>
          <Form className='text-center form-login-con' onSubmit={handleSignIn}>
            {error && <div className="alert alert-danger">{error}</div>}
            <Form.Group className="mb-4 w-100" controlId="formGroupEmail">
              <InputGroup>
                <div className='login-btn'>
                  <FaUserLarge size={14} />
                </div>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  className="me-2 search-bar"
                  aria-label="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-4 w-100" controlId="formGroupPassword">
              <InputGroup>
                <div className='login-btn'>
                  <PiPasswordBold size={14}/>
                </div>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  className="me-2 search-bar"
                  aria-label="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>
            <Button variant="outline-secondary" type="submit" className='login-submit-btn' id="button-addon1">
              Login
            </Button>
          </Form>
        </Col>
        <Col sm={8} className='bg-container p-0'>
          <img src={login} alt="" />
        </Col>
        </div>
      </Row>
    </Container>
  );
};

export default Auth;