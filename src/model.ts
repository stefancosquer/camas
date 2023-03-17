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

export type Leaf = {
  url: string;
  path: string;
  author: string;
  date: string;
  folder: boolean;
};

export type Tree = {
  [key: string]: Leaf | Tree;
};

export type Settings = {
  admin_path: string;
  upload_dir: string;
  file_template: string;
  new_page_extension: "md|html";
  auto_deploy: boolean;
  public_path: "/media";
  webhook_url: null;
  version: string;
  sections: (Heading | Document | Directory)[];
  templates: Template[];
};

export type Heading = {
  type: "heading";
  label: string;
  path: undefined;
};

export type Document = {
  type: "document";
  label: string;
  path: string;
};

export type Directory = {
  type: "directory";
  label: string;
  path: string;
  create: "all" | "documents" | " none";
  match: string;
  templates: string[];
};

export type Template = {
  name: string;
  label: string;
  hide_body: boolean;
  fields: Field[];
  pages: string[];
};

export type Field = {
  label: string;
  name: string;
  description: string;
  hidden: boolean;
} & (
  | {
      type: "text";
      default: string;
      config: {
        required: boolean;
        min: number;
        max: number;
      };
      value: string;
    }
  | {
      type: "textarea";
      default: string;
      config: {
        required: boolean;
        min: number;
        max: number;
        wysiwyg: boolean;
        schema: {
          format: "markdown" | "html-blocks" | "html";
        };
      };
      value: string;
    }
  | {
      type: "number";
      default: number;
      config: {
        required: boolean;
        min: number;
        max: number;
        step: number;
      };
      value: number;
    }
  | {
      type: "boolean";
      default: boolean;
      value: boolean;
    }
  | {
      type: "select";
      default: string;
      config: {
        required: boolean;
        options: string[];
        source: {
          type: "simple" | "pages" | "documents";
          section: string;
          file: string;
          path: string;
        };
      };
      value: string;
    }
  | {
      type: "datetime";
      default: string | "now";
      config: {
        required: boolean;
        date_format: string; // MM/DD/YYYY
        time_format: string; // h:mm A ZZ
        display_utc: boolean; // false
        export_format: string; // YYYY-MM-DD h:mm A
      };
      value: string;
    }
  | {
      type: "color";
      default: string;
      config: {
        required: boolean;
        color_format: "Hex" | "RGB";
      };
      value: string;
    }
  | {
      type: "tag_list";
      default: string[];
      value: string[];
    }
  | {
      type: "list";
      config: {
        min: number;
        max: number;
      } & (
        | { use_select: false }
        | {
            use_select: true;
            source: {
              type: "simple";
              options: string[];
            };
          }
      );
      value: string[];
    }
  | {
      type: "file";
      default: string;
      config: {
        maxSize: number;
      };
      value: string;
    }
  | {
      type: "image_gallery";
      value: string[];
    }
  | {
      type: "field_group";
      fields: Field[];
      value: Record<string, unknown>;
    }
  | {
      type: "field_group_list";
      fields: Field[];
      config: {
        min: number;
        max: number;
        labelField: string;
      };
      value: Record<string, unknown>[];
    }
  | {
      type: "blocks";
      template_types: string[];
      config: {
        min: number;
        max: number;
      };
      value: Record<string, unknown>[];
    }
  | {
      type: "include";
      template: string;
      value: Record<string, unknown>;
    }
);
