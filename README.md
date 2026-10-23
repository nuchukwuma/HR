# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# hr.m

## Deployment environment

The Vercel frontend includes a rewrite that serves the React app for client-side routes, so directly opening or refreshing paths such as `/shifts` works.

For the Render frontend service, set `VITE_API_URL` to the backend service's public origin, without an `/api` suffix (for example, `https://your-backend.onrender.com`). Vite reads this value when it builds the site, so redeploy the frontend after changing it.

For the backend service, set `CLIENT_URL` to the exact frontend origin, such as `https://hr-e4c0.onrender.com`. Multiple allowed origins can be comma-separated. Restart or redeploy the backend after changing this value. The same setting controls API CORS, Socket.IO CORS, and the origin used for invitation links.

For local development, the defaults continue to use `http://localhost:5000` for the backend. Do not use `localhost` as the deployed frontend's API URL; it points to each visitor's own computer.
