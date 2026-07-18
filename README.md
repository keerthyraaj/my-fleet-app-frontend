# Fleet management app guide

This project now has a simple authentication flow and a fleet dashboard.

## What changed

### 1. Backend login flow
The backend accepts a login request from the frontend and checks the user in PostgreSQL.

It uses:
- Express to create the web server
- `pg` to talk to PostgreSQL
- `bcrypt` to verify the password hash
- `dotenv` to load the database connection string from the `.env` file
- `express-session` to create and manage user sessions

### 2. Dashboard and fleet endpoints
The backend now provides protected endpoints such as:
- `/api/dashboard/stats`
- `/api/fleets`

These endpoints use the user session instead of relying on the email being passed in the URL.

### 3. Frontend dashboard UI
After a successful login, the React app loads a dashboard screen instead of only showing a welcome message.

The dashboard includes:
- summary cards for fleet count, distance, and battery
- a chart-like bar view for fleet types
- progress bars for operational statuses

## Database tables used
The dashboard depends on the PostgreSQL tables from the DDL file in the backend folder.

The important tables are:
- `users` — stores login details and names
- `fleets` — stores fleet information such as vehicle type, battery, distance, and status
- `user_fleets` — links users to the fleets they are assigned to

## How the flow works
1. User enters email and password in the React form.
2. React sends the values to the backend login endpoint.
3. The backend checks the email in the `users` table.
4. If the password is valid, the backend creates a session and stores the authenticated user details in it.
5. The backend sends a session cookie to the browser.
6. React includes that cookie in subsequent requests using `credentials: 'include'`.
7. The backend reads the session from the cookie and loads the logged-in user for protected endpoints.
8. The backend joins the `users`, `fleets`, and `user_fleets` tables and sends the results to the UI.

## Session handling: backend and frontend

### Backend session concept
When login succeeds, the backend creates a server-side session.

The session stores data such as:
- `userId`
- `fullName`
- `email`

This information is saved in the session store managed by `express-session`.

The browser does not receive the full session data directly. Instead, it receives a session cookie that identifies the session.

### Frontend session concept
The frontend does not store the session data directly in local storage for this flow.

Instead, it:
- sends login credentials to the backend
- receives the session cookie from the browser
- includes that cookie in later requests using `credentials: 'include'`

The React app uses the session indirectly by calling protected API endpoints and relying on the backend to authenticate the request.

### Where the session is stored
- Backend: stored server-side in the session store managed by `express-session`
- Frontend/browser: stores the session cookie automatically
- React app state: only reflects whether the user appears logged in in the UI

## General concept
A session is a way to remember that a user has already authenticated.

Instead of making the user log in again for every request, the server creates a session after login and associates the browser with that session using a cookie.

This is the standard pattern for web apps because it is:
- secure
- simple to implement
- easy to use for protected routes

## Important notes
- The session cookie must be sent with `credentials: 'include'` from the frontend.
- Protected endpoints should require an active session.
- Logout should destroy the session and clear the cookie.

## Important notes for beginners
- Never store plain-text passwords in the database.
- Always keep the `.env` file private.
- The dashboard only works if your database contains matching rows in the `users`, `fleets`, and `user_fleets` tables.

## How to run the app

## API configuration (important for mobile)
Set the frontend API URL with a Vite environment variable instead of hardcoding localhost.

1. Create a `.env` file in the frontend root.
2. Add `VITE_API_URL` with your backend URL.

Example:
```bash
VITE_API_URL=https://my-fleet-app-backend.onrender.com
```

If you are testing from a phone against a backend running on your laptop, use your laptop LAN IP (not localhost), for example:
```bash
VITE_API_URL=http://192.168.1.42:5000
```

Then restart the frontend dev server so Vite picks up the new variable.

### Backend
```bash
cd backend
npm start
```

### Frontend
Open the frontend folder in a browser using a simple static server, or use your preferred local dev setup.

## Next steps
You can improve this later by adding:
- real charts with Chart.js or Recharts
- a sidebar navigation menu
- fleet detail pages
- filters by status or vehicle type
