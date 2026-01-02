import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2933",
            color: "#fff",
          },
        }}
      />
      <App />
    </>
  </React.StrictMode>
);
