import { useState } from "react";
import "./App.css";
import CommonDropdown from "./Common/CommonDropDown.tsx";

const roles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Doctor" },
  { id: 3, name: "Receptionist" },
];
function App() {
  const [role, setRole] = useState();
  const [patient, setPatient] = useState();

  return (
    <div className="form-card">
      <div className="form-field">
        <CommonDropdown
          label="Select Role"
          options={roles}
          value={role}
          onChange={setRole}
          labelKey="name"
          valueKey="id"
          placeholder="Choose role"
        />
      </div>

      <div className="form-field">
        <CommonDropdown
          label="Select Patient"
          apiUrl="https://api.salesbot.cloud/onboard/city/fetch_all/"
          value={patient}
          apiSearch
          onChange={setPatient}
          pageSize={100}
          labelKey="label"
          placeholder="Choose role"
          multiple
          valueKey="value"
        />
      </div>
    </div>
  );
}

export default App;
