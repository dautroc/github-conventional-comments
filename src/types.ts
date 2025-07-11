export interface CommentType {
  label: string;
  description: string;
  decorations?: string[];
}

export interface Decoration {
  label: string;
  description: string;
}

export interface EditorState {
  text: string;
  cursorPosition: number;
}

export enum Stage {
  INACTIVE = 0,
  SELECTING_LABEL = 1,
  SELECTING_DECORATION = 2,
  BUTTON_UI,
}
