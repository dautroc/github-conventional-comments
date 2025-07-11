import { setup as setupInputHandler } from "./inputHandler";
import { setup as setupButtonHandler } from "./buttonHandler";

function checkIfGithubPullRequest() {
  if (!window || !window.location) return false;
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  const isGitHub = hostname === "github.com" || hostname.includes("github");
  const isPullRequest = /\/[^\/]+\/[^\/]+\/pull\/\d+/.test(pathname);

  return isGitHub && isPullRequest;
}

// Initialize the extension based on the user's saved setting.
chrome.storage.sync.get({ triggerMode: "buttons" }, (data) => {
  // Only initialize if we're on a GitHub pull request page
  if (checkIfGithubPullRequest()) {
    if (data.triggerMode === "both") {
      setupButtonHandler();
      setupInputHandler();
    } else if (data.triggerMode === "buttons") {
      setupButtonHandler();
    } else if (data.triggerMode === "trigger") {
      setupInputHandler();
    }
  }
});
