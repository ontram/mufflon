/* 
Prototype: Ttranslating text with ModernMT
*/

const mmt = {
  url: "https://api.modernmt.com",
};

const LanguageComparator = (a, b) => {
  // console.debug("comparing ", a, b);
  if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  }
  return 0; // if a === b
};

const app = Vue.createApp({
  created: function () {
    if (localStorage.getItem("mmtApiKey")) {
      this.checkApiKey(localStorage.getItem("mmtApiKey"));
      this.getLanguages();
    }
  },
  data: function () {
    return {
      apiKey: "",
      apiKeyOk: false,
      languages: [],
      sourceLanguage: "",
      targetLanguage: "",
      sourceText: "",
      translation: "",
      altTranslations: [],
    };
  },
  methods: {
    checkApiKey(anyApiKey) {
      if (anyApiKey && anyApiKey.length == 36) {
        this.apiKey = anyApiKey;
        this.apiKeyOk = true;
        // console.debug("API-Key is okay: ", this.apiKey);
        return true;
      }
      return false;
    },
    saveApiKey() {
      this.resetAlert();
      if (!this.apiKey) {
        this.appendAlert("Du hast keinen API-Key eingegeben", "warning");
        return;
      }
      if (this.checkApiKey(this.apiKey)) {
        localStorage.setItem("mmtApiKey", this.apiKey);
        // Get Languages
        this.getLanguages();
      } else {
        this.appendAlert("Dieser API-Key ist ungültig", "warning");
        return;
      }
    },
    invalidateApiKey() {
      this.resetAlert();
      this.apiKey = "";
      this.apiKeyOk = false;
      localStorage.removeItem("mmtApiKey");
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

      if (!this.sourceText) {
        this.appendAlert("Du hast keinen Text eingegeben.", "danger");
        return;
      }

      let params = new URLSearchParams({
        source: this.sourceLanguage, // automatic detection when empty
        target: this.targetLanguage,
        q: this.sourceText,
        alt_translations: 3,
      });
      let requestUrl = mmt.url + "/translate?" + params.toString();

      fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "MMT-ApiKey": this.apiKey,
          "MMT-Platform": "ONTRAM",
          "MMT-PlatformVersion": "6.1",
          "MMT-PluginVersion": "0.1",
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
