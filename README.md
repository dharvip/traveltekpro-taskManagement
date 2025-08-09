## Kanban Task Management App (React/Next.js + Node/Express + MongoDB)

Kanban-style task management application with drag-and-drop between statuses, CRUD operations, optimistic UI, and MongoDB persistence.

### Stack
- Client: Next.js (App Router), React, Bootstrap, @hello-pangea/dnd
- Server: Node.js, Express, Mongoose (MongoDB)
- DB: MongoDB Atlas (or local)

### Monorepo Layout
```
traveltekMern/
  server/
    controllers/
    models/
    routes/
    utils/
    index.js            # Express entrypoint
    package.json
    client/             # Next.js app
      app/
      public/
      package.json
```

### Features
- Create, edit, delete tasks
- Drag & drop reorder within a column and move across columns
- Statuses: Backlog, Todo, In Progress, In QA, Ready for Live, Done
- Optimistic UI with rollback on error
- Timestamps: createdAt, updatedAt
- Validation on server and basic checks on client

### API
Base URL: `http://localhost:8000/api`

- `POST /tasks` → create `{ title, description? }`
- `GET /tasks` → list all tasks
- `GET /tasks/:id` → get by id
- `PATCH /tasks/:id` → partial update `{ title?, description?, status?, position? }`
- `DELETE /tasks/:id` → delete
- `PATCH /tasks/:id/move` → optional move `{ toStatus, toPosition }`

Validation rules
- title: 3–120 chars (required on create)
- description: ≤ 10,000 chars
- status: one of BACKLOG | TODO | IN_PROGRESS | IN_QA | READY_FOR_LIVE | DONE
- position: number

### Environment Variables

Create `server/.env`:
```
PORT=8000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
# Optional: protect routes with a static token (omit to allow all)
API_TOKEN=your-dev-token
```

Create `server/client/.env.local` (optional, defaults are fine):
```
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
```

### Getting Started (Development)

1) Install dependencies
```
cd server && npm install
cd client && npm install
```

2) Run the servers (in two terminals)
```
# Terminal A (Express API)
cd server
npm run dev

# Terminal B (Next.js)
cd server/client
npm run dev
```

3) Open the app: `http://localhost:3000`

If you set `API_TOKEN` in the server, the client must send `Authorization: Bearer <token>` headers. You can add this easily in your fetch calls or proxy; by default this project leaves `API_TOKEN` unset so routes are open for local development.

### Production Notes
- Set proper `MONGO_URI` and secure `API_TOKEN`
- Build the client: `cd server/client && npm run build`
- Serve the API and client behind a reverse proxy (e.g., Nginx) or deploy separately

### Scripts
- Server: `npm run dev` (nodemon), `npm start`
- Client: `npm run dev`, `npm run build`, `npm start`

### License
MIT


