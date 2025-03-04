import React , {useEffect , useState}from 'react'
import { RiDeleteBin2Fill } from "react-icons/ri";
import { TbLibraryPlus } from "react-icons/tb";
import { RiCloseLine } from "react-icons/ri";

import {db} from "../../constants/firebase";

import {
    collection,
    getDocs,
    where,
    getDoc,
    doc,
    deleteDoc,
    updateDoc,
    query,
    increment
  } from "firebase/firestore";

const OrderDetails = ({no, update, setUpdate}) => {

          const [orderDetailsData, setorderDetailsData] = useState([]);
          const [itemdata, setitemdata] = useState([]);
          const [lock, setLock] = useState(true);
          const OrderDetailsCollectionRef = collection(db, "OrderDetails");
          const InvoiceCollectionRef = collection(db, "Invoice");

          const Orderinfo = async () =>{

            const doc_refs = await getDocs(query(OrderDetailsCollectionRef,where("invoicenumber", "==", Number(no))))

                  const res = [];
                  doc_refs.forEach(doc => {
                    res.push({
                      id: doc.id, 
                      ...doc.data()
                    })
                  })
                  const res1 = [];

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
      

        const deleteOrder = async (orderId, quantity, price) => {
          const t = quantity * price;
          const tax = (t * 0.05);
          const tot = t + tax;
          const orderDelete = doc(db, "OrderDetails", orderId);
          
          const doc_refs = await getDocs(query(InvoiceCollectionRef,where("number", "==", Number(no))))

          const res = [];
          doc_refs.forEach(doc => {
            res.push({
              id: doc.id,
              ...doc.data()
            })
          })
         
          const id = res[0].id
          const docRef1 = doc(db, "Invoice", id);
          
          try {
            // Delete the document
            await deleteDoc(orderDelete);
            await updateDoc(docRef1, {
                      total: increment(-t),
                      tax: increment(-tax),
                      grandtotal: increment(-tot),
                    });
                    
            alert(`Item deleted successfully!`);
          } catch (error) {
            console.error('Error deleting document: ', error);
            setError('Error deleting document');
          }
          Orderinfo();
          setUpdate(!update);
        };

        // const [itemquantity, setitemquantity] = useState([]);
        const [showEditor, setShowEditor] = useState(false);
        const [orderDetails, setOrderDetails] = useState(null);
        const [quantity, setQuantity] = useState();

        const handleUpdateClick = (orderId, quantity, price) => {
          setOrderDetails({ orderId, quantity, price });
          setQuantity(quantity); 
          setShowEditor(true);
          
        };

        const handleSave = () => {
          if (!orderDetails) return;
      
          const { orderId, price } = orderDetails;
          
          console.log("Saving data:", { orderId, quantity, price });
      
          // Call your function here (replace with actual logic)
          // updateOrder(orderId, quantity, price);
      
          // Close the editor after saving
          setShowEditor(false);
        };

        useEffect(() => {
          Orderinfo();
        }, []);

        useEffect(() => {
          if (update){
            Orderinfo();
          }
        }, [update]);
    if (lock == false){
    return (
          <div className="mt-3 order-details-invoice-con">
            <h6 className="pb-2 invoice-customer-name">Order Details</h6>
            {itemdata.map((item, index) => (
              <div key={index} className='bg-dark'> 
                  <div className='d-flex invoice-item-con'>
                      <div className='row'>
                          <div className='col-md-6 text-start'>
                              <p className='invoice-customer-name'>{item.name}</p>
                          </div>
                          <div className='col-md-6 text-end'>
                              <p className='invoice-customer-name'>x{item.quantity}</p>
                          </div>
                      </div>
                      <div className='row'>
                          <div className='col-md-6 text-start' >
                              <RiDeleteBin2Fill size={16} onClick={() => deleteOrder(item.orderid , item.quantity, item.price)}/>
                              <TbLibraryPlus size={16} onClick={() => handleUpdateClick(item.orderid , item.quantity, item.price)}/>
                          </div>
                          <div className='col-md-6 text-end'>
                              <p className='invoice-customer-name'>{item.price}$</p>
                          </div>
                      </div>
                  </div>
              </div>
            ))}

      {showEditor && orderDetails && (
        <div className='editquen-con'>
          <div className='editquensub-con'>
            <div className='row'>
              <div className='col-md-10 text-start'>Edit Product Amount</div>
              <div className='col-md-2 text-end close-con'>
                <RiCloseLine size={30} className='close' onClick={() => setShowEditor(false)} />
              </div>
            </div>
            <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
            <p><strong>Price:</strong> ${orderDetails.price}</p>
            <input type="number" value={quantity} 
              onChange={(e) => setQuantity(e.target.value)} />
            <button onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      )}
            
          </div>
    )
}
}

export default OrderDetails