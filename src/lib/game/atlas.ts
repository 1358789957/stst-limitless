import { publicUrl } from "./asset-url.ts";

export type Atlas = {
  hero: HTMLImageElement[];
  heroWalk: HTMLImageElement[];
  sukuna: HTMLImageElement[];
  sukunaWalk: HTMLImageElement[];
  fly: HTMLImageElement[];
  mouth: HTMLImageElement[];
  blood: HTMLImageElement[];
  disaster: HTMLImageElement[];
  orb: HTMLImageElement[];
  slash: HTMLImageElement[];
  gore: HTMLImageElement[];
  floor: HTMLImageElement;
};

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function frames(folder: string, prefix = "idle") {
  return Promise.all(
    [1, 2, 3, 4].map((i) => loadImg(publicUrl(`sprites/${folder}/${prefix}-${i}.png`))),
  );
}

export async function loadAtlas(): Promise<Atlas> {
  const [hero, heroWalk, sukuna, sukunaWalk, fly, mouth, blood, disaster, orb, slash, gore, floor] =
    await Promise.all([
      frames("hero"),
      frames("hero", "walk"),
      frames("sukuna"),
      frames("sukuna", "walk"),
      frames("fly"),
      frames("mouth"),
      frames("blood"),
      frames("disaster"),
      frames("orb"),
      frames("slash"),
      frames("gore"),
      loadImg(publicUrl("sprites/floor.jpg")),
    ]);
  return {
    hero,
    heroWalk,
    sukuna,
    sukunaWalk,
    fly,
    mouth,
    blood,
    disaster,
    orb,
    slash,
    gore,
    floor,
  };
}
