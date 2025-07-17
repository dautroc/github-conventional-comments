import { setup as setupInputHandler } from "./inputHandler";
import { setup as setupButtonHandler } from "./buttonHandler";

// Initialize the extension based on the user's saved setting.
chrome.storage.sync.get({ triggerMode: "buttons" }, (data) => {
  if (data.triggerMode === "both") {
      setupButtonHandler();
      setupInputHandler();
    } else if (data.triggerMode === "buttons") {
      setupButtonHandler();
    } else if (data.triggerMode === "trigger") {
      setupInputHandler();
    }
});
