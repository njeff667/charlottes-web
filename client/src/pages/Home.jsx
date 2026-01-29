import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { ArrowRight, Package, ShoppingBag, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-5" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="display-3 fw-bold mb-4">
                Welcome to Charlotte's Web
              </h1>
              <p className="lead mb-4 fs-4">
                Re-homing quality items with care and purpose
              </p>
              <p className="fs-5 mb-5 opacity-75">
                Discover new and like-new items from our storage unit collection. 
                Each item has a story, and we're here to help them find their new home.
              </p>
              <Button
                as={Link}
                to="/store"
                variant="light"
                size="lg"
                className="px-5 py-3 fw-semibold"
              >
                Shop Now <ArrowRight size={20} className="ms-2" />
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <h2 className="display-5 fw-bold text-center mb-5">Why Shop With Us?</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100 text-center">
                <Card.Body className="p-4">
                  <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                    <Package className="text-primary" size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Quality Items</h4>
                  <p className="text-muted">
                    Many items are new or like-new, never been opened. We carefully inspect everything.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100 text-center">
                <Card.Body className="p-4">
                  <div className="bg-success bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                    <ShoppingBag className="text-success" size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">Great Prices</h4>
                  <p className="text-muted">
                    Affordable pricing on quality items. Find great deals on things you need.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100 text-center">
                <Card.Body className="p-4">
                  <div className="bg-danger bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                    <Heart className="text-danger" size={48} />
                  </div>
                  <h4 className="fw-bold mb-3">With Purpose</h4>
                  <p className="text-muted">
                    Every purchase helps us continue our mission of re-homing quality items with care.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <Container className="py-5">
          <Card className="border-0 shadow-lg text-white" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}>
            <Card.Body className="p-5 text-center">
              <h2 className="display-5 fw-bold mb-4">
                Ready to Find Your Next Treasure?
              </h2>
              <p className="lead mb-4 fs-5">
                Browse our collection of quality items waiting for their new home.
              </p>
              <Button
                as={Link}
                to="/store"
                variant="light"
                size="lg"
                className="px-5 py-3 fw-semibold"
              >
                Browse Store <ArrowRight size={20} className="ms-2" />
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </section>

      {/* About Preview */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <h2 className="display-5 fw-bold mb-4">Our Story</h2>
              <p className="lead text-muted mb-4">
                Charlotte's Web began as a heartfelt project to re-home duplicate items 
                collected over the years. What started as a storage unit full of quality 
                items has become a mission to help these products find new homes where 
                they'll be appreciated and used.
              </p>
              <Button
                as={Link}
                to="/about"
                variant="primary"
                size="lg"
                className="px-4"
              >
                Learn More About Us <ArrowRight size={18} className="ms-2" />
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}