import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./screens/home";
import { App } from "./screens/app";
import { Root } from "./components/root";
import { Welcome } from "./screens/welcome";
import { Media } from "./screens/media";
import { Settings } from "./screens/settings";
import { Templates } from "./screens/templates";
import { Document } from "./screens/document";
import { Directory } from "./screens/directory";
import { Template } from "./screens/template";

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
          {
            path: "doc/*",
            element: <Document />,
          },
          {
            path: "dir/*",
            element: <Directory />,
          },
          {
            path: "media",
            element: <Media />,
          },
          {
            path: "media",
            element: <Media />,
          },
          {
            path: "templates",
            element: <Templates />,
          },
          {
            path: "templates/:template",
            element: <Template />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
]);
