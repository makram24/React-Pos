import React , {useState} from 'react'
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import login from '../assets/images/login.png';
import { FaUserLarge } from "react-icons/fa6";
import { PiPasswordBold } from "react-icons/pi";
import InputGroup from 'react-bootstrap/InputGroup';
import {useNavigate} from "react-router-dom";

import {auth ,db} from "../constants/firebase";
import {signInWithEmailAndPassword} from "firebase/auth";

import {
  collection,
  getDocs,
  where,
  query 
} from "firebase/firestore";

const Auth = () => {

  const history = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // const [results, setResults] = useState([])
  const handleSignIn = async (e) =>{
    e.preventDefault();
     const handle = async () =>{
      const usersCollectionRef = collection(db, "users");
      // console.log(email)
       const doc_refs = await getDocs(query(usersCollectionRef, where("email", "==", email)))
          
          const res = []
          doc_refs.forEach(country => {
            res.push({
              id: country.id, 
              ...country.data()
            })
          })
          
          if(res[0].role == "Admin"){
            history('/Home/' + res[0].id) 
          }
          else if(res[0].role == "User"){
            history({
              pathname: '/Home/' + res[0].id
            })
          }
        }
        
    signInWithEmailAndPassword(auth, email, password).then((userCredential) =>{
      console.log(userCredential);
      // console.log(results);
      handle();
        
    }).catch((error) => {
      console.log(error);
      history('/login')
    })
  }


  return (
    <Container>
      <Row>
        <Col sm={4} className='bg-container login-big-con p-5'>
          <h3 className='Auth_title'>Welcome</h3>
          <Form className='text-center form-login-con' onSubmit={handleSignIn}>
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
      </Row>
  </Container>
  )
}
export default Auth