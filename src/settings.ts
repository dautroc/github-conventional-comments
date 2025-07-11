document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("settings-form") as HTMLFormElement;

  // 1. Load the saved setting and update the UI.
  chrome.storage.sync.get({ triggerMode: "buttons" }, (data) => {
    const radio = form.querySelector(
      `input[name="trigger-mode"][value="${data.triggerMode}"]`
    ) as HTMLInputElement;
    if (radio) {
      radio.checked = true;
    }
  });

  // 2. Save the setting when the user changes it.
  form.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name === "trigger-mode") {
      chrome.storage.sync.set({ triggerMode: target.value });
    }
  });
}); 