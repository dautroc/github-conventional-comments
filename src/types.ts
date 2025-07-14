export interface CommentType {
  label: string;
  description: string;
  decorations: Decorator[];
}

export interface Decoration {
  label: Decorator;
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

export enum Decorator {
  NONE = "none",
  BLOCKING = "(blocking)",
  NON_BLOCKING = "(non-blocking)",
  IF_MINOR = "(if-minor)",
}
