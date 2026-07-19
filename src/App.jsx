import { BrowserRouter, Link, Routes, Route } from "react-router-dom";
import Classes from "@/pages/Classes";
import Attendance from "@/pages/Attendance";

function Home() {
  return <h1>Home Page</h1>;
}
function App() {
  <BrowserRouter>
    <nav>
      <Link to="/">Home</Link>
      <Link to="/classes">Classes</Link>
      <Link to="/attendance">Điểm danh</Link>
    </nav>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/classes" element={<Classes />} />
      <Route path="/attendance" element={<Attendance />} />
    </Routes>
  </BrowserRouter>;
}

export default App;
