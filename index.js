import React from "react";
import ReactDOM from "react-dom/client"; // Note the change here
import App from "./App";

// Create a root element
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component using the new method
root.render(<App />);
