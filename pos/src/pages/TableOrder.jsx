import React, { useEffect, useState } from "react";
import TableHeader from '../components/tableOrder/tableHeader'
import { useParams , useLocation } from "react-router-dom";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import ItemQuantity from "../components/tableOrder/ItemQuantity";

import {db} from "../constants/firebase";

import {
    collection,
    getDocs,
    addDoc,
    doc, 
    query,
    and,
    where,
    updateDoc
  } from "firebase/firestore";
import Invoice from "../components/tableOrder/Invoice";


const TableOrder = () => {
  const location = useLocation();
    const {data} = useParams();
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [update, setUpdate] = useState(false);

    const userData = location.state;

    const addItem = async (id, price, quantity) => {

      const invoicedatas = await getDocs(query(collection(db, "Invoice") ,and(where("tableid", "==", Number(data)), where("status", "==", 0) )))
          const res = [];
          invoicedatas.forEach(doc => {
            res.push({
              id: doc.id,
              ...doc.data()
            })
          })
        const invoiceId = res[0].id;
        const docRef = await addDoc(collection(db, "OrderDetails"), {
          itemid: id,
          quantity: Number(quantity),
          invoicenumber: Number(res[0].number),
        });
        const newTotal = res[0].total + (price * quantity);
        const tax  = newTotal * 0.05;
        const docRef1 = doc(db, "Invoice", invoiceId); // Reference the document by ID
        await updateDoc(docRef1, {
          total: newTotal,
          tax: tax,
          grandtotal: (newTotal + tax),
        });
        setUpdate(prevState => !prevState);
    };

     // Fetch categories from Firestore
     useEffect(() => {
        const fetchCategories = async () => {
          const querySnapshot = await getDocs(collection(db, "Categories"));
          const categoryList = querySnapshot.docs.map((doc) => doc.data());
          setCategories(categoryList);
        };
        fetchCategories();
      }, []);
  
      // Fetch items from Firestore
      useEffect(() => {
        const fetchItems = async () => {
          const itemsCollectionRef = collection(db, "items");

          const querySnapshot = await getDocs(itemsCollectionRef);

                     const res = [];
                     querySnapshot.forEach(doc => {
                       res.push({
                         id: doc.id,
                         ...doc.data()
                       })
                     })
          setItems(res);
          setFilteredItems(res);
        };
        fetchItems();
      }, []);
  
      // Filter items based on selected category
      const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        if (category === "All") {
          setFilteredItems(items);
        } else {
          setFilteredItems(items.filter((item) => item.category === category));
        }
      };

      const [quantity, setQuantity] = useState(1);

      // Function to handle change from child
      const handleQuantity = (value) => {
        setQuantity(value);
      };
    
    useEffect(() => {
    }, [update]);

  return (
    <Container className='Tableorder-Item-bg-container'>
            <Row className='Tableorder-bg-container-inside mb-1'>
                <Col sm={9} className='text-start'>
                    <Col sm={12} className='text-start'>
                        <TableHeader tableNp={data} userId={userData.userId}/>
                    </Col>
                    <Col sm={12} className='text-start'>
                        <div className="p-1">
                            {/* Category Cards */}
                            <div className="d-flex justify-content-start flex-wrap mb-4">
                                <button
                                    onClick={() => handleCategoryClick("All")}
                                    className={`category-card ${selectedCategory === "All" ? "category-card-active" : ""}`}
                                >
                                    All
                                </button>
                                {categories.map((cat) => (
                                    <button
                                    key={cat.name}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className={`category-card ${selectedCategory === cat.name ? "category-card-active" : ""}`}
                                    >
                                    {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Filtered Items */}
                            <div className="d-flex justify-content-start flex-wrap">
                                {filteredItems.map((item) => (
                                    <div key={item.id} className="item-card">
                                      <p className="item-card-title">{item.name}</p>
                                      <p className="item-card-category">{item.category}</p>
                                      <div className="row align-items-center">
                                          <div className="col-md-3">
                                              <p className="item-card-price">{item.price}$</p>
                                          </div>
                                          <div className="col-md-9">
                                              <ItemQuantity onChange={handleQuantity}/>
                                          </div>
                                      </div>
                                      <button onClick={() => addItem(item.id , item.price, quantity )} className="btn btn-outline-warning item-card-additem" >Add</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Col>
                <Col sm={3} className='text-start'>
                    <Invoice update={update} setUpdate = {setUpdate}/>
                </Col>
            </Row>
        </Container>
  )
}

export default TableOrder