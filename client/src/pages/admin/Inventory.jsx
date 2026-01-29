import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { Plus, Search, Edit, Trash2, Package, Eye } from 'lucide-react';
import { getItems, deleteItem, updateItem } from '../../utils/api';

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['items', searchTerm, statusFilter],
    queryFn: () => getItems({
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 100
    })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
      alert('Item deleted successfully');
    },
    onError: (error) => {
      alert('Failed to delete item: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
      setShowEditModal(false);
      setSelectedItem(null);
      alert('Item updated successfully');
    },
    onError: (error) => {
      alert('Failed to update item: ' + error.message);
    }
  });

  const items = itemsData?.data?.items || [];

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpdateStatus = (status) => {
    if (selectedItem) {
      updateMutation.mutate({
        id: selectedItem._id,
        data: { statusCode: status }
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: 'success',
      sold: 'secondary',
      listed: 'primary',
      hold: 'warning',
      draft: 'light',
      archived: 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h1 className="display-6 fw-bold">Inventory Management</h1>
            <p className="text-muted">Manage your product inventory from the items collection</p>
          </Col>
          <Col xs="auto">
            <Button variant="primary" size="lg">
              <Plus size={20} className="me-2" />
              Add Item
            </Button>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <Search size={18} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by description, manufacturer, model, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="listed">Listed</option>
                  <option value="sold">Sold</option>
                  <option value="hold">On Hold</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <div className="text-end">
                  <strong>Total Items: </strong>
                  <Badge bg="primary" className="fs-6">{items.length}</Badge>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Items Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-5">
                <Package size={64} className="text-muted mb-3" />
                <h3>No items found</h3>
                <p className="text-muted">Try adjusting your filters or add your first item</p>
                <Button variant="primary" className="mt-3">
                  <Plus size={18} className="me-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Item Description</th>
                      <th>Manufacturer</th>
                      <th>Model</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-semibold">{item.itemDescr}</div>
                          {item.serialNum && (
                            <small className="text-muted">SN: {item.serialNum}</small>
                          )}
                        </td>
                        <td>{item.manufacturer || '-'}</td>
                        <td>{item.model || '-'}</td>
                        <td>
                          <code className="small">{item.sku || item.internalSku || '-'}</code>
                        </td>
                        <td>
                          {item.price?.amount ? (
                            <strong className="text-success">
                              ${item.price.amount.toFixed(2)}
                            </strong>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <Badge bg="info">{item.qty || 1}</Badge>
                        </td>
                        <td>
                          {item.binId?.label || 'N/A'}
                        </td>
                        <td>{getStatusBadge(item.statusCode)}</td>
                        <td>
                          <div className="d-flex gap-2 justify-content-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleView(item)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* View Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Item Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <div>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Description:</strong>
                    <p>{selectedItem.itemDescr}</p>
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong>
                    <div>{getStatusBadge(selectedItem.statusCode)}</div>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={4}>
                    <strong>Manufacturer:</strong>
                    <p>{selectedItem.manufacturer || 'N/A'}</p>
                  </Col>
                  <Col md={4}>
                    <strong>Model:</strong>
                    <p>{selectedItem.model || 'N/A'}</p>
                  </Col>
                  <Col md={4}>
                    <strong>Serial Number:</strong>
                    <p>{selectedItem.serialNum || 'N/A'}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={4}>
                    <strong>SKU:</strong>
                    <p><code>{selectedItem.sku || selectedItem.internalSku || 'N/A'}</code></p>
                  </Col>
                  <Col md={4}>
                    <strong>Price:</strong>
                    <p className="text-success fw-bold">
                      ${selectedItem.price?.amount?.toFixed(2) || '0.00'}
                    </p>
                  </Col>
                  <Col md={4}>
                    <strong>Quantity:</strong>
                    <p><Badge bg="info">{selectedItem.qty || 1}</Badge></p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Dimensions (L×W×H):</strong>
                    <p>
                      {selectedItem.dimsIn?.length || 0}" × 
                      {selectedItem.dimsIn?.width || 0}" × 
                      {selectedItem.dimsIn?.height || 0}"
                    </p>
                  </Col>
                  <Col md={6}>
                    <strong>Weight:</strong>
                    <p>
                      {selectedItem.weight?.pounds || 0} lbs 
                      {selectedItem.weight?.ounces || 0} oz
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <strong>Location:</strong>
                    <p>{selectedItem.binId?.label || 'Not assigned'}</p>
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Item Status</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <div>
                <p><strong>Item:</strong> {selectedItem.itemDescr}</p>
                <p><strong>Current Status:</strong> {getStatusBadge(selectedItem.statusCode)}</p>
                <hr />
                <p className="text-muted">Select new status:</p>
                <div className="d-grid gap-2">
                  <Button
                    variant="success"
                    onClick={() => handleUpdateStatus('available')}
                  >
                    Available
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateStatus('listed')}
                  >
                    Listed
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => handleUpdateStatus('hold')}
                  >
                    On Hold
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus('sold')}
                  >
                    Sold
                  </Button>
                  <Button
                    variant="dark"
                    onClick={() => handleUpdateStatus('archived')}
                  >
                    Archived
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}