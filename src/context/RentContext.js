// src/context/RentContext.jsx
import React, { createContext, useState } from "react";

// 1. Create context
export const RentContext = createContext();

// 2. Create provider component
export const RentProvider = ({ children }) => {
  const [rentList, setRentList] = useState([]);

  const addRent = (rent) => setRentList((prev) => [...prev, rent]);

  return (
    <RentContext.Provider value={{ rentList, setRentList, addRent }}>
      {children}
    </RentContext.Provider>
  );
};
