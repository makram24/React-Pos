import React , {useEffect , useState}from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { BsSearch } from "react-icons/bs";
import OrderList from './OrderList';

import {db} from "../../constants/firebase";

import {
    collection,
    getDocs,
    where,
    orderBy,
    getDoc,
    doc,
    query,
} from "firebase/firestore";

const RecentOrders = () => {
    const [itemdata, setitemdata] = useState([]);
    const [lock, setLock] = useState(true);

    const OrderDetailsCollectionRef = collection(db, "OrderDetails");
    const RecentOrdersInfo = async () =>{

        const doc_refs = await getDocs(query(OrderDetailsCollectionRef, orderBy("invoicenumber")))
        const res = [];
        doc_refs.forEach(doc => {
            res.push({
            id: doc.id,
            ...doc.data()
            })
        })
        const res1 = [];

        const invoiceCollectionRef = collection(db, "Invoice");
        const doc_ref1 = await getDocs(query(invoiceCollectionRef,where("status", "==", Number(0)) ))

        
        for (let j = 0; j < res.length; j++) {
            
        }
        for (let i = 0; i < res.length; i++) {
            const item_dt = await getDoc(doc(db, "items", res[i].itemid))
            res1.push({
                orderid: res[i].id,
                id: item_dt.id,
                quantity: res[i].quantity,
                ...item_dt.data()
            })
        }
        setitemdata(res1);
        setorderDetailsData(res);

        setLock(false);
    }
    useEffect(() => {
        RecentOrdersInfo();
    }, []);

  return (
    <Container className='recentOrders-bg-container'>
        <Row className='recentOrders-bg-container-inside mb-3'>
            <Col sm={12} className='text-start'>
            <Row className='recentOrders-bg-container-inside mb-3'>
                <Col sm={6} className='text-start'>
                    <h6 className="recentOrders__title">Recent Orders</h6>
                </Col>
                <Col sm={6} className='text-end pr-20'>
                    <a className="recentOrders link">View All</a>
                </Col>
            </Row>
            </Col>
        </Row>
        <Row className='card-bg-container-inside mb-3'>
            <Col sm={12} className='text-start'>
                <Form className="d-flex w-100 ">
                    <InputGroup className="w-100">
                        <Button variant="outline-secondary" className='search-btn' id="button-addon1">
                        <BsSearch />
                        </Button>
                        <Form.Control
                            type="search"
                            placeholder="Search for Recent Orders"
                            className="me-2 search-bar"
                            aria-label="Search for Recent Orders"
                        />
                    </InputGroup>
                </Form>
            </Col>
        </Row>
        {/* Order List */}
        <Row>
            <Col sm={12} className='text-start'>
                <OrderList EmployeeName="Hiba" Time="5 Minutes" Table={1} OrderStaus="In Progress" ServeStatus="Waiting" />
                <OrderList EmployeeName="Makram" Time="1 Hours" Table={4} OrderStaus="Ready" ServeStatus="Served" />
                <OrderList EmployeeName="Zad" Time="3 Hours" Table={3} OrderStaus="Ready" ServeStatus="Served" />
                <OrderList EmployeeName="User1" Time="4 Hours" Table={8} OrderStaus="Ready" ServeStatus="Served" />
                <OrderList EmployeeName="User2" Time="4 Hours" Table={6} OrderStaus="Ready" ServeStatus="Served" />
                <OrderList EmployeeName="User3" Time="5 Hours" Table={5} OrderStaus="Ready" ServeStatus="Served" />
                <OrderList EmployeeName="User4" Time="5 Hours" Table={4} OrderStaus="Ready" ServeStatus="Served" />
                <OrderList EmployeeName="User5" Time="6 Hours" Table={2} OrderStaus="Ready" ServeStatus="Served" />
            </Col>
        </Row>
    </Container>
  )
}

export default RecentOrders