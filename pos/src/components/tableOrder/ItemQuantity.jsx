import React, { useState } from "react";

const ItemQuantity = ({ min = 1, max = 100, initial = 1, onChange }) => {

    const [quantity, setQuantity] = useState(initial);

    const increase = () => {
      if (quantity < max) {
        setQuantity(quantity + 1);
        onChange && onChange(quantity + 1);
      }
    };
  
    const decrease = () => {
      if (quantity > min) {
        setQuantity(quantity - 1);
        onChange && onChange(quantity - 1);
      }
    };
  
    const handleChange = (e) => {
      let value = parseInt(e.target.value, 10);
      if (isNaN(value)) value = min;
      if (value < min) value = min;
      if (value > max) value = max;
      setQuantity(value);
      onChange && onChange(value);
    };
    
  return (
    <div className="d-flex justify-content-end items-center space-x-2 ">
        <button
            onClick={decrease}
            className="quantity-ulter-btn col-md-3"
        >
            -
        </button>
        <input
            type="number"
            value={quantity}
            onChange={handleChange}
            className="w-12 quantity-ulter-btn col-md-3 quantity-ulter-btn-num"
        />
        <button
            onClick={increase}
            className="quantity-ulter-btn col-md-3"
        >
            +
        </button>
    </div>
  )
}

export default ItemQuantity