import React from "react";
import VRMCompanion from "../components/VRMCompanion";

const Overlay = () => {
  return (
    <div style={{
      height: "100%",
      width: "100%"
    }}>
      <VRMCompanion virtualText="Hello World!" voiceUrl="" />
    </div>
  );
};

export default Overlay;
