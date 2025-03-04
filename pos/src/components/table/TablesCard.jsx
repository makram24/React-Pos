import React, { useState } from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router';
import { useParams , useNavigate } from "react-router-dom";

import {db} from "../../constants/firebase";

import {
    collection,
    addDoc, 
    increment,
    updateDoc,
    doc,
    orderBy,
    limit,
    query,
    getDocs
  } from "firebase/firestore";

const TablesCard = ({No, Availablity , isClickable = false , createInvoice = false, id = ""}) => {
    const {data} = useParams();
    const navigate = useNavigate();
    const userData = { userId : data};
    
    const goToTable = () => {
        navigate("/TableOrder/" + No, { state: userData });
    };
    const createBookedTable = async () => {
        const currentTime = new Date();
        const InvoiceRef = collection(db, "Invoice");
      
        // 1️⃣ Get the last document (highest number)
        const q = query(InvoiceRef, orderBy("number", "desc"), limit(1));
        const querySnapshot = await getDocs(q);
  
        let newNumber = 1; // Default if no documents exist
  
        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          newNumber = lastDoc.number + 1; // Increment last number
        }

            const docRef = await addDoc(collection(db, "Invoice"), {
                date: currentTime,
                discount: Number(0),
                grandtotal: Number(0),
                number: newNumber,
                status: Number(0),
                tableid: Number(No),
                tax: Number(0),
                total: Number(0),
                userId: data,
            });
            const docRef1 = doc(db, "tables", id);
            await updateDoc(docRef1, {
                Availability: "Booked",
                });
              navigate("/TableOrder/" + No, { state: userData });
    };
    const notClick = () => {
        alert(`Table is Booked by another user`);
      };
      const isClickabledata = () => {
        if(isClickable == true){
            return(
                <div onClick={goToTable}>
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
            </div>
            )
        }else if(createInvoice == true){
            return(
                <div onClick={createBookedTable} >
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
            </div>
            )
        }else{
            return(
                <div onClick={notClick}>
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
            </div>
            )
        }
      };
  return (
        <Col sm={3} className='text-start'>
            {isClickabledata()}
        </Col>
  )
}

export default TablesCard