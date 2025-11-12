# Academic Analytics & Monitoring System - Frontend

A comprehensive role-based dashboard system built with Next.js, TypeScript, TailwindCSS, and Supabase authentication.

## Features

- **Role-Based Access Control**: Faculty Advisor, Academic Advisor, Head of Department, and Admin dashboards
- **Authentication**: Supabase email/password authentication with JWT token management
- **Analytics Dashboard**: Interactive charts and visualizations using Recharts
- **File Management**: CSV upload capabilities for student, performance, and attendance data
- **User Management**: Admin panel for managing users and department mappings
- **Audit Logging**: Track all system activities with timestamped logs
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Architecture

### Directory Structure

\`\`\`
/app
  /login          - Authentication page
  /fa             - Faculty Advisor routes
  /aa             - Academic Advisor routes
  /hod            - Head of Department routes
  /admin          - Admin routes
/components
  - Navbar        - Top navigation with logout
  - Sidebar       - Role-specific navigation
  - ProtectedRoute - Route protection wrapper
  - FileUploadCard - CSV upload component
  - AnalyticsCharts - Recharts visualizations
  - Admin components (UserManagement, DepartmentMapping, AuditLogs)
/lib
  - auth.ts       - Authentication utilities
  - api.ts        - Axios instance with interceptors
/types
  - index.ts      - TypeScript interfaces
\`\`\`

## Environment Variables

Create `.env.local` in the project root:

\`\`\`env
NEXT_PUBLIC_API_URL=https://my-backend-domain.com/api
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

Replace:
- `my-backend-domain.com/api` with your Express backend API URL (Render/Railway)
- `your-supabase-url.supabase.co` with your Supabase project URL
- `your-anon-key` with your Supabase anonymous key

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Configure environment variables (see above)

4. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The frontend communicates with your Express backend via the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Faculty Advisor
- `GET /api/fa/analytics` - Fetch analytics data
- `POST /api/fa/upload/students` - Upload student CSV
- `POST /api/fa/upload/performance` - Upload performance CSV
- `POST /api/fa/upload/attendance` - Upload attendance CSV
- `GET /api/fa/export/pdf` - Export PDF report

### Academic Advisor
- `GET /api/aa/analytics` - Fetch section/overall analytics
- `GET /api/aa/export/pdf` - Export PDF report

### Head of Department
- `GET /api/hod/analytics` - Fetch department analytics
- `GET /api/hod/export/pdf` - Export PDF report
- `GET /api/hod/export/excel` - Export Excel report

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/map` - Map user to sections
- `GET /api/admin/mappings` - Get current mappings
- `GET /api/admin/audit` - Get audit logs
- `GET /api/admin/sections` - Get available sections

## Authentication Flow

1. User logs in at `/login` with email and password
2. Credentials sent to backend via `POST /api/auth/login`
3. Backend validates and returns JWT token + user data
4. Token stored in localStorage for future requests
5. User redirected to role-based dashboard
6. All API requests include Authorization header with Bearer token

## Dashboard Features

### Faculty Advisor
- Upload student, performance, and attendance data
- View analytics with pie charts and bar charts
- Export PDF reports

### Academic Advisor
- Toggle between section-specific and overall analytics
- View weak subjects analysis
- Track section performance trends
- Export section-specific reports

### Head of Department
- Department-wide overview
- Subject failure rate heatmap
- Semester performance trends
- Hostel vs Day Scholar distribution
- Export PDF and Excel reports

### Admin
- User management (add, edit, delete)
- Department-to-section mapping
- Paginated audit logs
- Track all system activities

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel automatically deploys on push

\`\`\`bash
npm run build
npm run start
\`\`\`

## Styling

- **TailwindCSS v4**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **Lucide React**: Icon library
- **Recharts**: React visualization library

## Key Components

### ProtectedRoute
Wraps routes to ensure only authenticated users with correct roles can access pages.

### FileUploadCard
Reusable component for CSV file uploads with progress tracking.

### AnalyticsCharts
Collection of interactive charts using Recharts for data visualization.

### Sidebar & Navbar
Navigation components that adapt based on user role.

## Error Handling

- Failed API requests display user-friendly error messages
- File upload errors show clear feedback
- Protected routes redirect unauthorized users to login
- Token expiration handled via API interceptors

## Future Enhancements

- Dark mode toggle
- Real-time data updates with WebSockets
- Advanced filtering and search
- Custom report generation
- Email notifications
- Two-factor authentication
- API rate limiting

## Support

For issues or questions, please contact the development team or open an issue in the repository.

## License

MIT License - Feel free to use this project for your needs.
