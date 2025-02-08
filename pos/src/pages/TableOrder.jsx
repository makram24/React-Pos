import React, { useEffect, useState } from "react";
import TableHeader from '../components/tableOrder/tableHeader'
import { useParams } from "react-router-dom";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import ItemQuantity from "../components/tableOrder/ItemQuantity";

import {db} from "../constants/firebase";

import {
    collection,
    getDocs,
  } from "firebase/firestore";
import InvoiceHeader from "../components/tableOrder/InvoiceHeader";


const TableOrder = () => {
    const {data} = useParams();
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");

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
          const querySnapshot = await getDocs(collection(db, "items"));
          const itemList = querySnapshot.docs.map((doc) => doc.data());
          setItems(itemList);
          setFilteredItems(itemList);
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

      
  return (
    <Container className='Tableorder-Item-bg-container'>
            <Row className='Tableorder-bg-container-inside mb-1'>
                <Col sm={9} className='text-start'>
                    <Col sm={12} className='text-start'>
                        <TableHeader tableNp={data}/>
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
                                            <ItemQuantity />
                                        </div>
                                    </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Col>
                <Col sm={3} className='text-start'>
                    <InvoiceHeader />
                </Col>
            </Row>
        </Container>
  )
}

export default TableOrder