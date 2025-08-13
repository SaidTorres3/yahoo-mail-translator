// translate.js
let __ymt_translationObserver = null;
let __ymt_translationInitialized = false;
const TRANSLATION_KEY = 'translationEnabled';

function translateText(node, translations, dynamicPatterns) {
  try {
    if (node.nodeType === 3) { // Text node
      const original = node.nodeValue;
      const trimmed = original.trim();

      // 1) Traducción exacta
      if (translations[trimmed]) {
        node.nodeValue = original.replace(trimmed, translations[trimmed]);
        return;
      }

      // 2) Patrones dinámicos
      for (const { regex, replacer } of dynamicPatterns) {
        const match = regex.exec(trimmed);
        if (match) {
          const replacement = replacer(...match.slice(1));
          node.nodeValue = original.replace(trimmed, replacement);
          return;
        }
      }
    }
    else if (node.nodeType === 1) { // Element node
      // placeholder
      if (node.placeholder && translations[node.placeholder]) {
        node.placeholder = translations[node.placeholder];
      }
      // title
      if (node.title && translations[node.title]) {
        node.title = translations[node.title];
      }
      // recursión en hijos
      node.childNodes.forEach(child =>
        translateText(child, translations, dynamicPatterns)
      );
    }
  }
  catch (error) {
    console.error('Error translating text:', error);
  }
}

function translatePage(translations, dynamicPatterns) {
  document.body.childNodes.forEach(node =>
    translateText(node, translations, dynamicPatterns)
  );
}

function startTranslation() {
  if (__ymt_translationInitialized) return; // evitar doble init
  __ymt_translationInitialized = true;
  fetch(chrome.runtime.getURL('translations.json'))
    .then(res => res.json())
    .then(translations => {
    const dynamicPatterns = [
      // 1) "Uncheck all messages, 1 message checked."
      {
        regex: /^Uncheck all messages, (\d+) message checked\.$/,
        replacer: (count) => {
          const n = parseInt(count, 10);
          return `Deseleccionar todos los mensajes, ${n} mensaje${n === 1 ? '' : 's'} marcado${n === 1 ? '' : 's'}.`;
        }
      },
      // 2) "Earlier in April"
      {
        regex: /^Earlier in (\w+)$/,
        replacer: (month) => {
          const translatedMonth = translations[month] || month;
          return `Anteriormente en ${translatedMonth}`;
        }
      },
      // 3) "Jan 17", "Feb 12", etc.
      {
        regex: /^([A-Za-z]{3}) (\d{1,2})$/,
        replacer: (abbr, day) => {
          const monthMap = {
            Jan: 'January', Feb: 'February', Mar: 'March',
            Apr: 'April', May: 'May', Jun: 'June',
            Jul: 'July', Aug: 'August', Sep: 'September',
            Oct: 'October', Nov: 'November', Dec: 'December'
          };
          const fullEng = monthMap[abbr] || abbr;
          const translatedMonth = translations[fullEng] || fullEng;
          return `${day} de ${translatedMonth}`;
        }
      },
      // 4a) Fecha sin año: "Thu, Feb 13 at 12:03 PM"
      {
        regex: /^([A-Za-z]{3}),\s([A-Za-z]{3}) (\d{1,2}) at (\d{1,2}:\d{2} (?:AM|PM))$/,
        replacer: (wkAbbr, moAbbr, day, time) => {
          const weekdayEs = {
            Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles',
            Thu: 'Jueves', Fri: 'Viernes', Sat: 'Sábado', Sun: 'Domingo'
          }[wkAbbr] || wkAbbr;

          const monthEs = {
            Jan: 'enero', Feb: 'febrero', Mar: 'marzo',
            Apr: 'abril', May: 'mayo', Jun: 'junio',
            Jul: 'julio', Aug: 'agosto', Sep: 'septiembre',
            Oct: 'octubre', Nov: 'noviembre', Dec: 'diciembre'
          }[moAbbr] || moAbbr;

          const timeEs = time
            .replace('AM', 'a. m.')
            .replace('PM', 'p. m.');

          return `${weekdayEs}, ${day} de ${monthEs} a las ${timeEs}`;
        }
      },
      // 4b) Fecha con año: "Wed, Aug 21, 2024 at 12:55 AM"
      {
        regex: /^([A-Za-z]{3}),\s([A-Za-z]{3}) (\d{1,2}), (\d{4}) at (\d{1,2}:\d{2} (?:AM|PM))$/,
        replacer: (wkAbbr, moAbbr, day, year, time) => {
          const weekdayEs = {
            Mon: 'Lunes', Tue: 'Martes', Wed: 'Miércoles',
            Thu: 'Jueves', Fri: 'Viernes', Sat: 'Sábado', Sun: 'Domingo'
          }[wkAbbr] || wkAbbr;

          const monthEs = {
            Jan: 'enero', Feb: 'febrero', Mar: 'marzo',
            Apr: 'abril', May: 'mayo', Jun: 'junio',
            Jul: 'julio', Aug: 'agosto', Sep: 'septiembre',
            Oct: 'octubre', Nov: 'noviembre', Dec: 'diciembre'
          }[moAbbr] || moAbbr;

          const timeEs = time
            .replace('AM', 'a. m.')
            .replace('PM', 'p. m.');

          return `${weekdayEs}, ${day} de ${monthEs} de ${year} a las ${timeEs}`;
        }
      },
      // 5) "0/100 selected"
      {
        regex: /^(\d+)\/(\d+) (?:selected|seleccionado)$/,
        replacer: (num, total) => `${num}/${total} seleccionado`
      },
      // April 2025 => Abril 2025
      {
        regex: /^([A-Za-z]+) (\d{4})$/,
        replacer: (month, year) => {
          const translatedMonth = translations[month] || month;
          return `${translatedMonth} ${year}`;
        }
      },
    ];

    // Observa cambios en el DOM para retraducir dinámicamente
      __ymt_translationObserver = new MutationObserver(() =>
        translatePage(translations, dynamicPatterns)
      );
      __ymt_translationObserver.observe(document.body, { childList: true, subtree: true });
      translatePage(translations, dynamicPatterns);
    })
    .catch(err => console.error('Error loading translations:', err));
}

function stopTranslation() {
  if (__ymt_translationObserver) {
    __ymt_translationObserver.disconnect();
    __ymt_translationObserver = null;
  }
}

function initToggle() {
  if (!chrome?.storage?.sync) {
    // Sin storage => activar por defecto
    startTranslation();
    return;
  }
  chrome.storage.sync.get({ [TRANSLATION_KEY]: true }, (res) => {
    if (res[TRANSLATION_KEY]) startTranslation();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes[TRANSLATION_KEY]) {
      const newVal = changes[TRANSLATION_KEY].newValue;
      if (newVal) {
        startTranslation();
      } else {
        stopTranslation();
      }
    }
  });
}

initToggle();
