import { BrowserRouter, Routes, Route } from "react-router-dom";

import Profile from "./pages/Profile";
import Results from "./pages/Results";

import ScholarshipDetails from "./pages/ScholarshipDetails";
function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route 
  path="/scholarship-details" 
  element={<ScholarshipDetails />} 
/>

        <Route path="/" element={<Profile />} />

        <Route path="/results" element={<Results />} />

      </Routes>

    </BrowserRouter>
  );
}


export default App;