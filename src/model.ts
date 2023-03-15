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
  sections: (
    | {
        type: "heading";
        label: string;
        path: undefined;
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
  templates: Template[];
};

export type Template = {
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
  config: {};
} & (
  | {
      type: "text";
      default: string;
      config: {
        required: boolean;
        min: number;
        max: number;
      };
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
    }
  | {
      type: "boolean";
      default: boolean;
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
    }
  | {
      type: "color";
      default: string;
      config: {
        required: boolean;
        color_format: "Hex" | "RGB";
      };
    }
  | {
      type: "tag_list";
      default: string[];
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
    }
  | {
      type: "file";
      default: string;
      config: {
        maxSize: number;
      };
    }
  | {
      type: "image_gallery";
    }
  | {
      type: "field_group";
      fields: Field[];
    }
  | {
      type: "field_group_list";
      fields: Field[];
      config: {
        min: number;
        max: number;
        labelField: string;
      };
    }
  | {
      type: "blocks";
      template_types: string[];
      config: {
        min: number;
        max: number;
      };
    }
  | {
      type: "include";
      template: string;
    }
);
