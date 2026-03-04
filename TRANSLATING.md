# Translating

Any translators are welcome, as long as you know the language, **Google Translate is not allowed**. While there are some things I have been able to pull from the game already, there is a lot more text that I can't, and your help is very much appreciated.

## Getting Started

- All translation files can be found in the `src/locales` directory.
- All the source text can be found in `en.json`, so use that as a reference.
- An empty string (`""`) in a file indicates it has not been translated.
- This project uses the [Vue i18n format](https://vue-i18n.intlify.dev/guide/essentials/syntax.html), so please preserve any special syntax.

## Basic rundown of the vue i18n syntax

While you can find everything about the syntax in the [Vue i18n docs](https://vue-i18n.intlify.dev/guide/essentials/syntax.html), here is a basic rundown of key things to look out for.

- **Named Interpolation:** Text inside curly braces (e.g. {name}) is a variable. Translate the text around it, but **do not** translate the word inside the braces.
- **Pluralization**: The pipe symbol (`|`) separates singular and plural forms.
  - Example: `0 apples | 1 apple | {count} apples`
- **Linked Messages:** Any string containing `@:message.key` is linking to another translation. **Leave these as they are.**

## Language code reference

Since I don't expect everyone to know what language code their language is, here's a table to allow you to find your language file.

| Code  | Language             |
|-------|----------------------|
| en    | English              |
| ar    | Arabic               |
| zh-CH | Chinese (Simplified) |
| fr    | French               |
| de    | German               |
| it    | Italian              |
| ja    | Japanese             |
| ko    | Korean               |
| pt-BR | Portuguese (Brazil)  |
| ru    | Russian              |
| es    | Spanish              |
| th    | Thai                 |
| tr    | Turkish              |


## Submitting translations

There are two ways to contribute

1. **Pull Request (preferred):** Submit a pull request on this repository with the modified `.json` file.
2. **Discord:** If you cannot submit a PR, then you are free to send the file in the [Discord server](https://discord.gg/7cyj3TDufD).
  > [!IMPORTANT]
  > Only submit the full JSON file, snippets or a single line will not be accepted.
