import React ,{ Component } from "react";
import { Routes,Route,Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from './components/home.component';
//import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <a href="/" className="navbar-brand">
            Home
          </a>
          
        </nav>

        <div className="container mt-3">
          <Routes>
            <Route exact path="/" component={Home} />
            
          </Routes>
        </div>
        <Home/>
      </div>
    );
  }
}

export default App;
