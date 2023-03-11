import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./screens/home";
import { App } from "./screens/app";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/app",
    element: <App />,
  },
]);
