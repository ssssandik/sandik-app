import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinBuilding from "./pages/JoinBuilding";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/join-building" element={<JoinBuilding />} />
      </Routes>
    </BrowserRouter>
  );
}
