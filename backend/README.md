
# Academic Analytics & Monitoring System - Backend

This is the complete Node.js and Express backend for the Academic Analytics & Monitoring System. It uses Supabase for its PostgreSQL database and JWT-based authentication.

## ✨ Features

- **Role-Based Access Control (RBAC)**: Segregated access for Faculty Advisors (FA), Academic Advisors (AA), Heads of Department (HOD), and Admins.
- **Data Upload**: FAs can upload student data, performance, and attendance via CSV files.
- **Powerful Analytics**: Endpoints to generate detailed analytics for each role's scope.
- **Persistent Storage**: All data is stored and managed in a Supabase PostgreSQL database.
- **Secure Authentication**: Leverages Supabase Auth for user management and JWT validation.
- **Scalable Architecture**: Modular structure with routes, controllers, and services for easy maintenance.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth)
- **ORM**: Supabase JS Client (`@supabase/supabase-js`)
- **File Handling**: `multer` for file uploads, `csv-parser` for parsing CSV data.

---

## 🚀 Getting Started

### 1. Supabase Project Setup

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Run the Schema**: Navigate to the `SQL Editor` in your Supabase dashboard. Copy the entire content of `supabase/schema.sql` from this repository and run it to create all the necessary tables, roles, and relationships.
3.  **Get API Credentials**:
    - In your Supabase project, go to `Project Settings` > `API`.
    - Find your **Project URL**, `anon` key, and `service_role` key.
4.  **Get JWT Secret**:
    - Go to `Authentication` > `Providers`. Under the `JWT Settings` section, find your **JWT Secret**.

### 2. Local Backend Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd academic-analytics-backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Create `.env` file**:
    - Create a file named `.env` in the root of the project.
    - Copy the contents of `.env.example` into it.
    - Fill in the values you obtained from your Supabase project.

    ```env
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    JWT_SECRET=your_supabase_jwt_secret
    PORT=5000
    ```

4.  **Start the server**:
    - For development with auto-reload:
      ```bash
      npm run dev
      ```
    - For production:
      ```bash
      npm start
      ```
    The server will be running at `http://localhost:5000`.

---

##  API Usage (Sample Requests)

Below are examples using `curl`. Replace `YOUR_JWT_TOKEN` with the token received after logging in.

### Authentication

**Login (Any Role)**
```bash
curl -X POST http://localhost:5000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "email": "faculty.advisor@example.com",
    "password": "password123"
}'
```

### Admin Routes

**Create a User**
```bash
curl -X POST http://localhost:5000/api/admin/users \
-H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
    "email": "new.hod@example.com",
    "password": "password123",
    "name": "Dr. Smith",
    "role": "HOD",
    "department": "Computer Science"
}'
```

### Faculty Advisor (FA) Routes

**Upload Students CSV** (`students.csv`)
```bash
curl -X POST http://localhost:5000/api/fa/upload/students \
-H "Authorization: Bearer YOUR_FA_JWT_TOKEN" \
-F "file=@/path/to/your/students.csv"
```
*Note: The FA must be mapped to a section by an Admin first.*

**Get Analytics for FA's Section**
```bash
curl -X GET http://localhost:5000/api/fa/analytics \
-H "Authorization: Bearer YOUR_FA_JWT_TOKEN"
```

### Academic Advisor (AA) Routes

**Get Analytics for AA's Sections (Comparison)**
```bash
curl -X GET "http://localhost:5000/api/aa/analytics?mode=section" \
-H "Authorization: Bearer YOUR_AA_JWT_TOKEN"
```

### HOD Routes

**Get Department-Level Analytics**
```bash
curl -X GET http://localhost:5000/api/hod/analytics \
-H "Authorization: Bearer YOUR_HOD_JWT_TOKEN"
```

---

## ☁️ Deployment

This application is ready to be deployed on services like Render or Railway.

### Deploying on Render

1.  **Push to GitHub**: Make sure your code is in a GitHub repository.
2.  **Create a New Web Service**: On the Render dashboard, click `New +` > `Web Service`.
3.  **Connect Your Repo**: Select your GitHub repository.
4.  **Configure Settings**:
    - **Name**: Give your service a name (e.g., `academic-analytics-api`).
    - **Root Directory**: Leave as is.
    - **Environment**: Select `Node`.
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5.  **Add Environment Variables**: Under `Advanced`, click `Add Environment Variable`. Add all the keys and values from your local `.env` file (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.).
6.  **Deploy**: Click `Create Web Service`. Render will automatically build and deploy your application.

Your API will be live at the URL provided by Render.

---
*Note: For a production environment, it is highly recommended to enable Row Level Security (RLS) in Supabase for an additional layer of data protection at the database level.*
