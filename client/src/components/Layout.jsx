import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { ShoppingCart, Home, Store, Info, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Header */}
      <Navbar bg="white" expand="lg" className="shadow-sm sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary fs-4">
            Charlotte's Web
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link
                as={Link}
                to="/"
                className={location.pathname === '/' ? 'text-primary fw-semibold' : ''}
              >
                <Home size={18} className="me-1" />
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/store"
                className={location.pathname === '/store' ? 'text-primary fw-semibold' : ''}
              >
                <Store size={18} className="me-1" />
                Store
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/about"
                className={location.pathname === '/about' ? 'text-primary fw-semibold' : ''}
              >
                <Info size={18} className="me-1" />
                About
              </Nav.Link>
              
              {user ? (
                <NavDropdown
                  title={
                    <span>
                      <User size={18} className="me-1" />
                      {user.name || 'Admin'}
                    </span>
                  }
                  id="user-dropdown"
                  className={isAdmin ? 'text-primary fw-semibold' : ''}
                >
                  <NavDropdown.Item as={Link} to="/admin">
                    Dashboard
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/inventory">
                    Inventory
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/listings">
                    Listings
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/admin/platforms">
                    Platforms
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <LogOut size={18} className="me-1" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login">
                  <User size={18} className="me-1" />
                  Login
                </Nav.Link>
              )}
              
              <Nav.Link as={Link} to="/cart" className="ms-2">
                <Button variant="outline-primary" size="sm">
                  <ShoppingCart size={18} className="me-1" />
                  Cart
                </Button>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-5 mt-auto">
        <Container>
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <h5 className="fw-bold mb-3">Charlotte's Web</h5>
              <p className="text-white-50">
                Re-homing quality items with care and purpose.
              </p>
            </div>
            <div className="col-md-4 mb-4 mb-md-0">
              <h5 className="fw-bold mb-3">Quick Links</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/store" className="text-white-50 text-decoration-none">
                    Shop
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/about" className="text-white-50 text-decoration-none">
                    About Us
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/admin" className="text-white-50 text-decoration-none">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5 className="fw-bold mb-3">Contact</h5>
              <p className="text-white-50">
                Questions? Reach out to us anytime.
              </p>
            </div>
          </div>
          <hr className="border-secondary my-4" />
          <div className="text-center text-white-50">
            <p className="mb-0">&copy; 2024 Charlotte's Web. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}