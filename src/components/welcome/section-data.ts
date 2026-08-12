export type Section = {
  id: string
  text: string
  size: 'sm' | 'md' | 'xl'
  special?: boolean
  italic?: boolean
  typeSpeed: number
}

export const LETTER_SECTIONS: Section[] = [
  {
    id: 'intro',
    text: 'created with love by sam',
    size: 'sm',
    typeSpeed: 0,
  },
  {
    id: 'hello',
    text: 'hello baby!',
    size: 'xl',
    special: true,
    typeSpeed: 110,
  },
  {
    id: 'p1',
    text: "it's so nice that you are my first client like outside school stuff. i loved building this app for you because you were with me the whole way and i loved the fact that i am doing something that is helpful for you.",
    size: 'md',
    typeSpeed: 28,
  },
  {
    id: 'p2',
    text: "i love that for every tiny thing i add in this app, you were in my mind. my thought was ava first like if i put this design, would you like it? was this intuitive enough that it would be easy for you to use?",
    size: 'md',
    typeSpeed: 28,
  },
  {
    id: 'p3',
    text: "i love that na-incorporate ko ang pagiging jowa mo at pagiging software developer at the same time.",
    size: 'md',
    typeSpeed: 32,
  },
  {
    id: 'p4',
    text: "i hope this app helps you save money, be wise with it, and enjoy it!",
    size: 'md',
    typeSpeed: 42,
  },
  {
    id: 'p5',
    text: "i hope that you enjoy using this app as much as i enjoyed building it.",
    size: 'md',
    typeSpeed: 42,
  },
  {
    id: 'love',
    text: "i love you baby",
    size: 'xl',
    special: true,
    typeSpeed: 140,
  },
  {
    id: 'ps',
    text: "ps: for bugs and errors and ui fixes, please just tell me my love and i'll fix it agad hehe",
    size: 'sm',
    italic: true,
    typeSpeed: 30,
  },
  {
    id: 'signature',
    text: "with all the love in the world,\n\nsam",
    size: 'md',
    typeSpeed: 65,
  },
]

export const TOTAL_SCREENS = LETTER_SECTIONS.length + 1
export const SECTION_HEIGHT_VH = 80
