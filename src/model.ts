export type Site = {
  name: string;
  url: string;
  backend: "azure" | "github" | "bitbucket";
  user: string;
  token: string;
  org: string;
  repository: string;
  project: string;
  branch: string;
};

export type Settings = {
  admin_path: string;
  upload_dir: string;
  new_page_extension: "md|html";
  auto_deploy: boolean;
  public_path: "/media";
  webhook_url: null;
  version: string;
  sections: (
    | {
        type: "heading";
        label: string;
      }
    | {
        type: "document";
        path: string;
        label: string;
      }
    | {
        type: "directory";
        path: string;
        label: string;
        create: string;
        match: string;
        templates: string[];
      }
  )[];
};
