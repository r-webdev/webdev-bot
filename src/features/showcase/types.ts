export type ShowcaseCreateLog = {
  userId: string;
  userTag: string;
  projectName: string;
  threadUrl: string;
  attachmentsCount?: number;
  tagIds?: string[];
};

export type ShowcaseEditChangeField = 'title' | 'link' | 'description' | 'tags' | 'attachments';

export type ShowcaseEditChange = {
  field: ShowcaseEditChangeField;
  before: string;
  after: string;
};

export type ShowcaseEditLog = {
  editorId: string;
  editorTag: string;
  threadUrl: string;
  changes: ShowcaseEditChange[];
};
