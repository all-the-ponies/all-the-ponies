# Translating

Translations are done using [Weblate](https://hosted.weblate.org/engage/all-the-ponies/), which makes it easy to translate, so if your language is not fully translated, then I would appreciate your help.

[![Translation status](https://hosted.weblate.org/widget/all-the-ponies/multi-auto.svg)](https://hosted.weblate.org/engage/all-the-ponies/)

You can find the Weblate project here: https://hosted.weblate.org/engage/all-the-ponies/

# Technical Instructions

> [!NOTE]
> Everything below is for manually editing the translation files. You can ignore all of this if you're using weblate, which makes it much easier to translate.

If you want to edit the translation files directly and create a pull request, keep reading.

## Getting Started

- All translation files can be found in the [`src/locales`](https://github.com/all-the-ponies/all-the-ponies/tree/dev/src/locales) directory.
- Please use the files in the [dev branch](https://github.com/all-the-ponies/all-the-ponies/tree/dev/), as that may contain stuff not in production yet.
- All the source text can be found in `en.json`, so use that as a reference.
- An empty string (`""`) in a file indicates it has not been translated.
- This project uses the [Vue i18n format](https://vue-i18n.intlify.dev/guide/essentials/syntax.html), so please preserve any special syntax.
- Translators will be notified in the [discord server]([Discord server](https://discord.gg/7cyj3TDufD) whenever there's new or modified text so translations can stay up to date.

## Basic rundown of the vue i18n syntax

While you can find everything about the syntax in the [Vue i18n docs](https://vue-i18n.intlify.dev/guide/essentials/syntax.html), here is a basic rundown of key things to look out for.

- **Named Interpolation:** Text inside curly braces (e.g. `{name}`) is a variable. Translate the text around it, but **do not** translate the word inside the braces.
- **Pluralization**: The pipe symbol (`|`) separates singular and plural forms.
  - Example: `pony | ponies` or `0 apples | 1 apple | {count} apples`
- **Linked Messages:** Any string containing `@:message.key` is linking to another translation. **Leave these as they are.**

## Language code reference

Since I don't expect everyone to know what language code their language is, here's a table to allow you to find your language file.

| Code  | Language             |
|-------|----------------------|
| en    | English              |
| ar    | Arabic               |
| zh    | Chinese              |
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

1. **Pull Request (preferred):** Submit a pull request on this repository with the modified `.json` file, preferably to the dev branch.
2. **Discord:** If you cannot submit a PR, then you are free to send the file in the [Discord server](https://discord.gg/7cyj3TDufD).
  > [!IMPORTANT]
  > Only submit the full JSON file, snippets or a single line will not be accepted.
