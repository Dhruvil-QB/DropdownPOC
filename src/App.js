import { useState } from "react";
import "./App.css";
import Dropdown from "./Common/DropDown.tsx";

const roles = [
  { id: 1, value: "Admin", title: "testxxx" },
  { id: 2, value: "Doctor", title: "testeee" },
  { id: 3, value: "Patient", title: "testccccc" },
];
function App() {
  const [selected, setSelected] = useState([]);
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [selectedTodoss, setSelectedTodoss] = useState([]);

  return (
    <div className="App">
      <Dropdown
        options={roles}
        labelKey="value"
        searchKeys={["title"]}
        valueKey="id"
        placeholder="Select roles"
        selectedValues={selected}
        onChange={(values) => {
          console.log("🚀 ~ App ~ values:", values);
          return setSelected(values);
        }}
      />
      <Dropdown
        apiUrl="https://jsonplaceholder.typicode.com/todos"
        labelKey="title"
        valueKey="id"
        selectedValues={selectedTodoss}
        apiSearch
        onChange={(values) => {
          console.log("Selected Todo IDs:", values);
          setSelectedTodoss(values);
        }}
      />
      <Dropdown
        // apiUrl="https://api.salesbot.cloud/core/persona/"
        apiUrl="https://api.salesbot.cloud/onboard/city/fetch_all/"
        labelKey="label"
        valueKey="value"
        selectedValues={selectedTodos}
        apiSearch
        multiple={true}
        onChange={(values) => {
          console.log("Selected Todo IDs:", values);
          setSelectedTodos(values);
        }}
      />
    </div>
  );
}

export default App;
