import { useState } from "react";

export default function JoinBuilding() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");

  const handleSearch = () => {
    if (code === "123") {
      setResult("Apartment 1");
    } else {
      setResult("Code not found");
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Join Building</h2>

      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code"
      />

      <br /><br />

      <button onClick={handleSearch}>
        Search
      </button>

      <p>{result}</p>
    </div>
  );
}
