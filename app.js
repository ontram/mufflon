/* 
Prototype: Translating text with ModernMT | DeepL | ChatGPT
*/

const LanguageComparator = (a, b) => {
  // console.debug("comparing ", a, b);
  if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  }
  return 0; // if a === b
};

const availableEngines = [
  {
    id: "modernmt",
    name: "ModernMT",
    url: config.modernmt.url,
  },
  {
    id: "deepl",
    name: "DeepL",
    url: config.deepl.url,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: config.chatgpt.url,
  },
];

const prepareDeeplRequest = (sourceText, sourceLanguage, targetLanguage, formality) => {
  const deeplData = {
    text: [sourceText],
    target_lang: targetLanguage,
    sourceLanguage: sourceLanguage,
    formality: formality, // [ default | more | less | ... ]
  };
  return {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deeplData),
    redirect: "follow",
  };
};

function fetchAndProcessDeepLTranslation(requestUrl, sourceText, sourceLanguage, targetLanguage, formality) {
  const deeplRequestOptions = prepareDeeplRequest(sourceText, sourceLanguage, targetLanguage, formality);
  return fetch(requestUrl, deeplRequestOptions)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Error while requesting DeepL translation");
      }
    })
    .then((result) => {
      return result.translations[0];
    });
}

const app = Vue.createApp({
  mounted: function () {
    this.getLanguages();
    this.initialized = true;
    this.selectedEngine = this.engines[1];
  },
  data: function () {
    return {
      initialized: false,
      engines: availableEngines,
      selectedEngine: {},
      languages: [],
      sourceLanguage: "",
      targetLanguage: "",
      sourceText: "",
      translation: "",
      altTranslations: [],
    };
  },

  methods: {
    resetApp() {
      this.resetAlert();
      this.sourceLanguage = "";
      this.targetLanguage = "";
      this.sourceText = "";
      this.translation = "";
      this.altTranslations = [];
    },

    getLanguages() {
      let languageCodes = mmtLanguages;
      let sortedLanguages = [];
      let languageNames = new Intl.DisplayNames(["de"], { type: "language" });
      languageCodes.forEach((lang) => {
        let language = {
          code: lang,
          name: languageNames.of(lang),
        };
        sortedLanguages.push(language);
      });
      sortedLanguages.sort(LanguageComparator);
      this.languages = sortedLanguages;
      // set default value: en
      this.targetLanguage = "en";
    },

    translate() {
      this.resetAlert();
      this.translation = "";
      this.altTranslations = [];

      if (!this.sourceText) {
        this.appendAlert("Du hast keinen Text eingegeben.", "danger");
        return;
      }

      let requestUrl = this.selectedEngine.url;

      switch (this.selectedEngine.id) {
        case "modernmt":
          const mmtParams = new URLSearchParams({
            source: this.sourceLanguage, // automatic detection when empty
            target: this.targetLanguage,
            q: this.sourceText,
            alt_translations: 3,
          });
          requestUrl = requestUrl + "/translate?" + mmtParams.toString();

          fetch(requestUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "MMT-Platform": "ontram-mufflon-prototype",
              "MMT-PlatformVersion": "0.1",
              "MMT-PluginVersion": "0.1",
              // MMT-ApiKey is added in proxy
            },
          })
            .then((response) => response.json())
            .then((response) => {
              // console.debug("Result =", JSON.stringify(response.data));
              if (response.status == 200) {
                if (response.data.detectedLanguage) {
                  this.sourceLanguage = response.data.detectedLanguage;
                }
                this.translation = response.data.translation;
                this.altTranslations = response.data.altTranslations;
              } else {
                this.appendAlert("Es ist leider ein Fehler aufgetreten:<br>" + JSON.stringify(response), "danger");
              }
            })
            .catch((error) => {
              console.log(error);
              this.appendAlert("Es ist leider ein Fehler aufgetreten.", "danger");
            });
          break;

        case "deepl":
          // first request with formality=default
          console.log("starting request...");
          fetchAndProcessDeepLTranslation(requestUrl, this.sourceText, this.sourceLanguage, this.targetLanguage, "default")
            .then((translation) => {
              this.translation = translation.text;
              this.sourceLanguage = translation.detected_source_language.toLowerCase();
            })
            .catch((error) => console.log("Fehler:", error));

          // second and third request with formality=more|less if available for certain languages
          if (["de", "fr", "it", "es", "nl", "pl", "pt-br", "pt-pt", "ja", "ru"].includes(this.targetLanguage)) {
            console.log("looking for alternatives...");
            const formalities = ["prefer_more", "prefer_less"];

            Promise.all(
              formalities.map((formality) =>
                fetchAndProcessDeepLTranslation(requestUrl, this.sourceText, this.sourceLanguage, this.targetLanguage, formality).then(
                  (translation) => translation.text
                )
              )
            )
              .then((translations) => {
                this.altTranslations.push(...translations);
              })
              .catch((error) => {
                console.log("Error: ", error);
                this.appendAlert("Es ist leider ein Fehler aufgetreten:<br>" + JSON.stringify(response), "danger");
              });
          }

          break;

        case "chatgpt":
          this.appendAlert("ChatGPT ist leider noch nicht verfügbar.", "warning");
          console.error("ChatGPT is not yet supported.");
          break;
      }
    },

    switchLanguages() {
      // switch languages
      let sourceLangOld = this.sourceLanguage;
      this.sourceLanguage = this.targetLanguage;
      this.targetLanguage = sourceLangOld;
      // switch the text
      this.sourceText = this.translation;
      this.translation = "";
      // reset alternatives
      this.altTranslations = [];
      // start translation with switched language
      this.translate();
    },

    copyTranslationToClipboard() {
      let textToCopy = this.translation;
      this.copyToClipboard(textToCopy);
    },

    copyAlternativeToClipboard(i) {
      let textToCopy = this.altTranslations[i];
      this.copyToClipboard(textToCopy);
    },

    copyToClipboard(textToCopy) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          console.debug("Copied to clipboard: " + textToCopy);
        })
        .catch((error) => {
          console.error("Copy to clipboard failed: ", error);
        });
    },

    makeDiff(a, b) {
      const textdiff = JsDiff.diffWords(a, b);
      let target = document.createElement("span");
      target.className = "diff-wrap";

      textdiff.forEach((part) => {
        let span = document.createElement("span");
        if (part.added) {
          span.className = "added bg-warning-subtle";
        } else if (part.removed) {
          span.className = "removed bg-danger-subtle";
        }
        span.appendChild(document.createTextNode(part.value));
        target.appendChild(span);
      });
      return target;
    },

    getTextDiff(text) {
      return this.makeDiff(this.translation, text).innerHTML;
    },

    appendAlert(message, type) {
      const alertPlaceholder = document.getElementById("liveAlertPlaceholder");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = [`<div class="alert alert-${type} alert-dismissible" role="alert">`, `   <div>${message}</div>`, "</div>"].join(
        ""
      );
      alertPlaceholder.append(wrapper);
    },

    resetAlert() {
      const alertPlaceholder = document.getElementById("liveAlertPlaceholder");
      alertPlaceholder.innerHTML = "";
    },
  },
});

const vm = app.mount("#app");
