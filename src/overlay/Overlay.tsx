import React, { useCallback, useEffect, useState } from "react";
import VRMCompanion from "../components/VRMCompanion";
import { useChat } from "../../node_modules/ai/react/dist/index";
import hark from "hark";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.js";

const Overlay = () => {
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [recentResponse, setRecentResponse] = useState<string>("");
  const [isLalaSpeaking, setIsLalaSpeaking] = useState<boolean>(false);
  const [isHotMicActive, setIsHotMicActive] = useState<boolean>(false);

  const getVoiceAudio = useCallback(async (text: string) => {
    try {
      const voiceResp = await fetch("https://lalaland.chat/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: "zrHiDhphv9ZnVXBqCLjz",
          voiceProvider: "ElevenLabs",
        }),
      });

      if (voiceResp.ok) {
        const voiceBlob = await voiceResp.blob();
        const voiceUrl = URL.createObjectURL(voiceBlob);
        return voiceUrl;
      } else {
        console.log("Voice response error", voiceResp);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const { append } = useChat({
    api: "https://lalaland.chat/api/companion/chat",
    body: {
      username: "unknown",
    },
    onFinish: async (data) => {
      console.log(data);
      setVoiceUrl(await getVoiceAudio(data.content));
      setRecentResponse(data.content);
    },
  });

  useEffect(() => {
    append({
      role: "user",
      content:
        "Your name is Lala. You are a cute, smart, Anime girl AI companion inside the user's computer. Like Cortana from Halo. Greet the user on first message. Tell jokes, teach them, or just hangout. Keep it under 500 characters. Do not use emoijis and do not bracket your response with quotes.",
    });
  }, []);

  useEffect(() => {
    (window as any).electronAPI?.onHotMicToggled((isActive: boolean) => {
      setIsHotMicActive(isActive);
    });

    (window as any).electronAPI?.onPromptSent((prompt: string) => {
      console.log("prompt", prompt);
      append({
        role: "user",
        content: prompt,
      });
    });
  }, []);

  // whisper chunking magic here
  useEffect(() => {
    let stream: MediaStream = null;
    let speechEvents: hark.Harker = null;
    let wavesurfer: WaveSurfer = null;
    let recorder: RecordPlugin = null;
    let isUserSpeaking = false;
    let isLoading = false;

    const main = async () => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      speechEvents = hark(stream);

      wavesurfer = WaveSurfer.create({
        container: "#recorder",
        height: 0,
      });

      recorder = wavesurfer.registerPlugin(
        RecordPlugin.create({
          scrollingWaveform: true,
          renderRecordedAudio: false,
        })
      );

      speechEvents.on("speaking", () => {
        if (isLalaSpeaking || isLoading) return;
        isUserSpeaking = true;
        recorder.startRecording();
        console.log("Started speaking");
      });

      speechEvents.on("stopped_speaking", () => {
        if (isLalaSpeaking) return;
        isLoading = true;
        recorder.stopRecording();
        isUserSpeaking = false;
        console.log("Stopped speaking");
      });

      recorder.on("record-end", async (blob) => {
        console.log("recording stopped");
        const formData = new FormData();

        const file = new File([blob], "voice.wav", {
          type: "audio/wav",
        });

        console.log(file);

        formData.append("file", file);

        const whisperResp = await fetch(
          "https://lalaland.chat/api/magic/whisper",
          {
            method: "POST",
            body: formData,
          }
        );

        if (whisperResp.ok) {
          const whisperText = await whisperResp.json();
          console.log(whisperText);
          await append({
            role: "user",
            content: whisperText,
          });
          setTimeout(() => {
            isLoading = false;
          }, 5000);
        } else {
          console.log("error whispering", whisperResp);
          isLoading = false;
        }
      });
    };

    if (isHotMicActive) {
      main();
    }

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      speechEvents?.stop();
      wavesurfer?.destroy();
      recorder?.destroy();
      isUserSpeaking = false;
      isLoading = false;
    };
  }, [isLalaSpeaking, isHotMicActive]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <VRMCompanion
        virtualText={recentResponse}
        voiceUrl={voiceUrl}
        onSpeakStart={() => setIsLalaSpeaking(true)}
        onSpeakEnd={() => setIsLalaSpeaking(false)}
      />
      <div id="recorder" />
    </div>
  );
};

const OverlayLayout = () => {
  return <Overlay />;
};

export default OverlayLayout;
