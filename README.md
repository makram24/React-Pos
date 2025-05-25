<h1>Restaurant P.O.S - Documentation</h1>

<h2>Project Overview</h2>
This React-based web application provides a comprehensive restaurant management
platform. It includes features for order management, analytics, inventory control, kitchen
display, and customer interaction. The project uses modular components, context APIs,
Firebase for authentication, and provides dashboards for various stakeholders (admin, chef,
waiter).


<h2>Project Structure</h2>
The source code is organized into the following directories and files: <br>
- assets/: Contains images and other static assets. <br>
- components/: Contains all reusable UI components grouped by functionality. <br>
- constants/: Contains global constants and Firebase config. <br>
- contexts/: React context logic (authentication). <br>
- pages/: Page-level components for routing and major views. <br>
- utils/: Utility functions, e.g., for analytics data. <br>
- App.jsx: Main application component with routing. <br>
- main.jsx: Entry point of the application. <br>
- index.css: Global styles. 

  
<h2>Module Details</h2>
Each module in the application handles specific functionality as outlined below:

<h4>Pages</h4>
These components represent distinct pages in the app, such as AdminDashboard, Analytics,
ChefOrders, etc.


<h4>Analytics Components</h4>
Provides metrics and insights into different aspects of the restaurant like customers,
employees, finances, inventory, and sales.


<h4>Home Components</h4>
Used on the user-facing home screen. Displays popular items, recent orders, etc.


<h4>Table Order Components</h4>
Used for order handling per table including invoices, item quantity control, and order
details.


<h4>Shared Components</h4>
Components like Header and BottomNav used across the app for consistent layout.

<h4>Utils and Config </h4>
Includes Firebase configuration and helper functions to mock or process data.

<h2>Authentication Context</h2>
The `AuthContext.jsx` file sets up and provides authentication state throughout the app
using Firebase Auth. <br>


<h2>How to Launch the Code</h2>
Follow these steps to set up and run the project locally: <br>
1. Install Node.js (preferably v16 or higher) and npm. <br>
2. Open a terminal and navigate to the project directory. <br>
3. Run `npm install` to install dependencies. <br>
4. Ensure Firebase is correctly configured in `src/constants/firebase.js`. <br>
5. Run `npm run dev` to start the development server. <br>
6. The app should be accessible at `http://localhost:5173`.


<h2>Future Improvements</h2>
• Process Payments (Card, QR, Split) <br>
• Mobile App Development <br>
• Advanced AI Forecasting <br>
• Self-service kiosks or QR-based table ordering. <br>
• Real-time notifications and offline mode support.


<h2>Features</h2>
• Real-time order management and table assignment <br>
• Inventory tracking with analytics integration <br>
• Role-based access control (Admin, Waiter, Chef, Customer) <br>
• Financial, sales, and employee analytics dashboards <br>
• Customer order history and popular items suggestions <br>
• Printable invoices and digital billing <br>
• Firebase-authenticated user management system


<h2>User Roles</h2>
• Admin – Full access to all system functionalities including analytics and user
management. <br>
• Manager – Full access to analytics. <br>
• Waiter – Manages customer orders, assigns tables, views inventory. <br>
• Chef – Views and updates kitchen orders and their status.


<h2>Core Functionalities</h2>
• Order Management – Place, update, and fulfill table orders. <br>
• Inventory Management – Track stock levels, usage, and restocking. <br>
• Analytics – View sales, financial, employee, and inventory analytics. <br>
• Authentication – Secure Firebase-based login for different roles. <br>
• Invoice Generation – Generate and print invoices for customers. <br>
• Role-based Dashboards – Tailored views and actions depending on user role.


<h2>Database Structure</h2>
The system uses Firebase Firestore as the backend database. Below are the primary
collections used: <br>
• Categories – Stores categories of menu items. <br>
• Invoice – Contains generated invoices for orders. <br>
• OrderDetails – Item-level breakdown for each order. <br>
• employees – Information about restaurant staff. <br>
• expenses – Financial records and expense tracking. <br>
• inventory – Tracks current stock and consumption. <br>
• items – List of available dishes and their metadata. <br>
• orders – All active and historical orders. <br>
• settings – Application settings and configuration. <br>
• tables – Table metadata and occupancy state. <br>
• users – User login and role assignment data.

