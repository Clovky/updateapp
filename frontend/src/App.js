import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Actuall from "./Actuall";
import Login from "./Login";
import History from "./History";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/actuall" element={<Actuall />} />
        <Route path="/login" element={<Login />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
