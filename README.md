# Smart Inventory Management System

A full-stack inventory management application with real-time stock monitoring, automated low-stock alerts, fast-depletion detection, and analytics across multiple warehouses.

## Live Demo

- **Frontend:** https://smart-inventory-management-1-83yw.onrender.com/
- **Backend API:** https://smart-inventory-management-upha.onrender.com
- **API Documentation:** https://smart-inventory-management-upha.onrender.com/docs

> **Note:** Render free-tier services may take a short time to respond after being idle.

## Features

- **Product Management:** Create, update, and manage products with unique SKUs and configurable minimum stock thresholds.
- **Warehouse Management:** Manage multiple warehouses and their inventory.
- **Inventory Tracking:** Monitor available stock across products and warehouses.
- **Stock Movements:** Record inbound and outbound stock movements with movement history.
- **Automated Alerts:** Detect low-stock and fast-depleting inventory.
- **Alert Lifecycle:** Automatically create, maintain, and resolve alerts.
- **Real-Time Updates:** WebSocket-based updates when inventory changes.
- **Analytics Dashboard:** Visualize stock distribution, movements, and alert statistics.
- **Concurrency Handling:** Database transactions and row-level locking to prevent conflicting stock updates.
- **Docker Support:** Start the FastAPI backend and PostgreSQL database together using Docker Compose.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Recharts |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Real-time Communication | WebSockets |
| Background Processing | APScheduler |
| Database Migrations | Alembic |
| Containerization | Docker, Docker Compose |
| API Documentation | Swagger / OpenAPI |

## Architecture

The application separates inventory operations from alert evaluation.

```text
                 React Dashboard
                        |
                 REST API / WebSocket
                        |
              +---------------------+
              |    FastAPI Backend  |
              |                     |
              |  +---------------+  |
              |  | CRUD Layer    |  |
              |  +---------------+  |
              |                     |
              |  +---------------+  |
              |  | Alert Service |  |
              |  +---------------+  |
              |                     |
              |  +---------------+  |
              |  | WebSocket     |  |
              |  | Manager       |  |
              |  +---------------+  |
              +---------------------+
                        |
                   PostgreSQL
                        |
                 Alert Scheduler
```

### Separation of Concerns

- **CRUD Layer:** Handles products, warehouses, inventory, and stock movements.
- **Alert Service:** Evaluates inventory conditions and manages alert creation and resolution.
- **Scheduler:** Periodically reevaluates alerts so time-based conditions can expire without requiring another stock movement.
- **WebSocket Manager:** Broadcasts inventory and alert updates to connected dashboard clients.

### Docker Architecture

Docker Compose manages the backend API and PostgreSQL database.

```text
              Docker Compose
                     |
          +----------+----------+
          |                     |
     FastAPI API           PostgreSQL
          |                     |
          +----------+----------+
                     |
              Persistent Volume
```

The API connects to PostgreSQL through the internal Docker Compose network. Database migrations are executed automatically before the API starts.

The React frontend currently runs separately using Vite.

## Database Design

The application uses PostgreSQL with the following entities:

| Table | Description |
|---|---|
| products | Product information, SKU, and minimum stock threshold |
| warehouses | Warehouse details and location |
| inventory | Current quantity for each product at each warehouse |
| stock_movements | Historical inbound and outbound transactions |
| alerts | Alert type, severity, status, and timestamps |

### Relationships

- One product can have inventory records in multiple warehouses.
- One warehouse can contain multiple products.
- Each inventory record belongs to one product and one warehouse.
- Stock movements reference the product and warehouse involved.
- Alerts reference the affected product and warehouse.

A unique constraint on `(product_id, warehouse_id)` prevents duplicate inventory records for the same product and warehouse.

Database constraints also prevent negative inventory quantities and invalid stock movement quantities.

## Alerting Logic

Alert evaluation is implemented in a separate Python service module rather than being embedded in API route handlers.

### 1. Low-Stock Detection

An alert is generated when:

```text
available_quantity <= minimum_stock
```

The alert is resolved when available stock rises above the configured minimum threshold.

### 2. Fast-Depletion Detection

The alert service calculates outbound stock movements over a rolling one-hour window.

When the total outbound quantity reaches the configured threshold of 30 units per hour, a fast-depletion alert is generated.

The alert is reevaluated periodically by APScheduler. It can be resolved when the recent outbound movement total falls below the threshold.

### Alert Severity

The alert service assigns severity according to the applicable alert rules and inventory conditions.

## Real-Time Communication: WebSockets vs Polling

This application uses WebSockets for real-time dashboard updates.

### WebSockets

A persistent connection is established between the browser and backend. When inventory changes, the backend broadcasts an event to connected clients.

**Advantages:**
- Immediate updates without repeatedly requesting data.
- Lower unnecessary request overhead.
- Useful for dashboards accessed by multiple users.

### Polling

An alternative would be polling the REST API at fixed intervals.

**Advantages:**
- Simpler implementation.
- Easier infrastructure and connection management.

**Disadvantages:**
- Updates are delayed until the next polling interval.
- Repeated requests are made even when no data changes.

### Why WebSockets?

Inventory changes and alerts should be reflected quickly across connected dashboards. WebSockets are therefore a suitable choice for this application.

REST APIs remain responsible for CRUD operations, while WebSockets communicate changes.

## Concurrency Handling

Concurrent updates to the same inventory record can cause race conditions and incorrect stock quantities.

The application uses database transactions and PostgreSQL row-level locking through SQLAlchemy's `SELECT FOR UPDATE` (`with_for_update()`).

For a stock movement:

1. Begin a database transaction.
2. Lock the relevant inventory row.
3. Validate the requested movement.
4. Check that sufficient stock exists for outbound movements.
5. Update the inventory quantity.
6. Record the stock movement.
7. Evaluate applicable alerts.
8. Commit the transaction.

This ensures that concurrent operations on the same inventory record are serialized and that outbound movements cannot reduce stock below zero.

Database constraints provide additional protection against invalid quantities.

## API Endpoints

### Products

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/products/` | Create a product |
| GET | `/api/products/` | List products |
| GET | `/api/products/{id}` | Get product details |
| PATCH | `/api/products/{id}` | Update product details |
| DELETE | `/api/products/{id}` | Delete a product when no related records exist |

### Warehouses

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/warehouses/` | Create a warehouse |
| GET | `/api/warehouses/` | List warehouses |
| PATCH | `/api/warehouses/{id}` | Update warehouse details |
| DELETE | `/api/warehouses/{id}` | Delete a warehouse when no related records exist |

### Inventory and Stock Movements

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/inventory/` | Create an inventory record |
| GET | `/api/inventory/` | List inventory |
| PATCH | `/api/inventory/{id}` | Update available quantity |
| DELETE | `/api/inventory/{id}` | Delete an eligible inventory record |
| POST | `/api/inventory/{id}/movement` | Record a stock movement |
| GET | `/api/inventory/movements` | Get movement history |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/alerts/` | List alerts |
| GET | `/api/alerts/active` | List active alerts |

### WebSocket

| Type | Endpoint | Description |
|---|---|---|
| WS | `/ws/inventory` | Receive real-time inventory updates |

Interactive API documentation is available through FastAPI Swagger UI at `/docs`.

## Getting Started

There are two ways to run the application locally:

1. Docker Compose (recommended).
2. Manual setup using Python and PostgreSQL.

## Running with Docker Compose (Recommended)

Docker Compose starts the FastAPI backend and PostgreSQL database together.

### Prerequisites

- Docker Desktop
- Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/manas541/smart-inventory-management.git
cd smart-inventory-management
```

### 2. Start the backend and database

From the project root, execute:

```bash
docker compose up --build -d
```

Docker Compose will:

1. Build the FastAPI backend image.
2. Start the PostgreSQL container.
3. Wait for the database health check.
4. Run Alembic migrations automatically.
5. Start the FastAPI application.

### 3. Access the services

| Service | URL |
|---|---|
| Backend API | http://localhost:8001 |
| Health Check | http://localhost:8001/health |
| Swagger Documentation | http://localhost:8001/docs |
| PostgreSQL | localhost:5433 |

### 4. Start the React frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://127.0.0.1:8001
VITE_WS_URL=ws://127.0.0.1:8001/ws/inventory
```

The frontend will be available at:

```text
http://localhost:5173
```

### Useful Docker Commands

Check running containers:

```bash
docker compose ps
```

View API logs:

```bash
docker compose logs -f api
```

View database logs:

```bash
docker compose logs -f db
```

Stop the containers:

```bash
docker compose down
```

Stop containers and remove the database volume:

```bash
docker compose down -v
```

> **Warning:** The `-v` option deletes the persistent PostgreSQL data. Use it only when you intentionally want to reset the database.

### Database Persistence

PostgreSQL data is stored in a named Docker volume called `inventory_data`.

This allows database records to persist when containers are stopped and restarted.

The API connects to PostgreSQL through the Docker Compose service hostname `db`, using the internal container network.

### Docker Configuration

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Builds the FastAPI backend image |
| `backend/.dockerignore` | Excludes unnecessary files and local environment secrets |
| `docker-compose.yml` | Defines API and PostgreSQL services, networking, health checks, and persistent storage |

## Manual Local Setup

Docker is not mandatory for running the application. You can also run the backend using a Python virtual environment and a locally installed PostgreSQL database.

### Prerequisites

- Python 3.11+
- Node.js and npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/manas541/smart-inventory-management.git
cd smart-inventory-management
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory:

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/smart_inventory
```

Create a PostgreSQL database named `smart_inventory`, then run migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload --port 8001
```

- Backend: http://localhost:8001
- Swagger UI: http://localhost:8001/docs

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend directory:

```env
VITE_API_URL=http://127.0.0.1:8001
VITE_WS_URL=ws://127.0.0.1:8001/ws/inventory
```

Start the frontend:

```bash
npm run dev
```

Frontend: http://localhost:5173

## Background Alert Evaluation

APScheduler runs periodic alert evaluation independently of incoming stock movements.

This ensures that time-dependent alerts, such as fast-depletion alerts, can be reevaluated and resolved even when no new inventory operation occurs.

## Known Limitations

- The WebSocket manager currently uses in-memory connection management and is designed for a single backend instance. A distributed deployment would require a shared message broker or pub/sub mechanism.
- Kafka-based event streaming is not implemented. It could be introduced when event volume and independent consumer requirements justify it.
- The current alerting system uses configurable rule-based detection rather than a trained ML forecasting model.
- Demand forecasting has not been implemented because meaningful historical demand data is not yet available.
- Scheduler execution is process-local. Multiple backend replicas would require a single scheduler instance or distributed scheduling mechanism.
- Authentication and role-based authorization are not currently implemented.
- The React frontend is not included in the Docker Compose setup and currently runs separately using Vite.
- The Docker Compose configuration is intended for local development and evaluation, not production deployment.

## Future Improvements

- ML-based demand forecasting using historical stock movements.
- Kafka with a transactional outbox for reliable event distribution.
- Redis Pub/Sub for WebSocket broadcasting across multiple backend instances.
- Authentication and role-based access control.
- Automated reorder recommendations based on predicted demand.
- Containerization of the React frontend and production-ready deployment configuration.

## Author

**Manas Purohit**

GitHub: https://github.com/manas541