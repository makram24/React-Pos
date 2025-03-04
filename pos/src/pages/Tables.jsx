import React, { useEffect, useState} from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import TablesCard from '../components/table/TablesCard';
import { useParams } from "react-router-dom";

import {db} from "../constants/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where
} from "firebase/firestore";

const Tables = () => {
  const {data} = useParams();

    const tablesCollectionRef = collection(db, "tables");

    const [OurTables, setTables] = useState([]);
    const [Invoices, setInvoices] = useState();
    const getTable = async () => {
       try {
            const doc_refs1 = await getDocs(query(tablesCollectionRef, orderBy("No")))          
            const res2 = [];
            doc_refs1.forEach(country => {
              res2.push({
                id: country.id, 
                ...country.data()
              })
            })
            
            setTables(res2);
            
          } 
      catch (err) {
          console.error(err);
          }
    };
    useEffect(() => {
      const fetchInvoices = async () => {
        const invoiceCollectionRef = collection(db, "Invoice");
        const doc_refs = await getDocs(query(invoiceCollectionRef,where("status", "==", Number(0)) ))
        const res = [];
        doc_refs.forEach(doc => {
          res.push({
            id: doc.id,
            ...doc.data()
          })
        })
        setInvoices(res);
      };
      fetchInvoices();
      
        
         
        getTable();
      }, []);

  return (
    <div className="mb-12">
        <Container>
            <Row>
                <Col sm={12} className='bg-container'>
                    
                        <Container>
                            <Row>
                            <div className='Tablecards'>
                            {
                                OurTables.map((table) => {
                                  
                                  if (table.Availability == "Booked"){
                                    for (let i = 0; i < Invoices.length; i++) {
                                      if (Invoices[i].userId == data){
                                        if (Invoices[i].tableid == table.No) {
                                          return (
                                            <TablesCard isClickable={true} No={table.No} Availablity={table.Availability} />
                                          )
                                        }
                                      }else if (Invoices[i].userId != data){
                                        return (
                                          <TablesCard No={table.No} Availablity={table.Availability} />
                                        )
                                      }
                                    }
                                  }else if (table.Availability == "Available"){
                                    return (
                                      <TablesCard createInvoice={true} id={table.id} No={table.No} Availablity={table.Availability} />
                                    )
                                  }
                                })
                            }
                            </div>
                            </Row>
                        </Container>
                    
                </Col>
            </Row>
        </Container>
    </div>
  )
}

export default Tables