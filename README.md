
# RxDjango Demo Application

This repository contains a demo application built using Django, Django REST Framework (DRF), TypeScript, and React. This application serves as an example of a basic project management tool before the introduction of RxDjango. The application allows users to create projects, add tasks, and manage participants.

## Technologies Used

- **Backend**: Django, Django REST Framework
- **Frontend**: React, TypeScript

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/rxdjango-demo.git
   cd rxdjango-demo/backend
   ```

2. **Create a virtual environment**:

   ```bash
   python -m venv backend-env
   ```

3. **Activate the virtual environment**:

   - On Windows:

     ```bash
     backend-env\Scripts\activate
     ```

   - On macOS/Linux:

     ```bash
     source backend-env/bin/activate
     ```

4. **Install RxDjango and demo dependencies on backend**:

   ```bash
   pip install rxdjango django-cors-headers
   ```

5. **Run migrations**:

   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**:

   ```bash
   python manage.py createsuperuser
   ```

7. **Start the backend server**:

   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Open a new shell and navigate to the frontend directory**:

   ```bash
   cd ../frontend
   ```

2. **Install the frontend dependencies**:

   - Using npm:

     ```bash
     npm install
     ```

   - Using yarn:

     ```bash
     yarn install
     ```

3. **Start the frontend development server**:

   - Using npm:

     ```bash
     npm start
     ```

   - Using yarn:

     ```bash
     yarn start
     ```

### Access the Application

1. **Backend**: The backend server will be running at `http://localhost:8000/`. You can access the Django admin interface at `http://localhost:8000/admin/` using the superuser credentials you created earlier.

2. **Frontend**: The frontend development server will be running at `http://localhost:3000/`. Open this URL in your browser to see the application in action.

### Notes

- Ensure both the backend and frontend servers are running simultaneously to access the full functionality of the application.
- This setup represents the state of the application before the integration of RxDjango.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
