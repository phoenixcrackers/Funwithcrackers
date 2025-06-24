import {Routes,Route} from 'react-router-dom';
import Home from "./Home/Home";
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import Tracking from './Admin/Tracking/Tracking';
import List from './Admin/List/List';
import Localcustomer from './Admin/Local Customer/Localcustomer';
import Report from './Admin/Report/Report';
import ProtectedRoute from './ProtectedRoute';

const AllRoutes = () =>{
    return(
        <Routes>
            <Route exact path="/" element={<Home/>}/>
            <Route exact path='/admin' element={<Login/>}/>
            <Route element={<ProtectedRoute />}>
                <Route exact path='/inventory' element={<Inventory/>}/>
                <Route exact path='/listing' element={<List/>}/>
                <Route exact path='/report' element={<Report/>}/>
                <Route exact path='/tracking' element={<Tracking/>}/>
                <Route exact path='/direct-customer' element={<Localcustomer/>}/>
            </Route>
        </Routes> 
    )
}

export default AllRoutes;