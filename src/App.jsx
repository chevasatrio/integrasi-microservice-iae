import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar      from './components/Navbar';
import UsersPage   from './pages/usersPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage  from './pages/OrdersPage';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/"        element={<Navigate to="/orders" />} />
                <Route path="/users"   element={<UsersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/orders"  element={<OrdersPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;