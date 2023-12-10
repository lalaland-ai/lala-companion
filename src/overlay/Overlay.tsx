import React, { useCallback, useEffect, useState } from "react";
import VRMCompanion from "../components/VRMCompanion";
import { useChat } from "../../node_modules/ai/react/dist/index";

const Overlay = () => {
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const [recentResponse, setRecentResponse] = useState<string>("");

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

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <VRMCompanion virtualText={recentResponse} voiceUrl={voiceUrl} />
    </div>
  );
};

const OverlayLayout = () => {
  return <Overlay />;
};

export default OverlayLayout;
