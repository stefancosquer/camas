import { visit } from "unist-util-visit";
import { load } from "js-yaml";
import { Plugin } from "unified";
import { Content } from "mdast-util-to-markdown/lib/types";

export const request = async (
  url: string,
  user: string,
  token: string
): Promise<any> =>
  (
    await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${user}:${token}`)}`,
      },
    })
  ).json();

export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isYaml = (path: string) =>
  path && (path.endsWith(".yml") || path.endsWith(".yaml"));

export const isImage = (path: string) =>
  path &&
  (path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".webp") ||
    path.endsWith(".gif"));

export const toMeta = () => (tree, file) => {
  visit(tree, "yaml", (node): void => {
    file.data = load(node.value) as Record<string, unknown>;
  });
};

const mdastToSlate = ({
  type,
  children,
  value,
  url,
  alt,
  lang,
  ordered,
  depth,
  title,
}) => {
  switch (type) {
    case "yaml":
      return null;
    case "paragraph":
      return {
        type: "p",
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "blockquote":
      return {
        type: "quote",
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "heading":
      return {
        type: `h${depth}`,
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "list":
      return {
        type: ordered ? "ol" : "ul",
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "listItem":
      return {
        type: "li",
        children: children
          .flatMap(({ children }) => children.flatMap(mdastToSlate))
          .filter((v) => !!v),
      };
    case "image":
      return { type: "img", url, alt, title, children: [{ text: "" }] };
    case "link":
      return {
        type: "a",
        url,
        title,
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "text":
      return { text: value };
    case "break":
      return { text: "\n" };
    case "code":
      return { type: "code", lang, children: [{ text: value }] };
    case "inlineCode":
      return { code: true, text: value };
    case "strong":
      return children
        .flatMap(({ value }) => ({ bold: true, text: value }))
        .filter((v) => !!v);
    case "emphasis":
      return children
        .flatMap(({ value }) => ({ italic: true, text: value }))
        .filter((v) => !!v);
    default:
      console.log("Unhandled md type", type);
      return null;
  }
};

const slateToMdast = ({
  type,
  text,
  url,
  lang,
  title,
  alt,
  children,
  code,
  bold,
  italic,
}): Content => {
  switch (type) {
    case "p":
      return {
        type: "paragraph",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "quote":
      return {
        type: "blockquote",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return {
        type: "heading",
        depth: parseInt(/^h(\d+)$/.exec(type)[1]) as 1 | 2 | 3 | 4 | 5 | 6,
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "ol":
    case "ul":
      return {
        type: "list",
        ordered: type === "ol",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "li":
      return {
        type: "listItem",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "a":
      return {
        type: "link",
        url,
        title,
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "img":
      return {
        type: "image",
        url,
        title,
        alt,
      };
    case "code":
      return {
        type: "code",
        lang,
        value: children.map(({ text }) => text).join(),
      };
    case undefined:
      return {
        type: code ? "inlineCode" : "text",
        value: text,
      };
    default:
      console.log("Unhandled slate type", type);
      return null;
  }
};

export const fromSlate = (nodes: any[]): Content[] =>
  nodes.map(slateToMdast).filter((v) => !!v);

export const toSlate: Plugin<[]> = function () {
  // @ts-ignore
  this.Compiler = (node: { children }) => {
    console.log(node);
    return node.children.map(mdastToSlate).filter((v) => !!v);
  };
};

/*
{
  "type": "root",
  "children": [
  {
    "type": "yaml",
    "value": "type: Impact\ndraft: false\nhome: true\npublished: '2023-03-23T15:45:30+01:00'\nimg: \"/media/dc-jonquille-mr-ail.jpg\"\ntitle: 'Étude de cas : Dr. Jonquille & Mr. Ail '\nabstract: 'Retour sur la création d''une application écoconçue de Dr. Jonquille &\n  Mr. Ail à destination des apprentis jardiniers '\nauthor: ''\n",
    "position": {
      "start": {
        "line": 1,
        "column": 1,
        "offset": 0
      },
      "end": {
        "line": 12,
        "column": 4,
        "offset": 315
      }
    }
  },
  {
    "type": "heading",
    "depth": 1,
    "children": [
      {
        "type": "text",
        "value": "Dr. Jonquille & Mr. Ail x Digital4better : Comment éco-concevoir une application mobile de jardinage ?",
        "position": {
          "start": {
            "line": 13,
            "column": 3,
            "offset": 318
          },
          "end": {
            "line": 13,
            "column": 105,
            "offset": 420
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 13,
        "column": 1,
        "offset": 316
      },
      "end": {
        "line": 13,
        "column": 105,
        "offset": 420
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "Pitch",
            "position": {
              "start": {
                "line": 15,
                "column": 3,
                "offset": 424
              },
              "end": {
                "line": 15,
                "column": 8,
                "offset": 429
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 15,
            "column": 1,
            "offset": 422
          },
          "end": {
            "line": 15,
            "column": 10,
            "offset": 431
          }
        }
      },
      {
        "type": "text",
        "value": " : ",
        "position": {
          "start": {
            "line": 15,
            "column": 10,
            "offset": 431
          },
          "end": {
            "line": 15,
            "column": 13,
            "offset": 434
          }
        }
      },
      {
        "type": "link",
        "title": null,
        "url": "https://djma.fr/",
        "children": [
          {
            "type": "emphasis",
            "children": [
              {
                "type": "text",
                "value": "Dr.Jonquille & Mr. Ail",
                "position": {
                  "start": {
                    "line": 15,
                    "column": 15,
                    "offset": 436
                  },
                  "end": {
                    "line": 15,
                    "column": 37,
                    "offset": 458
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 15,
                "column": 14,
                "offset": 435
              },
              "end": {
                "line": 15,
                "column": 38,
                "offset": 459
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 15,
            "column": 13,
            "offset": 434
          },
          "end": {
            "line": 15,
            "column": 57,
            "offset": 478
          }
        }
      },
      {
        "type": "text",
        "value": " ",
        "position": {
          "start": {
            "line": 15,
            "column": 57,
            "offset": 478
          },
          "end": {
            "line": 15,
            "column": 58,
            "offset": 479
          }
        }
      },
      {
        "type": "emphasis",
        "children": [
          {
            "type": "text",
            "value": "vous accompagne dans votre jardinage de manière ludique et pédagogique. Cette entreprise française propose une offre diversifiée, allant des kits de jardinages aux semences en passant par les jeux de société pédagogiques, afin de vous aider à devenir les rois du potager.",
            "position": {
              "start": {
                "line": 15,
                "column": 59,
                "offset": 480
              },
              "end": {
                "line": 15,
                "column": 330,
                "offset": 751
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 15,
            "column": 58,
            "offset": 479
          },
          "end": {
            "line": 15,
            "column": 331,
            "offset": 752
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 15,
        "column": 1,
        "offset": 422
      },
      "end": {
        "line": 15,
        "column": 331,
        "offset": 752
      }
    }
  },
  {
    "type": "heading",
    "depth": 2,
    "children": [
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "Point de départ",
            "position": {
              "start": {
                "line": 17,
                "column": 6,
                "offset": 759
              },
              "end": {
                "line": 17,
                "column": 21,
                "offset": 774
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 17,
            "column": 4,
            "offset": 757
          },
          "end": {
            "line": 17,
            "column": 23,
            "offset": 776
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 17,
        "column": 1,
        "offset": 754
      },
      "end": {
        "line": 17,
        "column": 23,
        "offset": 776
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "value": "Le souhait des co-fondateurs est de rendre le jardinage accessible au plus grand nombre. C’est pourquoi Dr. Jonquille & Mr. Ail est venu toquer à la porte de Digital4Better avec pour projet de concevoir une ",
        "position": {
          "start": {
            "line": 19,
            "column": 1,
            "offset": 778
          },
          "end": {
            "line": 19,
            "column": 208,
            "offset": 985
          }
        }
      },
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "application mobile pour accompagner les novices et les experts dans leur jardinage quotidien",
            "position": {
              "start": {
                "line": 19,
                "column": 210,
                "offset": 987
              },
              "end": {
                "line": 19,
                "column": 302,
                "offset": 1079
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 19,
            "column": 208,
            "offset": 985
          },
          "end": {
            "line": 19,
            "column": 304,
            "offset": 1081
          }
        }
      },
      {
        "type": "text",
        "value": ". Ils avaient déjà une application mobile, une « encyclopédie » numérique présentant une grande variété de plantes, légumes et fruits mais également de maladies dont peuvent souffrir les cultures. Pour les jardiniers, c’est une ressource complète intégrant également les produits de Dr. Jonquille & Mr. Ail (DJMA) pour faciliter leur quotidien dans leur jardin.",
        "position": {
          "start": {
            "line": 19,
            "column": 304,
            "offset": 1081
          },
          "end": {
            "line": 19,
            "column": 665,
            "offset": 1442
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 19,
        "column": 1,
        "offset": 778
      },
      "end": {
        "line": 19,
        "column": 665,
        "offset": 1442
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "value": "Leur enjeu : reprendre cette base de connaissances pour créer une ",
        "position": {
          "start": {
            "line": 21,
            "column": 1,
            "offset": 1444
          },
          "end": {
            "line": 21,
            "column": 67,
            "offset": 1510
          }
        }
      },
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "expérience pédagogique, ludique et personnalisée",
            "position": {
              "start": {
                "line": 21,
                "column": 69,
                "offset": 1512
              },
              "end": {
                "line": 21,
                "column": 117,
                "offset": 1560
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 21,
            "column": 67,
            "offset": 1510
          },
          "end": {
            "line": 21,
            "column": 119,
            "offset": 1562
          }
        }
      },
      {
        "type": "text",
        "value": ".",
        "position": {
          "start": {
            "line": 21,
            "column": 119,
            "offset": 1562
          },
          "end": {
            "line": 21,
            "column": 120,
            "offset": 1563
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 21,
        "column": 1,
        "offset": 1444
      },
      "end": {
        "line": 21,
        "column": 120,
        "offset": 1563
      }
    }
  },
  {
    "type": "heading",
    "depth": 2,
    "children": [
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "Méthode de conception",
            "position": {
              "start": {
                "line": 23,
                "column": 6,
                "offset": 1570
              },
              "end": {
                "line": 23,
                "column": 27,
                "offset": 1591
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 23,
            "column": 4,
            "offset": 1568
          },
          "end": {
            "line": 23,
            "column": 29,
            "offset": 1593
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 23,
        "column": 1,
        "offset": 1565
      },
      "end": {
        "line": 23,
        "column": 29,
        "offset": 1593
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "value": "Réduire l’empreinte environnementale de produits et services numériques est une démarche qui résonne auprès des co-fondateurs de Dr. Jonquille & Mr. Ail. C’est pourquoi nous avons mené une réflexion de réduction de son empreinte environnementale lors de la conception de l’application mobile :",
        "position": {
          "start": {
            "line": 25,
            "column": 1,
            "offset": 1595
          },
          "end": {
            "line": 25,
            "column": 294,
            "offset": 1888
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 25,
        "column": 1,
        "offset": 1595
      },
      "end": {
        "line": 25,
        "column": 294,
        "offset": 1888
      }
    }
  },
  {
    "type": "list",
    "ordered": false,
    "start": null,
    "spread": false,
    "children": [
      {
        "type": "listItem",
        "spread": false,
        "checked": null,
        "children": [
          {
            "type": "paragraph",
            "children": [
              {
                "type": "strong",
                "children": [
                  {
                    "type": "text",
                    "value": "Un principe de co-conception pour une éco-conception",
                    "position": {
                      "start": {
                        "line": 27,
                        "column": 5,
                        "offset": 1894
                      },
                      "end": {
                        "line": 27,
                        "column": 57,
                        "offset": 1946
                      }
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 27,
                    "column": 3,
                    "offset": 1892
                  },
                  "end": {
                    "line": 27,
                    "column": 59,
                    "offset": 1948
                  }
                }
              },
              {
                "type": "text",
                "value": " : dès le départ, Digital4Better et Dr. Jonquille & Mr. Ail ont travaillé main dans la main, en apportant chacun leurs expertises. Les connaissances de DJMA sur l’univers du jardinage nous ont permis de comprendre les habitudes, les attentes et les besoins des jardiniers amateurs. Digital4Better a, à l’inverse, apporté des réflexions autour de l’accessibilité et de la sobriété fonctionnelle et technique.",
                "position": {
                  "start": {
                    "line": 27,
                    "column": 59,
                    "offset": 1948
                  },
                  "end": {
                    "line": 27,
                    "column": 466,
                    "offset": 2355
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 27,
                "column": 3,
                "offset": 1892
              },
              "end": {
                "line": 27,
                "column": 466,
                "offset": 2355
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 27,
            "column": 1,
            "offset": 1890
          },
          "end": {
            "line": 27,
            "column": 466,
            "offset": 2355
          }
        }
      },
      {
        "type": "listItem",
        "spread": false,
        "checked": null,
        "children": [
          {
            "type": "paragraph",
            "children": [
              {
                "type": "strong",
                "children": [
                  {
                    "type": "text",
                    "value": "Une conception débutée en _user stories _",
                    "position": {
                      "start": {
                        "line": 28,
                        "column": 5,
                        "offset": 2360
                      },
                      "end": {
                        "line": 28,
                        "column": 46,
                        "offset": 2401
                      }
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 28,
                    "column": 3,
                    "offset": 2358
                  },
                  "end": {
                    "line": 28,
                    "column": 48,
                    "offset": 2403
                  }
                }
              },
              {
                "type": "text",
                "value": "(parcours utilisateurs) et non par écrans : Cette méthodologie permet d’aller à l’essentiel et évite la multiplication d’écrans sans but précis : chacun d'entre eux a sa place et son importance dans le parcours.",
                "position": {
                  "start": {
                    "line": 28,
                    "column": 48,
                    "offset": 2403
                  },
                  "end": {
                    "line": 28,
                    "column": 259,
                    "offset": 2614
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 28,
                "column": 3,
                "offset": 2358
              },
              "end": {
                "line": 28,
                "column": 259,
                "offset": 2614
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 28,
            "column": 1,
            "offset": 2356
          },
          "end": {
            "line": 28,
            "column": 259,
            "offset": 2614
          }
        }
      },
      {
        "type": "listItem",
        "spread": false,
        "checked": null,
        "children": [
          {
            "type": "paragraph",
            "children": [
              {
                "type": "strong",
                "children": [
                  {
                    "type": "text",
                    "value": "Une réduction des fonctionnalités",
                    "position": {
                      "start": {
                        "line": 29,
                        "column": 5,
                        "offset": 2619
                      },
                      "end": {
                        "line": 29,
                        "column": 38,
                        "offset": 2652
                      }
                    }
                  }
                ],
                "position": {
                  "start": {
                    "line": 29,
                    "column": 3,
                    "offset": 2617
                  },
                  "end": {
                    "line": 29,
                    "column": 40,
                    "offset": 2654
                  }
                }
              },
              {
                "type": "text",
                "value": " et une réflexion d’écoconception ainsi que de performance sur celles conçues : De nouvelles fonctionnalités ont été ajoutées à l’application d’encyclopédie comme la création et la gestion de jardin au quotidien. L’objectif a été d’aller à l’essentiel en concevant des écrans simples et clairs, tout en prenant en compte les volontés des utilisateurs.",
                "position": {
                  "start": {
                    "line": 29,
                    "column": 40,
                    "offset": 2654
                  },
                  "end": {
                    "line": 29,
                    "column": 391,
                    "offset": 3005
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 29,
                "column": 3,
                "offset": 2617
              },
              "end": {
                "line": 29,
                "column": 391,
                "offset": 3005
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 29,
            "column": 1,
            "offset": 2615
          },
          "end": {
            "line": 29,
            "column": 391,
            "offset": 3005
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 27,
        "column": 1,
        "offset": 1890
      },
      "end": {
        "line": 29,
        "column": 391,
        "offset": 3005
      }
    }
  },
  {
    "type": "heading",
    "depth": 2,
    "children": [
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "Résultats",
            "position": {
              "start": {
                "line": 31,
                "column": 6,
                "offset": 3012
              },
              "end": {
                "line": 31,
                "column": 15,
                "offset": 3021
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 31,
            "column": 4,
            "offset": 3010
          },
          "end": {
            "line": 31,
            "column": 17,
            "offset": 3023
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 31,
        "column": 1,
        "offset": 3007
      },
      "end": {
        "line": 31,
        "column": 17,
        "offset": 3023
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "value": "À ce jour, l’application mobile a connu plus de ",
        "position": {
          "start": {
            "line": 33,
            "column": 1,
            "offset": 3025
          },
          "end": {
            "line": 33,
            "column": 49,
            "offset": 3073
          }
        }
      },
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "100 000 téléchargements sur Android et l’App Store",
            "position": {
              "start": {
                "line": 33,
                "column": 51,
                "offset": 3075
              },
              "end": {
                "line": 33,
                "column": 101,
                "offset": 3125
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 33,
            "column": 49,
            "offset": 3073
          },
          "end": {
            "line": 33,
            "column": 103,
            "offset": 3127
          }
        }
      },
      {
        "type": "text",
        "value": " avec plus de 12 000 jardins créés et actifs au quotidien. Au-delà du nombre de téléchargements, ce sont les retours positifs des utilisateurs qui nous procurent le sentiment de travail accompli, avec une moyenne de 4/5 étoiles sur les stores :",
        "position": {
          "start": {
            "line": 33,
            "column": 103,
            "offset": 3127
          },
          "end": {
            "line": 33,
            "column": 347,
            "offset": 3371
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 33,
        "column": 1,
        "offset": 3025
      },
      "end": {
        "line": 33,
        "column": 347,
        "offset": 3371
      }
    }
  },
  {
    "type": "blockquote",
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "emphasis",
            "children": [
              {
                "type": "text",
                "value": "« Application très simple d'utilisation et très complète sur son contenu, avec laquelle on peut facilement naviguer. Le catalogue est facile d'accès, avec des interfaces et icônes très claires...Je recommande. »",
                "position": {
                  "start": {
                    "line": 35,
                    "column": 4,
                    "offset": 3376
                  },
                  "end": {
                    "line": 35,
                    "column": 215,
                    "offset": 3587
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 35,
                "column": 3,
                "offset": 3375
              },
              "end": {
                "line": 35,
                "column": 216,
                "offset": 3588
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 35,
            "column": 3,
            "offset": 3375
          },
          "end": {
            "line": 35,
            "column": 216,
            "offset": 3588
          }
        }
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "emphasis",
            "children": [
              {
                "type": "text",
                "value": "« Application très facile d'utilisation, sans publicité (ce qui devient rare) et très bien réfléchie pour l'utilisateur et pour notre planète. »",
                "position": {
                  "start": {
                    "line": 37,
                    "column": 4,
                    "offset": 3594
                  },
                  "end": {
                    "line": 37,
                    "column": 148,
                    "offset": 3738
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 37,
                "column": 3,
                "offset": 3593
              },
              "end": {
                "line": 37,
                "column": 149,
                "offset": 3739
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 37,
            "column": 3,
            "offset": 3593
          },
          "end": {
            "line": 37,
            "column": 149,
            "offset": 3739
          }
        }
      },
      {
        "type": "paragraph",
        "children": [
          {
            "type": "emphasis",
            "children": [
              {
                "type": "text",
                "value": "« Application très ergonomique et fluide. Environnement graphique apaisant et sans publicité. C'est une application ludique et apprenante très réussi. De belles propositions de contenus pédagogiques (encyclopédie, podcast, tutos) qui donne envie d'être suivies régulièrement. »",
                "position": {
                  "start": {
                    "line": 39,
                    "column": 4,
                    "offset": 3745
                  },
                  "end": {
                    "line": 39,
                    "column": 281,
                    "offset": 4022
                  }
                }
              }
            ],
            "position": {
              "start": {
                "line": 39,
                "column": 3,
                "offset": 3744
              },
              "end": {
                "line": 39,
                "column": 282,
                "offset": 4023
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 39,
            "column": 3,
            "offset": 3744
          },
          "end": {
            "line": 39,
            "column": 282,
            "offset": 4023
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 35,
        "column": 1,
        "offset": 3373
      },
      "end": {
        "line": 39,
        "column": 282,
        "offset": 4023
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "value": "Une ",
        "position": {
          "start": {
            "line": 41,
            "column": 1,
            "offset": 4025
          },
          "end": {
            "line": 41,
            "column": 5,
            "offset": 4029
          }
        }
      },
      {
        "type": "strong",
        "children": [
          {
            "type": "text",
            "value": "application mobile plus légère de 50% que ses concurrents",
            "position": {
              "start": {
                "line": 41,
                "column": 7,
                "offset": 4031
              },
              "end": {
                "line": 41,
                "column": 64,
                "offset": 4088
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 41,
            "column": 5,
            "offset": 4029
          },
          "end": {
            "line": 41,
            "column": 66,
            "offset": 4090
          }
        }
      },
      {
        "type": "text",
        "value": ", avec près de 100 espèces, des milliers de variétés, plus de 400 tutoriels, un compte pour créer son ou ses jardins, des historiques de vos actions et de vos saisons passées, de précieuses statistiques sur vos pratiques de jardinage… Et tout ça gratuitement !",
        "position": {
          "start": {
            "line": 41,
            "column": 66,
            "offset": 4090
          },
          "end": {
            "line": 41,
            "column": 326,
            "offset": 4350
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 41,
        "column": 1,
        "offset": 4025
      },
      "end": {
        "line": 41,
        "column": 326,
        "offset": 4350
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "text",
        "value": "Dr. Jonquille & Mr. Ail en a fait une belle vidéo de présentation ",
        "position": {
          "start": {
            "line": 43,
            "column": 1,
            "offset": 4352
          },
          "end": {
            "line": 43,
            "column": 67,
            "offset": 4418
          }
        }
      },
      {
        "type": "link",
        "title": null,
        "url": "https://www.youtube.com/watch?v=Or0E_TiGhLc",
        "children": [
          {
            "type": "text",
            "value": "disponible juste ici",
            "position": {
              "start": {
                "line": 43,
                "column": 68,
                "offset": 4419
              },
              "end": {
                "line": 43,
                "column": 88,
                "offset": 4439
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 43,
            "column": 67,
            "offset": 4418
          },
          "end": {
            "line": 43,
            "column": 134,
            "offset": 4485
          }
        }
      },
      {
        "type": "text",
        "value": ". Pour en savoir plus sur l’application, découvrez son site de présentation en suivant ",
        "position": {
          "start": {
            "line": 43,
            "column": 134,
            "offset": 4485
          },
          "end": {
            "line": 43,
            "column": 221,
            "offset": 4572
          }
        }
      },
      {
        "type": "link",
        "title": null,
        "url": "https://app-presentation.djma.fr/",
        "children": [
          {
            "type": "text",
            "value": "ce lien",
            "position": {
              "start": {
                "line": 43,
                "column": 222,
                "offset": 4573
              },
              "end": {
                "line": 43,
                "column": 229,
                "offset": 4580
              }
            }
          }
        ],
        "position": {
          "start": {
            "line": 43,
            "column": 221,
            "offset": 4572
          },
          "end": {
            "line": 43,
            "column": 265,
            "offset": 4616
          }
        }
      },
      {
        "type": "text",
        "value": ".",
        "position": {
          "start": {
            "line": 43,
            "column": 265,
            "offset": 4616
          },
          "end": {
            "line": 43,
            "column": 266,
            "offset": 4617
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 43,
        "column": 1,
        "offset": 4352
      },
      "end": {
        "line": 43,
        "column": 266,
        "offset": 4617
      }
    }
  },
  {
    "type": "paragraph",
    "children": [
      {
        "type": "image",
        "title": null,
        "url": "/media/appli3.jpg",
        "alt": "",
        "position": {
          "start": {
            "line": 45,
            "column": 1,
            "offset": 4619
          },
          "end": {
            "line": 45,
            "column": 23,
            "offset": 4641
          }
        }
      }
    ],
    "position": {
      "start": {
        "line": 45,
        "column": 1,
        "offset": 4619
      },
      "end": {
        "line": 45,
        "column": 23,
        "offset": 4641
      }
    }
  }
],
  "position": {
  "start": {
    "line": 1,
      "column": 1,
      "offset": 0
  },
  "end": {
    "line": 45,
      "column": 23,
      "offset": 4641
  }
}
}
*/
