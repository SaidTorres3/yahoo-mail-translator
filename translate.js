function translateText(node, translations) {
  try {
    if (node.nodeType === 3) { // Text node
      const text = node.nodeValue.trim();
      if (translations[text]) {
        node.nodeValue = translations[text];
      }
    } else if (node.nodeType === 1) { // Element node
      // Handle placeholder attribute
      if (node.placeholder && translations[node.placeholder]) {
        node.placeholder = translations[node.placeholder];
      }
      // Handle title attribute
      if (node.title && translations[node.title]) {
        node.title = translations[node.title];
      }
      // Recursively translate child nodes
      node.childNodes.forEach(childNode => translateText(childNode, translations));
    }
  } catch (error) {
    console.error('Error translating text:', error);
  }
}

function translatePage(translations) {
  try {
    document.body.childNodes.forEach(node => translateText(node, translations));
  } catch (error) {
    console.error('Error translating page:', error);
  }
}

fetch(chrome.runtime.getURL('translations.json'))
  .then(response => response.json())
  .then(translations => {
    // Observe changes to translate dynamically loaded content
    const observer = new MutationObserver(() => {
      try {
        translatePage(translations);
      } catch (error) {
        console.error('Error observing mutations:', error);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial translation
    translatePage(translations);
  })
  .catch(error => console.error('Error loading translations:', error));
