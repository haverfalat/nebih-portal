export interface Link {
  title: string;
  url: string;
  external: boolean;
}

export interface Image {
  url: string;
  alt: string;
  title: string | null;
}

export interface DocumentLink extends Link {
  extension: string | null;
}

export interface NavigationItem extends Link {
  children: NavigationItem[];
}

export interface Download {
  url: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}
