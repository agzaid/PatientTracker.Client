const LANGUAGE_SESSION_KEY = 'preferred_language';

export const languageApi = {
  // Get language from session storage
  getStoredLanguage(): string | null {
    return sessionStorage.getItem(LANGUAGE_SESSION_KEY);
  },

  // Set language in session storage
  setLanguageSession(language: string): void {
    sessionStorage.setItem(LANGUAGE_SESSION_KEY, language);
  },

  // Update language preference (now just stores locally)
  async updateLanguagePreference(language: string): Promise<void> {
    // No backend call needed - just store in session
    this.setLanguageSession(language);
    
    // You might want to trigger a UI refresh here
    // or reload the page to apply the new language
    window.location.reload();
  }
};
