"use client";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Container, Form, Modal, Row, Spinner, Toast, ToastContainer } from "react-bootstrap";

const STATUSES = [
  { key: "BACKLOG", label: "Backlog" },
  { key: "TODO", label: "Todo" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_QA", label: "In QA" },
  { key: "READY_FOR_LIVE", label: "Ready for Live" },
  { key: "DONE", label: "Done" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

function computeNewPosition(prev, next) {
  if (prev == null && next == null) return 1000;
  if (prev == null) return next.position - 1;
  if (next == null) return prev.position + 1;
  return (prev.position + next.position) / 2;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s.key, []]));
    for (const t of tasks) {
      if (!map[t.status]) map[t.status] = [];
      map[t.status].push(t);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/tasks`);
        if (!res.ok) throw new Error("Failed to load tasks");
        const data = await res.json();
        setTasks(data);
      } catch (e) {
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openCreate() {
    setEditingTask(null);
    setForm({ title: "", description: "" });
    setModalOpen(true);
  }
  function openEdit(task) {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || "" });
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (title.length < 3 || title.length > 120) {
      setError("Title must be 3–120 characters");
      setShowToast(true);
      return;
    }
    try {
      if (editingTask) {
        const res = await fetch(`${API_BASE}/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: form.description }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const res = await fetch(`${API_BASE}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: form.description }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setTasks((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError("Save failed");
      setShowToast(true);
    }
  }

  async function handleDelete() {
    if (!editingTask) return;
    const id = editingTask.id;
    const prevTasks = tasks;
    setTasks((t) => t.filter((x) => x.id !== id));
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setModalOpen(false);
    } catch (e) {
      setError("Delete failed");
      setShowToast(true);
      setTasks(prevTasks);
    }
  }

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    if (sourceStatus === destStatus && destination.index === source.index) return;

    const current = tasks.find((t) => t.id === draggableId);
    const destTasks = grouped[destStatus];
    const prevNeighbor = destTasks[destination.index - 1] || null;
    const nextNeighbor = destTasks[destination.index] || null;
    const newPosition = computeNewPosition(prevNeighbor, nextNeighbor);

    const optimistic = tasks.map((t) => ({ ...t }));
    const idx = optimistic.findIndex((t) => t.id === draggableId);
    optimistic[idx].status = destStatus;
    optimistic[idx].position = newPosition;
    setTasks(optimistic);

    try {
      const res = await fetch(`${API_BASE}/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destStatus, position: newPosition }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError("Move failed");
      setShowToast(true);
      setTasks((prev) => prev.map((t) => (t.id === current.id ? current : t)));
    }
  }

  const statusStyles = {
    BACKLOG: { bg: '#eef6ff', border: '#bfdbfe' },
    TODO: { bg: '#fffbeb', border: '#fde68a' },
    IN_PROGRESS: { bg: '#f5f3ff', border: '#ddd6fe' },
    IN_QA: { bg: '#fdf2f8', border: '#fbcfe8' },
    READY_FOR_LIVE: { bg: '#ecfeff', border: '#a5f3fc' },
    DONE: { bg: '#ecfdf5', border: '#a7f3d0' },
  };

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <div className="d-flex align-items-center mb-4">
        <h3 className="me-auto mb-0">Kanban Task Management App</h3>
        <Button onClick={openCreate} variant="primary">+ Add Task</Button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><Spinner /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Row className="flex-nowrap" style={{ overflowX: "auto" }}>
            {STATUSES.map((s) => (
              <Col key={s.key} xs={10} sm={6} md={4} lg={2} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">{s.label}</h6>
                  <span className="badge bg-secondary">{grouped[s.key]?.length || 0}</span>
                </div>
                <Droppable droppableId={s.key}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded p-2 shadow-sm"
                      style={{
                        minHeight: 220,
                        backgroundColor: statusStyles[s.key].bg,
                        border: `1px solid ${statusStyles[s.key].border}`,
                      }}
                    >
                      {grouped[s.key] && grouped[s.key].length > 0 ? (
                        grouped[s.key].map((t, index) => (
                          <Draggable key={t.id} draggableId={t.id} index={index}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className="mb-2"
                              >
                                <Card onClick={() => openEdit(t)} className="shadow-sm border-0" style={{ borderLeft: `4px solid ${statusStyles[t.status].border}` }}>
                                  <Card.Body>
                                    <Card.Title className="fs-6 mb-1">{t.title}</Card.Title>
                                    {t.description && (
                                      <Card.Text className="text-muted small mb-0">
                                        {t.description.slice(0, 80)}
                                        {t.description.length > 80 ? "…" : ""}
                                      </Card.Text>
                                    )}
                                  </Card.Body>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <div className="text-center text-muted small py-3">No tasks yet</div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Col>
            ))}
          </Row>
        </DragDropContext>
      )}

      <Modal show={modalOpen} onHide={closeModal} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>{editingTask ? "Edit Task" : "New Task"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                required
                minLength={3}
                maxLength={120}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={10000}
              />
            </Form.Group>
            {editingTask && (
              <div className="mt-3 text-muted small">
                <div>Created: {dayjs(editingTask.createdAt).format("YYYY-MM-DD HH:mm")}</div>
                <div>Updated: {dayjs(editingTask.updatedAt).format("YYYY-MM-DD HH:mm")}</div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            {editingTask && (
              <Button variant="outline-danger" onClick={handleDelete} className="me-auto">
                Delete
              </Button>
            )}
            <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast bg="danger" onClose={() => setShowToast(false)} show={showToast} delay={4000} autohide>
          <Toast.Body className="text-white">{error}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
