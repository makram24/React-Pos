import React, { useEffect, useState, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../constants/firebase";
import OrderDetails from './orderDetails';
import { Modal, Form, Button } from 'react-bootstrap';

import {
  collection,
  getDocs,
  where,
  and,
  query,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

const Invoice = ({ update, setUpdate }) => {
  const { data } = useParams();
  const { currentUser } = useAuth();
  const printRef = useRef();
  const [invoiceData, setInvoiceData] = useState([]);
  const [lock, setLock] = useState(true);
  const [date, setDate] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [modificationReason, setModificationReason] = useState('');
  const [modificationAction, setModificationAction] = useState({ type: '', itemId: '' });
  const location = useLocation();
  const userData = location.state;
    
  const Invoiceinfo = async () => {
    const invoiceCollectionRef = collection(db, "Invoice");
    const doc_refs = await getDocs(query(invoiceCollectionRef, and(where("tableid", "==", Number(userData.tableNo)), where("status", "==", 0))));
    const res = [];
    doc_refs.forEach(doc => {
      res.push({
        id: doc.id,
        ...doc.data()
      });
    });
    if (res[0]?.date.seconds) {
      const convertedDate = new Date(res[0]?.date.seconds * 1000);
      setDate(convertedDate.toLocaleString());
    }

    // If we have previous invoice data and the total has changed, reset orderPlaced
    if (invoiceData && res[0] && invoiceData.total !== res[0].total) {
      // Update the invoice in Firestore to reset orderPlaced
      const invoiceRef = doc(db, 'Invoice', res[0].id);
      await updateDoc(invoiceRef, {
        orderPlaced: false,
        orderPlacedAt: null,
        orderPlacedBy: null
      });
      res[0].orderPlaced = false;
    }

    setInvoiceData(res[0]);
    setOrderPlaced(res[0]?.orderPlaced || false);
    setLock(false);
  };

  // React-to-print handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const handlePayment = async (type) => {
    if (type === "cash") {
      console.log("cash");
    } else if (type === "card") {
      console.log("card");
    }
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    try {
      // Fetch order details for this invoice
      const orderDetailsRef = collection(db, "OrderDetails");
      const orderDetailsQuery = query(orderDetailsRef, where("invoicenumber", "==", invoiceData.number));
      const orderDetailsSnapshot = await getDocs(orderDetailsQuery);
      
      // Get items data for each order detail
      const items = [];
      for (const orderDoc of orderDetailsSnapshot.docs) {
        const orderDetail = orderDoc.data();
        const itemDoc = await getDoc(doc(db, "items", orderDetail.itemid));
        if (itemDoc.exists()) {
          items.push({
            id: itemDoc.id,
            name: itemDoc.data().name,
            quantity: orderDetail.quantity,
            price: itemDoc.data().price,
            notes: orderDetail.notes || ''
          });
        }
      }

      // Create order in orders collection
      const orderData = {
        invoiceId: invoiceData.id,
        invoiceNumber: invoiceData.number,
        tableNumber: Number(userData.tableNo),
        items: items,
        status: 'pending', // pending, preparing, ready, delivered
        createdAt: serverTimestamp(),
        createdBy: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        },
        modifications: []
      };

      await addDoc(collection(db, 'orders'), orderData);

      // Update invoice to mark as ordered
      const invoiceRef = doc(db, 'Invoice', invoiceData.id);
      await updateDoc(invoiceRef, {
        orderPlaced: true,
        orderPlacedAt: serverTimestamp(),
        orderPlacedBy: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      });

      setOrderPlaced(true);
      setUpdate(!update);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order: ' + error.message);
    }
  };

  // Handle modification request
  const handleModificationRequest = async () => {
    if (!modificationReason.trim()) {
      alert('Please provide a reason for the modification');
      return;
    }

    try {
      const modification = {
        type: modificationAction.type,
        itemId: modificationAction.itemId,
        reason: modificationReason,
        timestamp: serverTimestamp(),
        user: {
          id: currentUser.uid,
          name: currentUser.name,
          role: currentUser.role
        }
      };

      // Update the order with modification history
      const ordersRef = collection(db, 'orders');
      const orderQuery = query(ordersRef, where('invoiceId', '==', invoiceData.id));
      const orderDocs = await getDocs(orderQuery);
      
      if (!orderDocs.empty) {
        const orderDoc = orderDocs.docs[0];
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          modifications: [...(orderDoc.data().modifications || []), modification]
        });
      }

      setModificationReason('');
      setShowModificationModal(false);
      setUpdate(!update);
    } catch (error) {
      console.error('Error recording modification:', error);
    }
  };

  useEffect(() => {
    Invoiceinfo();
  }, []);

  useEffect(() => {
    if (update) {
      Invoiceinfo();
      setUpdate(!update);
    }
  }, [update]);

  if (lock === false) {
    return (
      <div className="container mt-2 p-2 bg-dark text-white rounded h-100S">
        {/* Printable Area */}
        <div ref={printRef} className="p-2">
          {/* Customer Details */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-1">
            <div>
              <p className="invoice-num">Table Num: {data}</p>
              <small className="invoice-date">{date}</small>
            </div>
            <div className="d-flex align-items-center justify-content-center invoice-Table-num">
              <strong>#{invoiceData.number}</strong>
            </div>
          </div>

          <OrderDetails 
            update={update} 
            setUpdate={setUpdate} 
            no={invoiceData.number}
            orderPlaced={orderPlaced}
            onModificationNeeded={(type, itemId) => {
              setModificationAction({ type, itemId });
              setShowModificationModal(true);
            }}
          />

          {/* Summary */}
          <div className="mt-3 p-2 border-top border-bottom">
            <div className="d-flex justify-content-between">
              <span>Items</span>
              <span>{Number(invoiceData.total)}$</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Tax(5.25%)</span>
              <span>{invoiceData.tax}$</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-3 d-flex justify-content-between">
          <button className="btn btn-secondary w-50 me-2" onClick={() => handlePayment("cash")}>
            Cash
          </button>
          <button className="btn btn-secondary w-50" onClick={() => handlePayment("card")}>
            Card
          </button>
        </div>

        <div className="mt-3 d-flex justify-content-between">
          <button className="btn btn-primary w-50 me-2" onClick={handlePrint}>
            Print Receipt
          </button>
          <button 
            className="btn btn-warning w-50" 
            onClick={handlePlaceOrder}
            disabled={orderPlaced}
          >
            {orderPlaced ? 'Order Placed' : 'Place Order'}
          </button>
        </div>

        {/* Modification Modal */}
        <Modal show={showModificationModal} onHide={() => setShowModificationModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Modification Reason</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Please provide a reason for {modificationAction.type}:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={modificationReason}
                  onChange={(e) => setModificationReason(e.target.value)}
                  required
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModificationModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModificationRequest}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
};

export default Invoice;