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
import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { theme } from "./theme";
import CssBaseline from "@mui/material/CssBaseline";
import TabUnselectedIcon from "@mui/icons-material/TabUnselected";
import WebAssetOffIcon from "@mui/icons-material/WebAssetOff";
import SendIcon from "@mui/icons-material/Send";
import { useChat } from "../node_modules/ai/react/dist/index";
import { OperationAction, makeOperationPrompt } from "./self-operate";

const App = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isOverlayFrameActive, setIsOverlayFrameActive] = useState(false);
  const [prompt, setPrompt] = useState<string>("");
  const [isHotMicActive, setIsHotMicActive] = useState<boolean>(false);
  const [isSelfOperateActive, setIsSelfOperateActive] =
    useState<boolean>(false);
  const [previousActions, setPreviousActions] = useState<string[]>([]);

  const { append } = useChat({
    api: "https://lalaland.chat/api/companion/chat",
    body: {
      username: "unknown",
    },
    id: "self-operate",
    onFinish: async (data) => {
      try {
        console.log(data);
        const action = data.content.split(" ")?.[0];
        const args = data.content.substring(action.length + 1);

        console.log(action, args);

        if (action === OperationAction.CLICK) {
          (window as any).electronAPI.sendPrompt(
            "Your tasked with making a mouse click action on the user's computer. Say your working on it in a cute / funny way. Keep it short under 100 chars."
          );

          const cords = JSON.parse(args);
          (window as any).electronAPI.click({
            x: Number(cords.x),
            y: Number(cords.y),
          });
        } else if (action === OperationAction.TYPE) {
          (window as any).electronAPI.sendPrompt(
            "Your tasked with making a keyboard type action on the user's computer. Say your working on it in a cute / funny way. Keep it short under 100 chars."
          );

          (window as any).electronAPI.type(args);
        }
        setPreviousActions((prev) => [...prev, data.content]);

        if (data.content !== OperationAction.DONE) {
          setTimeout(() => {
            (window as any).electronAPI.getScreenshot();
          }, 1000 * 10);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

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
      if (isSelfOperateActive) {
        (window as any).electronAPI.getScreenshot(prompt);
      }
      (window as any).electronAPI.sendPrompt(prompt);
      setPrompt("");
    },
    [prompt, isSelfOperateActive]
  );

  const onToggleHotMic = useCallback(() => {
    setIsHotMicActive(!isHotMicActive);
    (window as any).electronAPI.setHotMic(!isHotMicActive);
  }, [isHotMicActive]);

  const onToggleSelfOperate = useCallback(() => {
    setIsSelfOperateActive(!isSelfOperateActive);
  }, [isSelfOperateActive]);

  const onPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPrompt(e.target.value);
      (window as any).electronAPI.setPrompt(e.target.value);
    },
    []
  );

  useEffect(() => {
    (window as any).electronAPI?.onScreenshot(
      ({
        image,
        height,
        width,
        prompt,
      }: {
        image: string;
        height: number;
        width: number;
        prompt: string;
      }) => {
        const operationPrompt = makeOperationPrompt(
          prompt,
          previousActions,
          height,
          width
        );

        append({
          role: "user",
          content: operationPrompt,
          data: {
            imageData: image,
            username: "unknown",
          },
        });
      }
    );
  }, []);

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

            <FormControlLabel
              control={
                <Switch
                  value={isSelfOperateActive}
                  onChange={onToggleSelfOperate}
                  color="secondary"
                />
              }
              label="Self operate computer"
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
