const SEARCH_TERM = '%SEARCH%';
const TERM = '%TERM%';

export type DocProvider = 'mdn' | 'npm';

export type DocProviders = Record<
  DocProvider,
  {
    search: string;
    color: number;
    createTitle: (term: string) => string;
    icon: string;
    help: string;
    direct?: string;
    getExtendedInfoUrl?: (term: string) => string | undefined;
  }
>;

export const docProviders: DocProviders = {
  mdn: {
    color: 0x83_d0_f2,
    createTitle: (searchTerm: string) => `MDN results for *${searchTerm}*`,
    direct: `https://developer.mozilla.org${TERM}`,
    help: '!mdn localStorage',
    icon: 'https://avatars0.githubusercontent.com/u/7565578',
    search: `https://developer.mozilla.org/api/v1/search?q=${SEARCH_TERM}&locale=en-US`,
  },
  npm: {
    color: 0xfb_3e_44,
    createTitle: (searchTerm: string) => `NPM results for *${searchTerm}*`,
    help: '!npm react',
    icon: 'https://avatars0.githubusercontent.com/u/6078720',
    search: `https://registry.npmjs.org/-/v1/search?q=${SEARCH_TERM}&size=10`,
  },
};

export const getSearchUrl = (provider: DocProvider, search: string) =>
  docProviders[provider].search.replace(SEARCH_TERM, encodeURIComponent(search));

export const getDirectUrl = (provider: DocProvider, term: string) => {
  const direct = docProviders[provider].direct;
  if (!direct) return undefined;
  return direct.replace(TERM, term);
};
