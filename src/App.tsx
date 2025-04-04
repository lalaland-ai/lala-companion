import {
  Box,
  Button,
  Container,
  FormControlLabel,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Switch,
  ThemeProvider,
  Typography,
} from "@mui/material";
import React, { FormEvent, useCallback, useState } from "react";
import { theme } from "./theme";
import CssBaseline from "@mui/material/CssBaseline";
import TabUnselectedIcon from "@mui/icons-material/TabUnselected";
import WebAssetOffIcon from "@mui/icons-material/WebAssetOff";
import SendIcon from "@mui/icons-material/Send";

const App = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isOverlayFrameActive, setIsOverlayFrameActive] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isHotMicActive, setIsHotMicActive] = useState<boolean>(false);

  const onOpenOverlay = useCallback(() => {
    (window as any).electronAPI.openOverlay();
    setIsOverlayOpen(true);
  }, []);

  const onCloseOverlay = useCallback(() => {
    (window as any).electronAPI.closeOverlay();
    setIsOverlayOpen(false);
  }, []);

  const onPromptSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      console.log("prompt", prompt);
      (window as any).electronAPI.sendPrompt(prompt);
      setPrompt("");
    },
    [prompt]
  );

  const onToggleHotMic = useCallback(() => {
    setIsHotMicActive(!isHotMicActive);
    (window as any).electronAPI.setHotMic(!isHotMicActive);
  }, [isHotMicActive]);

  const onPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrompt(e.target.value);
      (window as any).electronAPI.setPrompt(e.target.value);
    },
    []
  );

  return (
    <Container maxWidth="md" sx={{ p: 1 }}>
      <Stack alignItems="center" my={2}>
        <img
          src="https://lalaland.chat/lalaland.png"
          alt="Lala"
          style={{
            width: "50%",
            maxWidth: "18rem",
          }}
        />
      </Stack>

      <Typography variant="h4" gutterBottom>
        Lala Companion
      </Typography>

      <Typography variant="body1">
        3D personified desktop assistants, tuned for you, powered by AI vision
        and voice
      </Typography>

      <Stack spacing={2} sx={{ mt: 3 }}>
        <Button
          onClick={isOverlayOpen ? onCloseOverlay : onOpenOverlay}
          variant={isOverlayOpen ? "outlined" : "contained"}
          endIcon={isOverlayOpen ? <WebAssetOffIcon /> : <TabUnselectedIcon />}
        >
          {isOverlayOpen ? "Close" : "Open"} Overlay
        </Button>

        {isOverlayOpen && (
          <>
            <Button
              onClick={
                isOverlayFrameActive
                  ? () => {
                      (window as any).electronAPI.closeOverlayFrame();
                      setIsOverlayFrameActive(false);
                    }
                  : () => {
                      (window as any).electronAPI.openOverlayFrame();
                      setIsOverlayFrameActive(true);
                    }
              }
              variant={isOverlayFrameActive ? "outlined" : "contained"}
            >
              {isOverlayFrameActive ? "Close" : "Open"} Frame
            </Button>

            <Paper
              component="form"
              onSubmit={onPromptSubmit}
              sx={{
                p: "0.25rem 0.5rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Prompt"
                value={prompt}
                onChange={onPromptChange}
              />
              <IconButton
                type="button"
                sx={{ p: 1 }}
                onClick={() =>
                  onPromptSubmit({
                    preventDefault: () => {},
                  } as FormEvent<HTMLFormElement>)
                }
              >
                <SendIcon />
              </IconButton>
            </Paper>

            <FormControlLabel
              control={
                <Switch value={isHotMicActive} onChange={onToggleHotMic} />
              }
              label="Always on microphone"
            />
          </>
        )}
      </Stack>
    </Container>
  );
};

const AppLayout = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box id="background-image" />
      <App />
    </ThemeProvider>
  );
};

export default AppLayout;
