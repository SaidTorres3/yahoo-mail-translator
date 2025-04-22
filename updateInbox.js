(function () {
  function updateInbox() {
    const targetDiv = document.querySelector('span[data-test-id="folder-label"]');
    if (targetDiv) {
      targetDiv.click();
    }
  }

  setInterval(() => {
    const currentUrl = window.location.href;
    const baseUrl = "https://mail.yahoo.com/d/folders/1";
    const urlWithoutParams = currentUrl.split('?')[0];

    if (urlWithoutParams === baseUrl) {
      updateInbox();
    }
  }, 15000);
})();
