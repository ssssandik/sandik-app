import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinBuilding from "./pages/JoinBuilding";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{padding:40}}>Sandik Home</div>} />
        <Route path="/join-building" element={<JoinBuilding />} />
      </Routes>
    </BrowserRouter>
  );
}
