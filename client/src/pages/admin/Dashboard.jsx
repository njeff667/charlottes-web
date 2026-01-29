import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { getPlatformStats, getActiveListings, getPendingApprovals, getItemStats } from '../../utils/api';

export default function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['platformStats'],
    queryFn: getPlatformStats
  });

  const { data: itemStatsData } = useQuery({
    queryKey: ['itemStats'],
    queryFn: getItemStats
  });

  const { data: listingsData } = useQuery({
    queryKey: ['activeListings'],
    queryFn: () => getActiveListings({ limit: 10 })
  });

  const { data: approvalsData } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: getPendingApprovals
  });

  const stats = statsData?.data?.stats || {};
  const itemStats = itemStatsData?.data?.stats || {};
  const listings = listingsData?.data?.listings || [];
  const approvals = approvalsData?.data?.notifications || [];

  // Calculate totals
  const totalActiveListings = Object.values(stats).reduce((sum, platform) => 
    sum + (platform.activeListings || 0), 0
  );
  const totalSales = Object.values(stats).reduce((sum, platform) => 
    sum + (platform.totalSales || 0), 0
  );
  const totalRevenue = Object.values(stats).reduce((sum, platform) => 
    sum + (platform.totalRevenue || 0), 0
  );

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid>
        {/* Header */}
        <div className="mb-4">
          <h1 className="display-6 fw-bold">Admin Dashboard</h1>
          <p className="text-muted">
            Manage your multi-platform inventory and listings
          </p>
        </div>

        {/* Quick Stats */}
        <Row className="g-4 mb-4">
          <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Total Items</p>
                    <h2 className="fw-bold mb-0">{itemStats.totalItems || 0}</h2>
                    <small className="text-success">
                      {itemStats.availableItems || 0} available
                    </small>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <Package className="text-primary" size={24} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Active Listings</p>
                    <h2 className="fw-bold mb-0">{totalActiveListings}</h2>
                    <small className="text-info">
                      Across all platforms
                    </small>
                  </div>
                  <div className="bg-success bg-opacity-10 p-3 rounded">
                    <TrendingUp className="text-success" size={24} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Total Sales</p>
                    <h2 className="fw-bold mb-0">{totalSales + (itemStats.soldItems || 0)}</h2>
                    <small className="text-success">
                      Items sold
                    </small>
                  </div>
                  <div className="bg-info bg-opacity-10 p-3 rounded">
                    <ShoppingBag className="text-info" size={24} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1 small">Inventory Value</p>
                    <h2 className="fw-bold mb-0">
                      ${(itemStats.totalValue || 0).toFixed(2)}
                    </h2>
                    <small className="text-muted">
                      Available + Listed
                    </small>
                  </div>
                  <div className="bg-warning bg-opacity-10 p-3 rounded">
                    <DollarSign className="text-warning" size={24} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Pending Approvals Alert */}
        {approvals.length > 0 && (
          <Card className="border-warning shadow-sm mb-4">
            <Card.Body className="bg-warning bg-opacity-10">
              <div className="d-flex align-items-center">
                <AlertCircle className="text-warning me-3" size={32} />
                <div className="flex-grow-1">
                  <h5 className="mb-1">Pending Approvals</h5>
                  <p className="mb-0 text-muted">
                    You have {approvals.length} third-party action(s) requiring approval
                  </p>
                </div>
                <Button as={Link} to="/admin/notifications" variant="warning">
                  Review Now
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Platform Status */}
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <h5 className="mb-0 fw-bold">Platform Status</h5>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {Object.entries(stats).length === 0 ? (
                <Col>
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">No platforms configured yet</p>
                    <Button as={Link} to="/admin/platforms" variant="primary">
                      Configure Platforms
                    </Button>
                  </div>
                </Col>
              ) : (
                Object.entries(stats).map(([platform, data]) => (
                  <Col md={6} lg={3} key={platform}>
                    <Card className="border h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 text-capitalize fw-bold">{platform}</h6>
                          <div className={`rounded-circle ${
                            data.isConnected ? 'bg-success' : 'bg-danger'
                          }`} style={{ width: '12px', height: '12px' }} />
                        </div>
                        <div className="small">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Active:</span>
                            <Badge bg="primary">{data.activeListings || 0}</Badge>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted">Sales:</span>
                            <Badge bg="success">{data.totalSales || 0}</Badge>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Revenue:</span>
                            <span className="fw-semibold">${(data.totalRevenue || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Quick Actions */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-shadow" style={{ cursor: 'pointer' }} as={Link} to="/admin/inventory" className="text-decoration-none">
              <Card.Body className="text-center py-4">
                <Package className="text-primary mb-3" size={48} />
                <h5 className="fw-bold text-dark">Manage Inventory</h5>
                <p className="text-muted small mb-0">
                  Add, edit, and organize your product inventory
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-shadow" style={{ cursor: 'pointer' }} as={Link} to="/admin/listings" className="text-decoration-none">
              <Card.Body className="text-center py-4">
                <TrendingUp className="text-success mb-3" size={48} />
                <h5 className="fw-bold text-dark">Multi-Platform Listings</h5>
                <p className="text-muted small mb-0">
                  Create and manage listings across all platforms
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm h-100 hover-shadow" style={{ cursor: 'pointer' }} as={Link} to="/admin/platforms" className="text-decoration-none">
              <Card.Body className="text-center py-4">
                <CheckCircle className="text-info mb-3" size={48} />
                <h5 className="fw-bold text-dark">Platform Settings</h5>
                <p className="text-muted small mb-0">
                  Configure and manage platform connections
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Listings */}
        <Card className="shadow-sm">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Recent Listings</h5>
            <Button as={Link} to="/admin/listings" variant="link" size="sm">
              View All
            </Button>
          </Card.Header>
          <Card.Body className="p-0">
            {listings.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-3">No active listings yet</p>
                <Button as={Link} to="/admin/listings" variant="primary">
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Platform</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Listed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.slice(0, 5).map((listing) => (
                      <tr key={listing._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {listing.product?.images?.[0] && (
                              <img
                                src={listing.product.images[0].url}
                                alt={listing.product.title}
                                className="rounded me-2"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            )}
                            <span className="fw-semibold">
                              {listing.product?.title || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary" className="text-capitalize">
                            {listing.platform}
                          </Badge>
                        </td>
                        <td className="fw-semibold text-success">
                          ${listing.price?.toFixed(2)}
                        </td>
                        <td>
                          <Badge bg={listing.status === 'active' ? 'success' : 'secondary'}>
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="text-muted small">
                          {listing.listedAt 
                            ? new Date(listing.listedAt).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm">
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}