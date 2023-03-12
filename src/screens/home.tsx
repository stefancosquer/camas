import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";
import { useEffect, useState } from "react";
import { useBackend } from "../backends/backend";
import { Site, useSite } from "../hooks/site";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { slugify } from "../utils";

const DEFAULT: Site = {
  name: "",
  url: "",
  backend: "azure",
  user: "",
  token: "",
  org: "",
  project: "",
  repository: "",
  branch: "",
};

export const Home = () => {
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [site, setSite] = useState(DEFAULT);
  const [projects, setProjects] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [branches, setBranches] = useState([]);
  const { sites, addSite, removeSite } = useSite();
  const { listProjects, listRepositories, listBranches, needOrg, needUser } =
    useBackend(site);
  const back = () => {
    if (step === 1) {
      setSite({
        ...site,
        backend: DEFAULT.backend,
        token: DEFAULT.repository,
        org: DEFAULT.branch,
        user: DEFAULT.user,
      });
      setStep(0);
    }
    if (step === 2) {
      setSite({
        ...site,
        project: DEFAULT.project,
        repository: DEFAULT.repository,
        branch: DEFAULT.branch,
      });
      setStep(1);
    }
  };
  const next = async () => {
    if (step === 0) {
      if (site.name !== "" && site.url != "") {
        setStep(1);
      }
    } else if (step === 1) {
      if (
        (!needOrg || site.org !== "") &&
        (!needUser || site.user !== "") &&
        site.token != ""
      ) {
        try {
          setProjects(await listProjects());
          setStep(2);
        } catch (e) {
          console.error(e);
        }
      }
    } else if (step === 2) {
      addSite(site);
      setEditing(false);
    }
  };
  useEffect(() => {
    (async () => {
      setSite({ ...site, repository: "" });
      if (site.project !== "") {
        setRepositories(await listRepositories());
      } else {
        setRepositories([]);
      }
    })();
  }, [site.project]);
  useEffect(() => {
    (async () => {
      setSite({ ...site, branch: "" });
      if (site.repository !== "") {
        setBranches(await listBranches());
      } else {
        setBranches([]);
      }
    })();
  }, [site.repository]);
  return (
    <Grid
      sx={{ minHeight: "100vh", pt: 6 }}
      direction="column"
      alignContent="center"
      container
      spacing={1}
    >
      <Grid sx={{ minWidth: "500px" }} item>
        <Box sx={{ display: "flex", py: 1, alignItems: "center" }}>
          <Typography sx={{ flex: 1 }} variant="h4">
            Sites
          </Typography>
          <Button
            onClick={() => {
              setEditing(!editing);
              setSite(DEFAULT);
              setStep(0);
            }}
            size="small"
            variant="outlined"
          >
            {editing ? "Cancel" : "Add"}
          </Button>
        </Box>
        <Divider />
        {editing && (
          <Stack spacing={1}>
            <Stepper sx={{ mt: 3, mb: 2 }} activeStep={step}>
              <Step>
                <StepLabel>Site</StepLabel>
              </Step>
              <Step>
                <StepLabel>Backend</StepLabel>
              </Step>
              <Step>
                <StepLabel>Repository</StepLabel>
              </Step>
            </Stepper>
            {step === 0 && (
              <>
                <TextField
                  size="small"
                  label="Site name"
                  variant="outlined"
                  fullWidth
                  value={site.name}
                  onChange={(event) =>
                    setSite({ ...site, name: event.target.value })
                  }
                  required
                />
                <TextField
                  size="small"
                  label="Site url"
                  variant="outlined"
                  fullWidth
                  value={site.url}
                  onChange={(event) =>
                    setSite({ ...site, url: event.target.value })
                  }
                  required
                />
              </>
            )}
            {step === 1 && (
              <>
                <TextField
                  select
                  fullWidth
                  label="Backend"
                  size="small"
                  value={site.backend}
                  onChange={(event) =>
                    setSite({
                      ...site,
                      backend: event.target.value as Site["backend"],
                    })
                  }
                  required
                >
                  <MenuItem value="azure">Azure DevOps</MenuItem>
                  <MenuItem value="bitbucket">Bitbucket</MenuItem>
                  <MenuItem value="github">GitHub</MenuItem>
                  <MenuItem value="gitlab" disabled>
                    Gitlab
                  </MenuItem>
                </TextField>
                {needOrg && (
                  <TextField
                    size="small"
                    label="Organization"
                    variant="outlined"
                    fullWidth
                    value={site.org}
                    onChange={(event) =>
                      setSite({ ...site, org: event.target.value })
                    }
                    required
                  />
                )}
                {needUser && (
                  <TextField
                    size="small"
                    label="Username"
                    variant="outlined"
                    fullWidth
                    value={site.user}
                    onChange={(event) =>
                      setSite({ ...site, user: event.target.value })
                    }
                    required
                  />
                )}
                <TextField
                  size="small"
                  label="Personal Access Token"
                  variant="outlined"
                  fullWidth
                  value={site.token}
                  onChange={(event) =>
                    setSite({ ...site, token: event.target.value })
                  }
                  required
                />
              </>
            )}
            {step === 2 && (
              <>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Project"
                  disabled={projects.length === 0}
                  value={site.project}
                  onChange={(event) =>
                    setSite({ ...site, project: event.target.value })
                  }
                >
                  {projects.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Repository"
                  disabled={repositories.length === 0}
                  value={site.repository}
                  onChange={(event) =>
                    setSite({ ...site, repository: event.target.value })
                  }
                >
                  {repositories.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Branch"
                  disabled={branches.length === 0}
                  value={site.branch}
                  onChange={(event) =>
                    setSite({ ...site, branch: event.target.value })
                  }
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      {branch}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
            <Stack
              sx={{ pt: 1 }}
              direction="row"
              justifyContent="space-between"
            >
              <Button
                size="small"
                onClick={() => back()}
                disabled={step === 0}
                variant="outlined"
              >
                Back
              </Button>
              <Button size="small" onClick={() => next()} variant="contained">
                {step === 2 ? "Add" : "Next"}
              </Button>
            </Stack>
          </Stack>
        )}
        {!editing && sites.length === 0 && (
          <Typography sx={{ my: 2 }}>No site configured</Typography>
        )}
        {!editing && sites.length > 0 && (
          <List>
            {sites
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(({ name, url }, index) => (
                <ListItem divider key={index}>
                  <ListItemText
                    primary={
                      <Link
                        sx={{
                          color: "text.primary",
                          cursor: "pointer",
                          textDecoration: "none",
                          ":hover": { textDecoration: "underline" },
                        }}
                        href={slugify(name)}
                      >
                        {name}
                      </Link>
                    }
                    secondary={
                      <Link
                        sx={{
                          textDecoration: "none",
                          ":hover": { textDecoration: "underline" },
                        }}
                        href={`https://${url}`}
                        target="_blank"
                      >
                        {url}
                      </Link>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() =>
                        confirm("Delete this site ?") && removeSite(index)
                      }
                    >
                      <DeleteOutlineOutlined />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        )}
      </Grid>
    </Grid>
  );
};
