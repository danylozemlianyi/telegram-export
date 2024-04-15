import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {GoogleOAuthProvider} from "@react-oauth/google";
import 'bootstrap/dist/css/bootstrap.css';
import env from "react-dotenv";
const clientId = env.CLIENT_ID;
const cors = require('cors')({
    origin: 'http://localhost:3000'  // Specify your client’s origin or use '*' for open access
});
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
          <App />
      </GoogleOAuthProvider>
  </React.StrictMode>
);
