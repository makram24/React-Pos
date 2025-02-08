import React, { useEffect, useState} from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import TablesCard from '../components/table/TablesCard';

import {db} from "../constants/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";

const Tables = () => {

    const tablesCollectionRef = collection(db, "tables");

    const [OurTables, setTables] = useState([]);
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
                                OurTables.map((item) => {
                                    return (
                                        <TablesCard No={item.No} Availablity={item.Availability} />
                                    )
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