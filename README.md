# Student - ACT - Tree Monitoring System

A comprehensive web application for managing and monitoring tree planting initiatives in educational institutions. This system enables students to select, monitor, and track the growth of trees while providing administrators with powerful management and reporting tools.

## 🌟 Features

### For Students
- **Tree Selection**: Browse and select from available trees
- **Progress Tracking**: Upload photos and track tree growth over time
- **Care Instructions**: Get species-specific care guidelines
- **Achievement System**: Track care scores and milestones

### For Staff
- **Class Management**: Manage students in assigned classes
- **Tree Assignment**: Help students select appropriate trees
- **Progress Monitoring**: Track student engagement and tree health

### For HODs (Head of Departments)
- **Department Overview**: View department-wide statistics
- **Student Management**: Manage students within the department
- **Tree Monitoring**: Monitor all trees assigned to department students
- **Reports**: Generate department-specific reports

### For Principals
- **College-wide Dashboard**: Complete overview of the institution
- **Multi-department Management**: Manage all departments and staff
- **Comprehensive Reports**: Institution-wide analytics and insights
- **Staff Management**: Manage HODs and staff members

### For System Administrators
- **Multi-college Management**: Manage multiple educational institutions
- **User Management**: Create and manage all user types
- **System Reports**: Comprehensive analytics across all colleges
- **Data Export**: Export reports and data for analysis

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **Lucide React** for beautiful icons
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **Multer** for file uploads
- **bcrypt** for password hashing

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd one-student-one-tree
```

### 2. Backend Setup
```bash
cd one_student_one-_treeAPI
npm install

# Create .env file
cp .env.example .env

# Configure your database connection in .env
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=tree_monitoring
# DB_USER=your_username
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret

# Run database migrations
npm run migrate

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../one_student_one-_treeUI
npm install

# Start the frontend development server
npm run dev
```

### 4. Database Population (Optional)
```bash
cd ../one_student_one-_treeAPI

# Populate with sample data
node comprehensive-populate.js
```

## 🔑 Demo Credentials

After running the population script, you can use these demo credentials:

### System Administrator
- **Email**: admin@system.edu
- **Password**: password123

### Principal (R.M.K Engineering College)
- **Email**: principal.rmkec@edu.in
- **Password**: Principal@123456

### Principal (Sri Sairam Engineering College)
- **Email**: principal.sairam@edu.in
- **Password**: Principal@123456

### HOD (Computer Science)
- **Email**: hod.cse.0@rmkec.edu.in
- **Password**: Hod@123456

### Staff Member
- **Email**: staff0.0.0@rmkec.edu.in
- **Password**: Staff@123456

### Student
- **Email**: student1@rmkec.edu.in
- **Password**: Student@123456

## 📱 Usage

### Getting Started
1. Access the application at `http://localhost:5174`
2. Log in using one of the demo credentials
3. Explore the features based on your role

### For Students
1. Navigate to "Tree Selection" to choose a tree
2. Use "My Tree Progress" to upload photos and track growth
3. Check "Guidelines" for care instructions

### For Administrators
1. Use the "Dashboard" for overview statistics
2. Manage users through "Users" section
3. View comprehensive analytics in "Reports"
4. Handle approvals in "Invitations" and "Requests"

## 🏗️ Project Structure

```
one-student-one-tree/
├── one_student_one-_treeAPI/          # Backend API
│   ├── src/
│   │   ├── controllers/               # Route controllers
│   │   ├── models/                    # Database models
│   │   ├── routes/                    # API routes
│   │   ├── middleware/                # Custom middleware
│   │   └── utils/                     # Utility functions
│   ├── migrations/                    # Database migrations
│   └── package.json
├── one_student_one-_treeUI/           # Frontend React app
│   ├── src/
│   │   ├── components/                # React components
│   │   │   ├── Auth/                  # Authentication components
│   │   │   ├── Dashboard/             # Dashboard components
│   │   │   ├── Management/            # Management components
│   │   │   ├── TreeSelection/         # Tree selection components
│   │   │   ├── TreeProgress/          # Progress tracking
│   │   │   ├── Reports/               # Reporting components
│   │   │   ├── Settings/              # Settings components
│   │   │   ├── UI/                    # Reusable UI components
│   │   │   └── Layout/                # Layout components
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── services/                  # API services
│   │   ├── types/                     # TypeScript type definitions
│   │   └── utils/                     # Utility functions
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tree_monitoring
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_HOST=http://localhost:3000

# App Configuration (optional)
VITE_APP_NAME=Student - ACT
VITE_APP_VERSION=1.0.0
```

The frontend uses environment variables to configure API endpoints. Copy `.env.example` to `.env` and modify as needed.

## 📊 Database Schema

The system uses PostgreSQL with the following main entities:
- **Users** (students, staff, HODs, principals, admins)
- **Colleges** (educational institutions)
- **Departments** (within colleges)
- **Trees** (tree records with species, location, etc.)
- **Tree Images** (progress photos)
- **Invitations** (for user registration)
- **Registration Requests** (pending user registrations)

## 🚀 Deployment

### Production Build

#### Frontend
```bash
cd one_student_one-_treeUI
npm run build
```

#### Backend
```bash
cd one_student_one-_treeAPI
npm run build
npm start
```

### Docker Deployment (Optional)
Docker configuration files can be added for containerized deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🙏 Acknowledgments

- R.M.K Engineering College for the project inspiration
- All contributors and testers
- Open source libraries and frameworks used

---

**Built with ❤️ for environmental sustainability and education**
"# work-flow-lms-ui" 
