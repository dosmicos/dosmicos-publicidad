export interface ContentBrief {
  slug: string;
  number: number;
  product: 'Ruana' | 'Sleeping' | 'Parka / Chaqueta';
  title: string;
  idea: string;
  onScreenText: string;
  script: string;
  hooks: string[];
  shots: string[];
  caption?: string;
}

export const contentBriefs: ContentBrief[] = [
  {
    slug: 'ruana-facil-de-poner',
    number: 1,
    product: 'Ruana',
    title: 'Ruana fácil de poner',
    idea: 'Mostrar que la ruana es práctica para el día a día y más fácil de poner que una chaqueta cuando hay afán.',
    onScreenText: 'La prenda que le pongo en 3 segundos cuando hace frío',
    script:
      'Cuando hace frío y estamos de afán, esta ruana me salva. Se la pongo rapidísimo, queda como una cobijita puesta y él/ella queda cómodo/a para estar en la casa, salir al carro o ir a donde los abuelos. Además, el diseño es demasiado tierno.',
    hooks: [
      'Si tu hijo pelea con las chaquetas, mira esto.',
      'Esto es lo que le pongo cuando hace frío pero no quiero complicarme.',
      'Es como una cobijita, pero se queda puesta.',
    ],
    shots: [
      'Cómo se la pones.',
      'Cómo queda puesta.',
      'El diseño / animalito.',
      'Cuándo la usan: casa, carro, paseo, jardín o donde los abuelos.',
    ],
  },
  {
    slug: 'ruana-regalo-util',
    number: 3,
    product: 'Ruana',
    title: 'Ruana como regalo útil',
    idea: 'Mostrar la ruana como un regalo bonito, práctico y que sí se usa.',
    onScreenText: 'Un regalo para bebé que sí usan',
    script:
      'Si estás buscando un regalo bonito pero útil para un bebé o un niño, esta ruana me parece una súper opción. Es suave, se ve hermosa, sirve para días fríos y no es un regalo que queda guardado. Yo la usaría para casa, paseos, carro o cuando hace frío en la mañana.',
    hooks: [
      'Idea de regalo útil para bebé.',
      'Esto sí lo usaría una mamá.',
      'Regalo bonito, pero también práctico.',
    ],
    shots: [
      'La ruana doblada o empacada.',
      'Textura / diseño.',
      'Cómo queda puesta.',
      'Una escena de uso real.',
    ],
    caption:
      'Regalo útil para bebé o niño 💛 una ruana suave, práctica y tierna para el frío. #regalobebe #babyshower #ruanainfantil #dosmicos',
  },
  {
    slug: 'sleeping-bebe-se-destapa',
    number: 4,
    product: 'Sleeping',
    title: 'Sleeping para bebé que se destapa',
    idea: 'Mostrar el sleeping como una alternativa práctica para mantener al bebé abrigadito sin depender de cobijas sueltas.',
    onScreenText: '¿Tu bebé se destapa en la noche?',
    script:
      'Mi bebé se destapaba mucho en la noche y yo estaba pendiente de si seguía abrigado/a. Este sleeping me gusta porque queda cómodo, lo mantiene abrigadito y reduce depender de cobijas sueltas. Lo usamos en la rutina de noche y me parece súper práctico.',
    hooks: [
      'Si tu bebé se destapa mientras duerme, mira esto.',
      'Esto usamos en las noches frías.',
      'Una forma práctica de dormir abrigadito.',
    ],
    shots: [
      'Rutina de noche.',
      'El sleeping puesto.',
      'Cierre / fit.',
      'Cómo se mueve el bebé.',
      'Textura de cerca.',
    ],
  },
  {
    slug: 'parka-chaqueta-clima-frio',
    number: 7,
    product: 'Parka / Chaqueta',
    title: 'Parka o chaqueta para clima frío',
    idea: 'Mostrar que la parka/chaqueta no es solo linda, sino funcional para frío, viento, lluvia o viajes a tierra fría.',
    onScreenText: 'No es solo linda: es para frío de verdad',
    script:
      'Cuando hace frío de verdad, no me sirve cualquier saquito. Esta parka/chaqueta me gusta porque abriga, se ve linda y es práctica para salir, viajar o estar en clima frío. Me gusta que no se ve incómoda ni pesada, pero sí se siente más protegida para el frío.',
    hooks: [
      'Para tierra fría, esta chaqueta me parece perfecta.',
      'La chaqueta que sí abriga y se ve hermosa.',
      'Si vas de viaje a clima frío con niños, mira esto.',
    ],
    shots: [
      'Clima frío, salida o paseo.',
      'Cómo se ve puesta.',
      'Cierre / capota / textura.',
      'Movimiento del niño/a.',
      'Detalles de abrigo.',
    ],
  },
];

export const getContentBriefBySlug = (slug?: string) =>
  contentBriefs.find((brief) => brief.slug === slug);
