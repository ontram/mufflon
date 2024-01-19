# Das Mufflon

Prototypische Anwendung zum Testen der maschinellen Übersetzung verschiedener Anbieter.

![Alt text](/screenshots/mufflonapp01.png?raw=true "Screenshot der mufflonapp v1")

## Was tut es

Es nutzt die API von ModernMT (https://modernmt.com/) oder DeepL (https://deepl.com), um Texte in viele Sprachen zu übersetzen. Es werden sofern möglich Alternativen angezeigt.

Du benötigst einen API-Key von ModernMT oder DeepL.

## Tech Stack

- CSS: Bootstrap 5 | https://getbootstrap.com/
- JavaScript: Vue.js 3 | https://vuejs.org/
- Diff Implementation: jsdiff | https://github.com/kpdecker/jsdiff
- Für den Proxy auf Serverseite: node.js

## Versionen

- Version 0.1: Ausschließlich ModernMT. Es werden immer 3 Alternativen angezeigt.
- Version 0.2: DeepL wurde hinzugefügt. Alternativen mit formality=less|more werden angezeigt.
