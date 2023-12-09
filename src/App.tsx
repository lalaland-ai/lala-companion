import React, { useCallback, useState } from "react";

const App = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const onOpenOverlay = useCallback(() => {
    (window as any).electronAPI.openOverlay();
    setIsOverlayOpen(true);
  }, []);

  const onCloseOverlay = useCallback(() => {
    (window as any).electronAPI.closeOverlay();
    setIsOverlayOpen(false);
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
      }}
    >
      <img src="https://lalaland.chat/lalaland.png" alt="Lala" />
      <h1>Lala Companion</h1>
      <p>
        3D personified desktop assistants, tuned for you, powered by AI vision
        and voice
      </p>
      <button
        onClick={isOverlayOpen ? onCloseOverlay : onOpenOverlay}
        type="button"
        style={{
          backgroundColor: isOverlayOpen ? "red" : "green",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        {isOverlayOpen ? "Close" : "Open"} Overlay
      </button>
    </div>
  );
};

const AppLayout = () => {
  return <App />;
};

export default AppLayout;
