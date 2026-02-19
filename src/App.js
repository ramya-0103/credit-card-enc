import React, { useMemo, useState } from "react";
import "./App.css";

const ROLE_OPTIONS = ["Nursery", "Farmer", "Transport", "Customer"];

const pseudoHash = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const makeBlockHash = (blockData) =>
  pseudoHash(
    JSON.stringify({
      index: blockData.index,
      timestamp: blockData.timestamp,
      productId: blockData.productId,
      actor: blockData.actor,
      type: blockData.type,
      payload: blockData.payload,
      previousHash: blockData.previousHash,
    })
  );

const genesisBlock = {
  index: 0,
  timestamp: new Date().toISOString(),
  productId: "GENESIS",
  actor: "System",
  type: "GENESIS",
  payload: { message: "Supply chain initialized" },
  previousHash: "0x00000000",
};

genesisBlock.hash = makeBlockHash(genesisBlock);

const App = () => {
  const [activeRole, setActiveRole] = useState("Nursery");
  const [ledger, setLedger] = useState([genesisBlock]);
  const [ownershipMap, setOwnershipMap] = useState({});

  const [nurseryForm, setNurseryForm] = useState({
    productName: "",
    seedType: "",
    nurseryLocation: "",
  });
  const [farmerForm, setFarmerForm] = useState({
    productId: "",
    fertilizer: "",
    harvestDate: "",
    farmLocation: "",
  });
  const [transportForm, setTransportForm] = useState({
    productId: "",
    location: "",
    dispatchDate: "",
    condition: "",
  });
  const [customerSearchId, setCustomerSearchId] = useState("");

  const [status, setStatus] = useState("Ready");
  const [tamperedIndex, setTamperedIndex] = useState(null);

  const addBlock = ({ productId, actor, type, payload }) => {
    setLedger((prevLedger) => {
      const previous = prevLedger[prevLedger.length - 1];
      const block = {
        index: prevLedger.length,
        timestamp: new Date().toISOString(),
        productId,
        actor,
        type,
        payload,
        previousHash: previous.hash,
      };
      block.hash = makeBlockHash(block);
      return [...prevLedger, block];
    });
  };

  const registerAtNursery = (e) => {
    e.preventDefault();
    const { productName, seedType, nurseryLocation } = nurseryForm;
    if (!productName || !seedType || !nurseryLocation) {
      setStatus("Nursery: fill all fields before registering.");
      return;
    }

    const seed = `${productName}-${seedType}-${Date.now()}`;
    const productId = `AGRI-${pseudoHash(seed).replace("0x", "").toUpperCase()}`;

    setOwnershipMap((prev) => ({ ...prev, [productId]: "Farmer" }));
    addBlock({
      productId,
      actor: "Nursery",
      type: "REGISTER_AND_TRANSFER",
      payload: { productName, seedType, nurseryLocation, nextOwner: "Farmer" },
    });

    setStatus(`Nursery: registered ${productId} and transferred ownership to Farmer.`);
    setNurseryForm({ productName: "", seedType: "", nurseryLocation: "" });
  };

  const updateFarmer = (e) => {
    e.preventDefault();
    const { productId, fertilizer, harvestDate, farmLocation } = farmerForm;
    if (!productId || !fertilizer || !harvestDate || !farmLocation) {
      setStatus("Farmer: fill all fields before updating.");
      return;
    }
    if (ownershipMap[productId] !== "Farmer") {
      setStatus(`Farmer: ownership mismatch for ${productId}. Current owner is ${ownershipMap[productId] || "unknown"}.`);
      return;
    }

    setOwnershipMap((prev) => ({ ...prev, [productId]: "Transport" }));
    addBlock({
      productId,
      actor: "Farmer",
      type: "CULTIVATION_AND_TRANSFER",
      payload: { fertilizer, harvestDate, farmLocation, nextOwner: "Transport" },
    });
    setStatus(`Farmer: updated cultivation for ${productId}, transferred to Transport.`);
    setFarmerForm({ productId: "", fertilizer: "", harvestDate: "", farmLocation: "" });
  };

  const updateTransport = (e) => {
    e.preventDefault();
    const { productId, location, dispatchDate, condition } = transportForm;
    if (!productId || !location || !dispatchDate || !condition) {
      setStatus("Transport: fill all fields before updating.");
      return;
    }
    if (ownershipMap[productId] !== "Transport") {
      setStatus(
        `Transport: ownership mismatch for ${productId}. Current owner is ${ownershipMap[productId] || "unknown"}.`
      );
      return;
    }

    setOwnershipMap((prev) => ({ ...prev, [productId]: "Customer" }));
    addBlock({
      productId,
      actor: "Transport",
      type: "SHIPMENT_AND_TRANSFER",
      payload: { location, dispatchDate, condition, nextOwner: "Customer" },
    });
    setStatus(`Transport: shipping update saved for ${productId}, transferred to Customer.`);
    setTransportForm({ productId: "", location: "", dispatchDate: "", condition: "" });
  };

  const customerHistory = useMemo(
    () => ledger.filter((block) => block.productId === customerSearchId.trim()),
    [customerSearchId, ledger]
  );

  const verifyIntegrity = (history) => {
    if (history.length === 0) {
      setStatus("Customer: no records found for Product ID.");
      setTamperedIndex(null);
      return;
    }

    for (let i = 0; i < history.length; i += 1) {
      const block = history[i];
      const expectedHash = makeBlockHash(block);
      if (block.hash !== expectedHash) {
        setTamperedIndex(block.index);
        setStatus(`Tamper detected at block #${block.index}: hash mismatch.`);
        return;
      }

      if (i > 0 && block.previousHash !== history[i - 1].hash) {
        setTamperedIndex(block.index);
        setStatus(`Tamper detected at block #${block.index}: previous hash chain broken.`);
        return;
      }
    }

    setTamperedIndex(null);
    setStatus("Customer: blockchain history verified. No tampering detected.");
  };

  const roleCard = () => {
    if (activeRole === "Nursery") {
      return (
        <form onSubmit={registerAtNursery} className="panel-form">
          <h3>Nursery Node</h3>
          <input
            value={nurseryForm.productName}
            onChange={(e) => setNurseryForm((prev) => ({ ...prev, productName: e.target.value }))}
            placeholder="Plant / Product Name"
          />
          <input
            value={nurseryForm.seedType}
            onChange={(e) => setNurseryForm((prev) => ({ ...prev, seedType: e.target.value }))}
            placeholder="Seed Type"
          />
          <input
            value={nurseryForm.nurseryLocation}
            onChange={(e) => setNurseryForm((prev) => ({ ...prev, nurseryLocation: e.target.value }))}
            placeholder="Nursery Location"
          />
          <button type="submit">Register on Blockchain</button>
        </form>
      );
    }

    if (activeRole === "Farmer") {
      return (
        <form onSubmit={updateFarmer} className="panel-form">
          <h3>Farmer Node</h3>
          <input
            value={farmerForm.productId}
            onChange={(e) => setFarmerForm((prev) => ({ ...prev, productId: e.target.value }))}
            placeholder="Product ID"
          />
          <input
            value={farmerForm.fertilizer}
            onChange={(e) => setFarmerForm((prev) => ({ ...prev, fertilizer: e.target.value }))}
            placeholder="Fertilizer Used"
          />
          <input
            type="date"
            value={farmerForm.harvestDate}
            onChange={(e) => setFarmerForm((prev) => ({ ...prev, harvestDate: e.target.value }))}
          />
          <input
            value={farmerForm.farmLocation}
            onChange={(e) => setFarmerForm((prev) => ({ ...prev, farmLocation: e.target.value }))}
            placeholder="Farm Location"
          />
          <button type="submit">Update + Transfer to Transport</button>
        </form>
      );
    }

    if (activeRole === "Transport") {
      return (
        <form onSubmit={updateTransport} className="panel-form">
          <h3>Transport Node</h3>
          <input
            value={transportForm.productId}
            onChange={(e) => setTransportForm((prev) => ({ ...prev, productId: e.target.value }))}
            placeholder="Product ID"
          />
          <input
            value={transportForm.location}
            onChange={(e) => setTransportForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Current Location"
          />
          <input
            type="date"
            value={transportForm.dispatchDate}
            onChange={(e) => setTransportForm((prev) => ({ ...prev, dispatchDate: e.target.value }))}
          />
          <input
            value={transportForm.condition}
            onChange={(e) => setTransportForm((prev) => ({ ...prev, condition: e.target.value }))}
            placeholder="Condition (Fresh/Cold/etc.)"
          />
          <button type="submit">Update + Transfer to Customer</button>
        </form>
      );
    }

    return (
      <div className="panel-form">
        <h3>Customer Node</h3>
        <input
          value={customerSearchId}
          onChange={(e) => setCustomerSearchId(e.target.value)}
          placeholder="Enter Product ID"
        />
        <button type="button" onClick={() => verifyIntegrity(customerHistory)}>
          Verify Integrity
        </button>

        <div className="history-list">
          <h4>Product Journey</h4>
          {customerHistory.length === 0 && <p>No matching ledger entries.</p>}
          {customerHistory.map((entry) => (
            <div key={entry.index} className={`history-item ${tamperedIndex === entry.index ? "tampered" : ""}`}>
              <strong>#{entry.index}</strong> {entry.actor} · {entry.type}
              <div className="muted">{new Date(entry.timestamp).toLocaleString()}</div>
              <div className="muted">hash: {entry.hash}</div>
              <div className="muted">prev: {entry.previousHash}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header>
        <h1>Blockchain-Based Agriculture Supply Chain Management System</h1>
        <p>Track products from Nursery → Farmer → Transport → Customer with tamper checks.</p>
      </header>

      <section className="role-switch">
        <label htmlFor="role-select">Role Login</label>
        <select id="role-select" value={activeRole} onChange={(e) => setActiveRole(e.target.value)}>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </section>

      <main className="workspace">
        {roleCard()}

        <aside className="ledger-panel">
          <h3>Blockchain Ledger</h3>
          <p>Total Blocks: {ledger.length}</p>
          <ul>
            {ledger
              .slice()
              .reverse()
              .map((block) => (
                <li key={block.index}>
                  <strong>#{block.index}</strong> {block.actor} - {block.productId}
                </li>
              ))}
          </ul>
        </aside>
      </main>

      <footer className="status">Status: {status}</footer>
    </div>
  );
};

export default App;
