// Loader.jsx
import React from "react";

const Loader = () => (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    color: "#fff",
    fontSize: "1.5rem",
    zIndex: 9999
  }}>
    <div className="spinner-border text-light" role="status"></div>
    <div style={{ marginTop: "10px" }}>Loading...</div>
  </div>
);

export default Loader;
