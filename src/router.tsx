import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./screens/home";
import { App } from "./screens/app";
import { Root } from "./components/root";
import { Welcome } from "./screens/welcome";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: ":slug",
        element: <App />,
        children: [
          {
            path: "",
            element: <Welcome />,
          },
        ],
      },
    ],
  },
]);
