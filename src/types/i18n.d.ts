declare module '../i18n' {
  export function getTranslation(language: string): (key: string, defaultValue?: string) => string;
}
