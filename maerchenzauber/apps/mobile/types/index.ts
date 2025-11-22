export interface Story {
    id: string;
    title: string;
    coverImage: string;
    scenes: Scene[];
  }
  
  export interface Scene {
    image: { uri: string };
    text: string;
  }