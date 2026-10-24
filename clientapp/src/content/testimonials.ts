/** Client reviews shown in the home page Testimonials slider, in order. */
export interface Testimonial {
  quote: string
  /** First name; leave out to show only the session type */
  name?: string
  session: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Aspen is so wonderful at what she does!! She made our experience everything and more than we wanted it to be! The photos came out AMAZING! She is very helpful when it comes to advice on anything you want your photos to be like. I would 100% recommend Aspen for any special memories you want to capture.',
    name: 'Abbey',
    session: 'Engagement',
  },
  {
    quote: 'Wonderful experience! Aspen takes your ideas and turns it into a creative experience. She’s wonderful at what she does and keeps your options open. Loved my experience!!',
    name: 'Brianna',
    session: 'Couples',
  },
  {
    quote: 'She is incredibly talented and truly has an eye for photography. Her photos are beautiful, natural, and capture the personality and special moments of the people she photographs. You can see the time, care, and attention she puts into her work, and it shows in every photo.',
    name: 'Kim',
    session: 'Family',
  },
]
