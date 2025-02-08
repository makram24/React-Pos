import React, { useRef } from 'react'
import { useReactToPrint } from "react-to-print";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { BiEditAlt } from "react-icons/bi";

const InvoiceHeader = () => {
    const printRef = useRef();

  // React-to-print handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <div className="container mt-2 p-2 bg-dark text-white rounded h-100S">
      {/* Printable Area */}
      <div ref={printRef} className="p-2">
        {/* Customer Details */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-1">
          <div>
            <h6 className="invoice-customer-name">Customer Name</h6>
            <p className="invoice-num">#101/Dine in</p>
            <small className="invoice-date">January 19, 2025 05:34 PM</small>
          </div>
          <div
            className="d-flex align-items-center justify-content-center invoice-Table-num"
          >
            <strong>01</strong>
          </div>
        </div>

        {/* Order Details */}
        <div className="mt-3 order-details-invoice-con">
          <h6 className="pb-2 invoice-customer-name">Order Details</h6>
          {[1, 2, 3].map((item, index) => (
            <div key={index} className='bg-dark'> 
                <div className='d-flex invoice-item-con'>
                    <div className='row'>
                        <div className='col-md-6 text-start'>
                            <p className='invoice-customer-name'>Chicken Tikka</p>
                        </div>
                        <div className='col-md-6 text-end'>
                            <p className='invoice-customer-name'>x2</p>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='col-md-6 text-start'>
                            <RiDeleteBin2Fill size={16}/> <BiEditAlt size={16}/>
                        </div>
                        <div className='col-md-6 text-end'>
                            <p className='invoice-customer-name'>220$</p>
                        </div>
                    </div>
                </div>
            </div>
            // <div
            //   key={index}
            //   className="d-flex p-2 mb-2 bg-secondary "
            // >
            //     <p className='invoice-customer-name'>Chicken Tikka</p>
            //     <span className="text-white">2</span>
            //   <div>
            //     <strong>&#8377;123</strong>
            //   </div>
            // </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-3 p-2 border-top border-bottom">
          <div className="d-flex justify-content-between">
            <span>Items(4)</span>
            <span>&#8377;240</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Tax(5.25%)</span>
            <span>&#8377;24</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-3 d-flex justify-content-between">
        <button className="btn btn-primary w-50 me-2" onClick={handlePrint}>
          Print Receipt
        </button>
        <button className="btn btn-warning w-50">Place Order</button>
      </div>
    </div>
  )
}

export default InvoiceHeader