import React, { useEffect, useState , useRef } from 'react'
import { useReactToPrint } from "react-to-print";

import { useParams } from "react-router-dom";
import {db} from "../../constants/firebase";
import OrderDetails from './orderDetails';

import {
    collection,
    getDocs,
    where,
    and,
    query
  } from "firebase/firestore";


const Invoice = ({ update , setUpdate }) => {
  const {data} = useParams();
    const printRef = useRef();
    const [invoiceData, setInvoiceData] = useState([]);
    const [lock, setLock] = useState(true);

    const [date, setDate] = useState(null);
    

    const Invoiceinfo = async () =>{

        const invoiceCollectionRef = collection(db, "Invoice");
        const doc_refs = await getDocs(query(invoiceCollectionRef,and(where("tableid", "==", Number(data)), where("status", "==", 0) )))
            const res = [];
            doc_refs.forEach(doc => {
              res.push({
                id: doc.id,
                ...doc.data()
              })
            })
            if (res[0]?.date.seconds) {
              const convertedDate = new Date(res[0]?.date.seconds * 1000);
              setDate(convertedDate.toLocaleString());
            }
            setInvoiceData(res[0]);
            setLock(false);
    }
  // React-to-print handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const handlePayment = async (type) => {
    if (type == "cash") {
      console.log("cash")
    }else if (type == "card"){
      console.log("card")
    }
  }
  useEffect(() => {
    Invoiceinfo();
  }, []);

  useEffect(() => {
    if (update){
      Invoiceinfo();
      setUpdate(!update);
    }
  }, [update]);

  if (lock == false){
    return (
      <div className="container mt-2 p-2 bg-dark text-white rounded h-100S">
        {/* Printable Area */}
        <div ref={printRef} className="p-2">
          {/* Customer Details */}
          <div className="d-flex justify-content-between align-items-center border-bottom pb-1">
            <div>
              <h6 className="invoice-customer-name">Customer Name</h6>
              <p className="invoice-num">#{invoiceData.number}</p>
              <small className="invoice-date">{date}</small>
            </div>
            <div className="d-flex align-items-center justify-content-center invoice-Table-num" >
              <strong>{data}</strong>
            </div>
          </div>

          <OrderDetails update={update} setUpdate = {setUpdate} no={invoiceData.number}/>

          {/* Summary */}
          <div className="mt-3 p-2 border-top border-bottom">
            <div className="d-flex justify-content-between">
              <span>Items</span>
              <span>{invoiceData.total}$</span>
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
          <button className="btn btn-secondary w-50" onClick={() => handlePayment("card")}>Card</button>
        </div>

        <div className="mt-3 d-flex justify-content-between">
          <button className="btn btn-primary w-50 me-2" onClick={handlePrint}>
            Print Receipt
          </button>
          <button className="btn btn-warning w-50">Place Order</button>
        </div>
      </div>
    )
  }
}

export default Invoice