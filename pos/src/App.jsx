import { BrowserRouter as Router , Routes, Route } from "react-router";
import { Auth, Home, Orders } from "./pages";
import Header from "./components/shared/Header";
import Tables from "./pages/Tables";
import TableOrder from "./pages/TableOrder";
function App() {

  return (
    <>
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/auth/:data" element={<Auth />} />
        <Route path="/Home/:data" element={<Home />} />
        <Route path="/Tables/:data" element={<Tables />} />
        <Route path="/Alerts/:data" element={<Home />} />
        <Route path="/More/:data" element={<Home />} />
        <Route path="/Orders/:data" element={<Orders />} />
        <Route path="/TableOrder/:data" element={<TableOrder />} />
      </Routes>
      
    </Router>
    </>
  )
}

export default App
