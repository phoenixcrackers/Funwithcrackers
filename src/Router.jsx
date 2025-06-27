import {Routes,Route} from 'react-router-dom';
import Home from "./Home/Home";
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import Tracking from './Admin/Tracking/Tracking';
import List from './Admin/List/List';
import Localcustomer from './Admin/Local Customer/Localcustomer';
import Report from './Admin/Report/Report';
import ProtectedRoute from './ProtectedRoute';
import Location from './Admin/Location/Location';
import Direct from './Admin/Direct/Direct';
import Dispatch from './Admin/Dispatch/Dispatch';
import Banner from './Admin/Banner/Banner';
import Safety from './Home/Safety';
import About from './Home/About';
import Contact from './Home/Contact';
import Booking from './Home/Booking';

const AllRoutes = () =>{
    return(
        <Routes>
            <Route exact path="/" element={<Home/>}/>
            <Route exact path='/admin' element={<Login/>}/>
            <Route exact path='/safety-tips' element={<Safety/>}/>
            <Route exact path='/booking' element={<Booking/>}/>
            <Route exact path='/about-us' element={<About/>}/>
            <Route exact path='/contact-us' element={<Contact/>}/>
            <Route element={<ProtectedRoute />}>
                <Route exact path='/inventory' element={<Inventory/>}/>
                <Route exact path='/listing' element={<List/>}/>
                <Route exact path='/report' element={<Report/>}/>
                <Route exact path='/tracking' element={<Tracking/>}/>
                <Route exact path='/direct-customer' element={<Localcustomer/>}/>
                <Route exact path='/location' element={<Location/>}/>
                <Route exact path='/direct-enquiry' element={<Direct/>}/>
                <Route exact path='/dispatch-customers' element={<Dispatch/>}/>
                <Route exact path='/banner' element={<Banner/>}/>
            </Route>
        </Routes> 
    )
}

export default AllRoutes;