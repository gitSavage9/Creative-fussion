export enum InputMode {
    IMAGE = 'image',
    TEXT = 'text',
}

export interface ImageFile {
    file: File;
    base64: string;
    previewUrl: string;
}

export enum AppMode {
    LOGO = 'logo',
    EDIT = 'edit',
    ANIMATE = 'animate',
    CHAT = 'chat',
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}
