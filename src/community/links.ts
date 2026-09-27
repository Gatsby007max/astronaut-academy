const repository = (import.meta.env.VITE_REPO_URL?.trim() || 'https://github.com/Gatsby007max/astronaut-academy').replace(/\/$/, '')
const support = import.meta.env.VITE_KOFI_URL?.trim()

export const communityLinks = {
  discussions: repository ? `${repository}/discussions` : undefined,
  playFeedback: repository ? `${repository}/discussions/categories/play-feedback-%E3%83%97%E3%83%AC%E3%82%A4%E6%84%9F%E6%83%B3` : undefined,
  contentSources: repository ? `${repository}/discussions/categories/content-sources-%E6%95%99%E6%9D%90-%E5%87%BA%E5%85%B8` : undefined,
  ideas: repository ? `${repository}/discussions/categories/ideas-%E3%82%A2%E3%82%A4%E3%83%87%E3%82%A2` : undefined,
  translations: repository ? `${repository}/discussions/categories/translation-%E7%BF%BB%E8%A8%B3` : undefined,
  issues: repository ? `${repository}/issues/new/choose` : undefined,
  pulls: repository ? `${repository}/pulls` : undefined,
  repository,
  support: support && /^https:\/\/ko-fi\.com\/[a-z0-9_-]+\/?$/i.test(support) ? support : undefined,
}
