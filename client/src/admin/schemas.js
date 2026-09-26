import { HERO_EFFECTS } from '../pages/home/Hero';
import { gradeScale } from '../lib/results';

/**
 * CMS editor definitions. Each content key maps to sections; each section edits
 * one sub-object with SchemaForm fields. Text fields accept the {school} token.
 */

const heading = (extra = []) => [
  { key: 'enabled', type: 'switch', label: 'Show this section', col: 'col-12' },
  { key: 'eyebrow', label: 'Small label above title', col: 'col-md-4' },
  { key: 'title', label: 'Title', col: 'col-md-8' },
  { key: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 2 },
  ...extra,
];

const iconItem = (extra = []) => ({
  type: 'list',
  singular: 'item',
  plural: 'items',
  newItem: { icon: 'star', title: 'New item', text: '' },
  fields: [
    { key: 'icon', type: 'icon', label: 'Icon', col: 'col-md-4' },
    { key: 'title', label: 'Title', col: 'col-md-8' },
    { key: 'text', label: 'Description', type: 'textarea', rows: 2 },
    ...extra,
  ],
});

export const CONTENT_SCHEMAS = {
  home: {
    title: 'Home Page',
    description: 'Every section of the homepage, in the order they appear, from the slider to the call to action. Use {school} to insert the school name.',
    preview: '/',
    sections: [
      {
        key: 'hero', title: 'Hero Slider', icon: 'images',
        fields: [
          { key: 'autoplay', type: 'switch', label: 'Auto-play slides', col: 'col-md-6' },
          { key: 'interval', type: 'number', label: 'Seconds per slide', col: 'col-md-3' },
          {
            key: 'transition', type: 'select', label: 'Slide transition', col: 'col-md-3', empty: false,
            options: [{ value: 'mix', label: 'Mixed (new style each time)' }, ...HERO_EFFECTS],
          },
          {
            key: 'slides', type: 'list', label: 'Slides', singular: 'slide', plural: 'slides',
            newItem: { image: '', eyebrow: 'Welcome to {school}', title: 'New slide', subtitle: '', ctaText: 'Learn more', ctaLink: '/about' },
            fields: [
              { key: 'image', type: 'image', label: 'Background image (landscape, 1920×1080 recommended)', col: 'col-md-5' },
              { key: '_', type: 'heading', label: 'Text', col: 'col-md-7' },
              { key: 'eyebrow', label: 'Small label', col: 'col-md-7' },
              { key: 'title', label: 'Headline', col: 'col-md-7' },
              { key: 'subtitle', label: 'Supporting text', type: 'textarea', rows: 2 },
              { key: 'ctaText', label: 'Button 1 text', col: 'col-md-3' },
              { key: 'ctaLink', label: 'Button 1 link', col: 'col-md-3', placeholder: '/about' },
              { key: 'cta2Text', label: 'Button 2 text', col: 'col-md-3' },
              { key: 'cta2Link', label: 'Button 2 link', col: 'col-md-3' },
            ],
          },
        ],
      },
      {
        key: 'stats', title: 'Statistics Counters', icon: 'bar-chart',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show statistics' },
          {
            key: 'items', type: 'list', label: 'Counters', singular: 'counter', plural: 'counters', max: 6,
            itemLabel: (s) => `${s.value ?? ''}${s.suffix ?? ''} ${s.label ?? ''}`,
            newItem: { icon: 'people', value: 100, suffix: '+', label: 'Label' },
            fields: [
              { key: 'icon', type: 'icon', label: 'Icon', col: 'col-md-3' },
              { key: 'value', type: 'number', label: 'Number', col: 'col-md-3' },
              { key: 'suffix', label: 'Suffix (+, %)', col: 'col-md-2' },
              { key: 'label', label: 'Label', col: 'col-md-4' },
            ],
          },
        ],
      },
      {
        key: 'features', title: 'Why Choose Us', icon: 'patch-check', help: 'Shown right below the slider, with two photos and up to four reasons.',
        fields: heading([
          { key: 'image', type: 'image', label: 'Main photo (portrait)', col: 'col-md-6', aspect: 'aspect-[4/5]' },
          { key: 'image2', type: 'image', label: 'Small overlapping photo (landscape)', col: 'col-md-6' },
          { key: 'buttonText', label: 'Button text', col: 'col-md-6' },
          { key: 'buttonLink', label: 'Button link', col: 'col-md-6' },
          { key: 'items', label: 'Reasons', ...iconItem(), singular: 'reason', max: 4 },
        ]),
      },
      {
        key: 'welcome', title: 'Principal’s Welcome', icon: 'chat-quote',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show this section' },
          { key: 'image', type: 'image', label: 'Principal photo (portrait)', col: 'col-md-4', aspect: 'aspect-[4/5]' },
          { key: '_', type: 'heading', label: 'Message', col: 'col-md-8' },
          { key: 'eyebrow', label: 'Small label', col: 'col-md-4' },
          { key: 'title', label: 'Title', col: 'col-md-8' },
          { key: 'body', label: 'Message (blank line = new paragraph)', type: 'textarea', rows: 8 },
          { key: 'name', label: 'Principal name', col: 'col-md-6' },
          { key: 'role', label: 'Title / role', col: 'col-md-6' },
          { key: 'buttonText', label: 'Button text', col: 'col-md-6' },
          { key: 'buttonLink', label: 'Button link', col: 'col-md-6' },
        ],
      },
      {
        key: 'journey', title: 'Learner Journey Timeline', icon: 'signpost-split', help: 'Uses the same timeline style as the history on the About page.',
        fields: heading([
          { key: 'buttonText', label: 'Button text', col: 'col-md-6' },
          { key: 'buttonLink', label: 'Button link', col: 'col-md-6' },
          {
            key: 'items', type: 'list', label: 'Stages', singular: 'stage', plural: 'stages',
            itemLabel: (h) => `${h.year ?? ''} — ${h.title ?? ''}`,
            newItem: { year: 'Stage', icon: 'star', title: 'New stage', text: '' },
            fields: [
              { key: 'year', label: 'Label (e.g. Form 1)', col: 'col-md-4' },
              { key: 'icon', type: 'icon', label: 'Icon', col: 'col-md-3' },
              { key: 'title', label: 'Title', col: 'col-md-5' },
              { key: 'text', label: 'Description', type: 'textarea', rows: 2 },
            ],
          },
        ]),
      },
      { key: 'prefects', title: 'Student Leaders', icon: 'stars', help: 'Shows the top prefect level (e.g. head boy and head girl).', fields: heading() },
      { key: 'gallery', title: 'Gallery Preview', icon: 'images', fields: heading() },
      {
        key: 'testimonials', title: 'Testimonials', icon: 'chat-heart',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show this section' },
          { key: 'eyebrow', label: 'Small label', col: 'col-md-4' },
          { key: 'title', label: 'Title', col: 'col-md-8' },
          {
            key: 'items', type: 'list', label: 'Testimonials', singular: 'testimonial', plural: 'testimonials',
            itemLabel: (t) => t.name, newItem: { name: '', role: '', quote: '', photo: '' },
            fields: [
              { key: 'photo', type: 'image', label: 'Photo', col: 'col-md-3', round: true },
              { key: 'name', label: 'Name', col: 'col-md-5' },
              { key: 'role', label: 'Role (Parent, Alumnus…)', col: 'col-md-4' },
              { key: 'quote', label: 'Quote', type: 'textarea', rows: 3 },
            ],
          },
        ],
      },
      { key: 'news', title: 'Latest News', icon: 'newspaper', fields: heading() },
      { key: 'events', title: 'Upcoming Events', icon: 'calendar-event', help: 'Lists published events with a future date.', fields: heading() },
      {
        key: 'cta', title: 'Call to Action Banner', icon: 'megaphone',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show this section' },
          { key: 'title', label: 'Title' },
          { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
          { key: 'buttonText', label: 'Button text', col: 'col-md-6' },
          { key: 'buttonLink', label: 'Button link', col: 'col-md-6' },
          { key: 'image', type: 'image', label: 'Background image', col: 'col-md-6' },
        ],
      },
    ],
  },

  about: {
    title: 'About Page',
    description: 'Your school’s story, identity, values, history, facilities, prayer, anthem and contact section.',
    preview: '/about',
    sections: [
      {
        key: 'intro', title: 'Our Story', icon: 'book',
        fields: [
          { key: 'eyebrow', label: 'Small label', col: 'col-md-4' },
          { key: 'title', label: 'Title', col: 'col-md-8' },
          { key: 'body', label: 'Story (blank line = new paragraph)', type: 'textarea', rows: 8 },
          { key: 'image', type: 'image', label: 'Main image (portrait)', col: 'col-md-4', aspect: 'aspect-[4/5]' },
          { key: 'image2', type: 'image', label: 'Secondary image', col: 'col-md-4', aspect: 'aspect-[4/3]' },
          { key: '_', type: 'heading', label: 'Floating badge', col: 'col-md-4' },
          { key: 'badgeValue', label: 'Badge value', col: 'col-md-2', placeholder: '25+' },
          { key: 'badgeLabel', label: 'Badge label', col: 'col-md-2' },
        ],
      },
      ...['mission', 'vision', 'motto'].map((k) => ({
        key: k, title: k === 'motto' ? 'Motto (leave text empty to use the site motto)' : `${k[0].toUpperCase()}${k.slice(1)}`, icon: k === 'mission' ? 'bullseye' : k === 'vision' ? 'eye' : 'stars',
        fields: [
          { key: 'icon', type: 'icon', label: 'Icon', col: 'col-md-4' },
          { key: 'title', label: 'Title', col: 'col-md-8' },
          { key: 'text', label: 'Statement', type: 'textarea', rows: 3 },
        ],
      })),
      { key: 'values', title: 'Core Values', icon: 'gem', fields: [{ key: 'enabled', type: 'switch', label: 'Show this section' }, { key: 'eyebrow', label: 'Small label', col: 'col-md-4' }, { key: 'title', label: 'Title', col: 'col-md-8' }, { key: 'items', label: 'Values', ...iconItem(), singular: 'value' }] },
      {
        key: 'history', title: 'History Timeline', icon: 'clock-history',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show this section' },
          { key: 'eyebrow', label: 'Small label', col: 'col-md-4' },
          { key: 'title', label: 'Title', col: 'col-md-8' },
          {
            key: 'items', type: 'list', label: 'Milestones', singular: 'milestone', plural: 'milestones',
            itemLabel: (m) => `${m.year} — ${m.title}`, newItem: { year: String(new Date().getFullYear()), title: '', text: '' },
            fields: [
              { key: 'year', label: 'Year', col: 'col-md-3' },
              { key: 'title', label: 'Title', col: 'col-md-9' },
              { key: 'text', label: 'Description', type: 'textarea', rows: 2 },
            ],
          },
        ],
      },
      { key: 'facilities', title: 'Facilities', icon: 'buildings', fields: [{ key: 'enabled', type: 'switch', label: 'Show this section' }, { key: 'eyebrow', label: 'Small label', col: 'col-md-4' }, { key: 'title', label: 'Title', col: 'col-md-8' }, { key: 'items', label: 'Facilities', ...iconItem([{ key: 'image', type: 'image', label: 'Photo', col: 'col-md-6' }]), singular: 'facility' }] },
      { key: 'prayer', title: 'School Prayer', icon: 'book-half', fields: [{ key: 'enabled', type: 'switch', label: 'Show the school prayer' }, { key: 'title', label: 'Title' }, { key: 'text', label: 'Prayer (each line on its own line)', type: 'textarea', rows: 7 }] },
      { key: 'anthem', title: 'School Anthem', icon: 'music-note-beamed', fields: [{ key: 'enabled', type: 'switch', label: 'Show the school anthem' }, { key: 'title', label: 'Title' }, { key: 'text', label: 'Lyrics (each line on its own line)', type: 'textarea', rows: 8 }] },
      { key: 'contact', title: 'Contact Section', icon: 'geo-alt', help: 'Contact details and the map are edited under Branding & Settings.', fields: [{ key: 'enabled', type: 'switch', label: 'Show this section' }, { key: 'eyebrow', label: 'Small label', col: 'col-md-4' }, { key: 'title', label: 'Title', col: 'col-md-8' }] },
    ],
  },

  pages: {
    title: 'Page Banners & Menu',
    description: 'The banner (hero) at the top of every page: images, title and subtitle. Add several images to a banner and they rotate, one zooming in and the next zooming out. You can also rename pages and choose what appears in the menu.',
    sections: [
      ...[
        ['home', 'Home', 'house-door', false],
        ['about', 'About', 'info-circle', true],
        ['departments', 'Departments', 'building', true],
        ['structure', 'School Structure / Hierarchy', 'diagram-3', true],
        ['staff', 'Staff', 'person-badge', true],
        ['prefects', 'Prefects', 'stars', true],
        ['gallery', 'Gallery', 'images', true],
        ['news', 'News & Events', 'newspaper', true],
        ['results', 'Exam Results', 'award', true],
        ['fees', 'Fee Structure', 'cash-coin', true],
        ['tenders', 'Tenders', 'file-earmark-text', true],
      ].map(([key, title, icon, banner]) => ({
        key, title, icon,
        fields: [
          ...(key === 'tenders' ? [{ key: 'note', label: 'How to submit bids (shown on the Tenders page)', type: 'textarea', rows: 2 }] : []),
          { key: 'label', label: 'Menu label', col: 'col-md-6' },
          { key: 'showInNav', type: 'switch', label: 'Show in menu', col: 'col-md-6' },
          ...(banner ? [
            { key: 'title', label: 'Banner title', col: 'col-md-6' },
            { key: 'subtitle', label: 'Banner subtitle', col: 'col-md-6' },
            { key: 'image', type: 'image', label: 'Main banner image', col: 'col-md-4' },
            { key: 'images', type: 'images', label: 'More banner images (optional, they rotate)', col: 'col-md-8', help: 'Leave empty to show only the main image.' },
          ] : [{ key: '_', type: 'heading', label: 'The home page slider images are edited under Home Page → Hero Slider.', col: 'col-12' }]),
        ],
      })),
      {
        key: 'portal', title: 'Portal (login page)', icon: 'shield-lock',
        fields: [
          { key: 'label', label: 'Button label', col: 'col-md-6' },
          { key: 'showInNav', type: 'switch', label: 'Show portal button in menu', col: 'col-md-6' },
          { key: 'title', label: 'Heading', col: 'col-md-6' },
          { key: 'subtitle', label: 'Sub-heading', col: 'col-md-6' },
          { key: 'note', label: 'Note below the form', type: 'textarea', rows: 2 },
          { key: 'image', type: 'image', label: 'Side image', col: 'col-md-6', aspect: 'aspect-[3/4]' },
        ],
      },
    ],
  },

  results: {
    title: 'Exam Results',
    description: 'National exam results by year: mean score, positions and top candidates. The newest year goes first and is highlighted on the home page. Use {exam} to insert the exam name.',
    preview: '/results',
    sections: [
      {
        key: 'intro', title: 'Exam Name & Home Highlight', icon: 'award',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show the latest results on the home page', col: 'col-12' },
          { key: 'examName', label: 'Exam name (e.g. KCSE, KJSEA, KPSEA)', col: 'col-md-4' },
          { key: 'gradeScale', label: 'Grades, best first, separated by commas', col: 'col-12', help: 'Used for the grade distribution of each year. KCSE: A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E' },
          { key: 'eyebrow', label: 'Small label', col: 'col-md-4' },
          { key: 'title', label: 'Title (the year is added after it)', col: 'col-md-4' },
          { key: 'subtitle', label: 'Text shown when a year has no note', type: 'textarea', rows: 2 },
        ],
      },
      {
        key: 'years', title: 'Results by Year', icon: 'bar-chart-line', help: 'Keep the most recent year at the top. Leave any figure empty to hide it.',
        fields: [{
          key: 'items', type: 'list', label: 'Years', singular: 'year', plural: 'years',
          itemLabel: (y) => `${y.year || 'Year'} — mean ${y.meanScore || '?'} (${y.meanGrade || '?'})`,
          newItem: () => ({ year: String(new Date().getFullYear()), candidates: '', meanScore: '', meanGrade: '', countyPosition: '', subCountyPosition: '', nationalPosition: '', county: '', universityQualifiers: '', note: '', topStudents: [] }),
          fields: [
            { key: 'year', label: 'Year', col: 'col-md-3' },
            { key: 'candidates', type: 'number', label: 'Candidates', col: 'col-md-3' },
            { key: 'meanScore', label: 'Mean score (e.g. 8.12)', col: 'col-md-3' },
            { key: 'meanGrade', label: 'Mean grade (e.g. B-)', col: 'col-md-3' },
            { key: 'county', label: 'County name', col: 'col-md-3' },
            { key: 'countyPosition', label: 'County position', col: 'col-md-3' },
            { key: 'subCountyPosition', label: 'Sub-county position', col: 'col-md-3' },
            { key: 'nationalPosition', label: 'National position', col: 'col-md-3' },
            { key: 'universityQualifiers', type: 'number', label: 'University qualifiers', col: 'col-md-4' },
            { key: 'note', label: 'Short note about this year', type: 'textarea', rows: 2 },
            {
              key: 'grades', type: 'counts', label: 'Grade distribution (number of candidates per grade)', keys: (ctx) => gradeScale(ctx.content?.intro?.gradeScale),
              totalLabel: 'Total candidates entered', help: 'Optional. Shown as a chart and in the results table. Leave empty to hide.',
            },
            {
              key: 'topStudents', type: 'list', label: 'Top candidates (best first)', singular: 'candidate', plural: 'candidates',
              itemLabel: (t) => `${t.name || 'Candidate'} — ${t.grade || ''}`,
              newItem: { name: '', grade: 'A', points: '', note: '', photo: '' },
              fields: [
                { key: 'photo', type: 'image', label: 'Photo (optional)', col: 'col-md-3', round: true },
                { key: 'name', label: 'Name', col: 'col-md-5' },
                { key: 'grade', label: 'Grade', col: 'col-md-2' },
                { key: 'points', label: 'Points', col: 'col-md-2' },
                { key: 'note', label: 'Note (e.g. Top in the county, joining medicine)' },
              ],
            },
          ],
        }],
      },
    ],
  },

  fees: {
    title: 'Fee Structure',
    description: 'Upload photos or scans of the fee structure for each class or term. Parents can view them full screen and download them from the Fees page.',
    preview: '/fees',
    sections: [
      {
        key: 'documents', title: 'Fee Structure Images', icon: 'file-earmark-image',
        fields: [{
          key: 'items', type: 'list', label: 'Fee structures', singular: 'fee structure', plural: 'fee structures',
          itemLabel: (d) => d.title,
          newItem: { title: 'Form 1 – Term 1', note: '', image: '' },
          fields: [
            { key: 'image', type: 'image', label: 'Fee structure image (photo or scan)', col: 'col-md-5', aspect: 'aspect-[3/4]' },
            { key: '_', type: 'heading', label: 'Details', col: 'col-md-7' },
            { key: 'title', label: 'Title (e.g. Form 1 – 2026)', col: 'col-md-7' },
            { key: 'note', label: 'Note (optional)', type: 'textarea', rows: 2, col: 'col-md-7' },
          ],
        }],
      },
      {
        key: 'intro', title: 'Payment Details', icon: 'bank',
        fields: [
          { key: 'eyebrow', label: 'Small label', col: 'col-md-4' },
          { key: 'text', label: 'Payment instructions', type: 'textarea', rows: 2 },
          { key: 'bank', label: 'Bank details', col: 'col-md-6' },
          { key: 'mpesa', label: 'M-Pesa details', col: 'col-md-6' },
          { key: 'contact', label: 'Who to contact for fee queries' },
        ],
      },
    ],
  },

  promo: {
    title: 'Promotions',
    description: 'Advertise admissions, open days or any announcement on the home page: a pop-up when visitors arrive and/or a highlighted banner. Use {nextYear} or {year} to insert the year and {school} for the school name.',
    preview: '/',
    sections: [
      {
        key: 'popup', title: 'Pop-up Promotion', icon: 'window-stack', help: 'Appears a few seconds after a visitor arrives. Visitors can close it.',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show the pop-up', col: 'col-md-6' },
          {
            key: 'where', type: 'select', label: 'Show on', col: 'col-md-3', empty: false,
            options: [{ value: 'home', label: 'Home page only' }, { value: 'all', label: 'Every page' }],
          },
          {
            key: 'frequency', type: 'select', label: 'How often', col: 'col-md-3', empty: false,
            options: [{ value: 'session', label: 'Once per visit' }, { value: 'day', label: 'Once a day' }, { value: 'always', label: 'Every time' }],
          },
          { key: 'image', type: 'image', label: 'Image (optional)', col: 'col-md-5' },
          { key: '_', type: 'heading', label: 'Message', col: 'col-md-7' },
          { key: 'badge', label: 'Badge (e.g. Admissions Open)', col: 'col-md-7' },
          { key: 'title', label: 'Headline', col: 'col-md-7' },
          { key: 'text', label: 'Text', type: 'textarea', rows: 3 },
          { key: 'buttonText', label: 'Button 1 text', col: 'col-md-3' },
          { key: 'buttonLink', label: 'Button 1 link', col: 'col-md-3', placeholder: '/about#contact' },
          { key: 'button2Text', label: 'Button 2 text', col: 'col-md-3' },
          { key: 'button2Link', label: 'Button 2 link', col: 'col-md-3' },
          { key: 'delay', type: 'number', label: 'Show after (seconds)', col: 'col-md-4' },
          { key: 'startDate', type: 'date', label: 'Start showing on (optional)', col: 'col-md-4' },
          { key: 'endDate', type: 'date', label: 'Stop showing after (optional)', col: 'col-md-4' },
        ],
      },
      {
        key: 'banner', title: 'Home Page Banner', icon: 'megaphone', help: 'A highlighted band right below the slider, with an optional countdown to a deadline.',
        fields: [
          { key: 'enabled', type: 'switch', label: 'Show the banner', col: 'col-12' },
          { key: 'image', type: 'image', label: 'Image (optional)', col: 'col-md-5' },
          { key: '_', type: 'heading', label: 'Message', col: 'col-md-7' },
          { key: 'badge', label: 'Badge', col: 'col-md-7' },
          { key: 'title', label: 'Headline', col: 'col-md-7' },
          { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
          { key: 'buttonText', label: 'Button 1 text', col: 'col-md-3' },
          { key: 'buttonLink', label: 'Button 1 link', col: 'col-md-3' },
          { key: 'button2Text', label: 'Button 2 text', col: 'col-md-3' },
          { key: 'button2Link', label: 'Button 2 link', col: 'col-md-3' },
          { key: 'deadline', type: 'date', label: 'Countdown to (optional)', col: 'col-md-4', help: 'e.g. the application deadline' },
          { key: 'deadlineLabel', label: 'Countdown label', col: 'col-md-8' },
          { key: 'startDate', type: 'date', label: 'Start showing on (optional)', col: 'col-md-6' },
          { key: 'endDate', type: 'date', label: 'Stop showing after (optional)', col: 'col-md-6' },
        ],
      },
    ],
  },

  tiers: {
    title: 'Hierarchy Levels',
    description: 'Define the levels used to group staff (from the principal down) and prefects (from the head boy and head girl down). The order here is the order shown on the website.',
    sections: [
      {
        key: 'staff', title: 'Staff Levels', icon: 'person-badge', whole: true,
        fields: [{
          key: 'staff', type: 'list', label: 'Levels (top to bottom)', singular: 'level', plural: 'levels',
          itemLabel: (t) => `${t.label} (${t.key})`, newItem: () => ({ key: `level-${Date.now().toString(36)}`, label: 'New level' }),
          fields: [
            { key: 'label', label: 'Display name', col: 'col-md-7', help: 'e.g. Principal, Deputy Principals, Heads of Department' },
            { key: 'key', label: 'Key (do not change once used)', col: 'col-md-5' },
          ],
        }],
      },
      {
        key: 'prefects', title: 'Prefect Levels', icon: 'stars', whole: true,
        fields: [{
          key: 'prefects', type: 'list', label: 'Levels (top to bottom)', singular: 'level', plural: 'levels',
          itemLabel: (t) => `${t.label} (${t.key})${t.showPhotos ? ' · photos' : ' · names only'}`,
          newItem: () => ({ key: `level-${Date.now().toString(36)}`, label: 'New level', showPhotos: false }),
          fields: [
            { key: 'label', label: 'Display name', col: 'col-md-5' },
            { key: 'key', label: 'Key (do not change once used)', col: 'col-md-4' },
            { key: 'showPhotos', type: 'switch', label: 'Show photos', col: 'col-md-3', help: 'Otherwise names only' },
          ],
        }],
      },
    ],
  },
};

export const SETTINGS_TABS = [
  {
    key: 'identity', title: 'School Identity', icon: 'building',
    fields: [
      { key: 'schoolName', label: 'School name', required: true, col: 'col-md-8' },
      { key: 'shortName', label: 'Short name / initials', col: 'col-md-4' },
      { key: 'motto', label: 'Motto', col: 'col-md-8' },
      { key: 'established', label: 'Year established', col: 'col-md-4' },
      { key: 'logo', type: 'image', label: 'Logo (transparent PNG recommended)', col: 'col-md-6', aspect: 'aspect-[4/3]' },
      { key: 'favicon', type: 'image', label: 'Browser tab icon (optional, square)', col: 'col-md-6', aspect: 'aspect-[4/3]' },
    ],
  },
  {
    key: 'theme', title: 'Theme & Colours', icon: 'palette', nested: 'theme',
    fields: [
      { key: 'primary', type: 'color', label: 'Main colour (buttons, highlights)', col: 'col-md-4' },
      { key: 'accent', type: 'color', label: 'Accent colour (badges, details)', col: 'col-md-4' },
      { key: 'dark', type: 'color', label: 'Dark tone (top bar, footer)', col: 'col-md-4' },
      { key: 'headingFont', type: 'font', label: 'Heading font', col: 'col-md-4' },
      { key: 'bodyFont', type: 'font', label: 'Body font', col: 'col-md-4' },
      {
        key: 'radius', type: 'select', label: 'Corner roundness', col: 'col-md-4', empty: false,
        options: [{ value: 'none', label: 'Square' }, { value: 'sm', label: 'Subtle' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Rounded' }, { value: 'xl', label: 'Extra rounded' }],
      },
    ],
  },
  {
    key: 'contact', title: 'Contact & Map', icon: 'telephone', nested: 'contact',
    fields: [
      { key: '_', type: 'heading', label: 'Phone numbers & emails', icon: 'telephone', help: 'Shown in the top bar, the footer, the About page and the mobile menu.' },
      { key: 'phone', label: 'Main phone', col: 'col-md-6', placeholder: '+254 7XX XXX XXX' },
      { key: 'phone2', label: 'Other phone (optional)', col: 'col-md-6' },
      { key: 'email', type: 'email', label: 'Main email', col: 'col-md-6' },
      { key: 'email2', type: 'email', label: 'Other email (optional, e.g. admissions)', col: 'col-md-6' },
      { key: 'hours', label: 'Office hours', col: 'col-md-6' },
      { key: 'address', label: 'Postal address', col: 'col-md-6' },
      { key: '__', type: 'heading', label: 'Location & map', icon: 'geo-alt', help: 'The map on the About page (Contact & Location) pins this place. Check the preview below.' },
      { key: 'location', label: 'Physical location (shown as text)', col: 'col-md-6', placeholder: 'Greenfield Road, Nairobi' },
      { key: 'mapLocation', label: 'Place to pin on the map', col: 'col-md-6', placeholder: 'School name and town, or -1.2921, 36.8219', help: 'A place name as Google Maps knows it, or GPS coordinates. Empty = the physical location.' },
      { key: 'mapEmbed', label: 'Or paste a Google Maps embed code (advanced, optional)', type: 'textarea', rows: 2, help: 'Google Maps → Share → Embed a map → Copy HTML. This overrides the place above.' },
    ],
  },
  {
    key: 'social', title: 'Social Media', icon: 'share', nested: 'social',
    fields: ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'tiktok'].map((k) => ({ key: k, label: k === 'twitter' ? 'X (Twitter) URL' : `${k[0].toUpperCase()}${k.slice(1)} URL`, col: 'col-md-6', placeholder: 'https://' }))
      .concat({ key: 'whatsapp', label: 'WhatsApp number or link', col: 'col-md-6', placeholder: '+2547…' }),
  },
  {
    key: 'chat', title: 'WhatsApp Chat', icon: 'whatsapp', nested: 'chat',
    fields: [
      { key: 'enabled', type: 'switch', label: 'Show the floating WhatsApp button', help: 'Visitors type a message and are taken to WhatsApp to send it.', col: 'col-md-6' },
      { key: 'number', label: 'WhatsApp number', placeholder: '0712 345 678 or +254712345678', help: 'Messages are sent to this number. Leave empty to use the WhatsApp number under Social Media.', col: 'col-md-6' },
      { key: 'name', label: 'Chat title (e.g. Admissions Office)', col: 'col-md-6' },
      { key: 'status', label: 'Status line under the title', col: 'col-md-6' },
      { key: 'greeting', label: 'Greeting message', type: 'textarea', rows: 2, help: 'Use {school} to insert the school name.' },
      { key: 'delay', type: 'number', label: 'Show the greeting pop-up after (seconds)', help: '0 turns the automatic pop-up off.', col: 'col-md-6' },
      { key: 'placeholder', label: 'Message box hint', col: 'col-md-6' },
    ],
  },
  {
    key: 'announcement', title: 'Top Bar & Footer', icon: 'megaphone',
    fields: [
      { key: '_', type: 'heading', label: 'Scrolling announcement (top bar)' },
      { key: 'topbar.enabled', type: 'switch', label: 'Show announcement', col: 'col-md-4' },
      { key: 'topbar.announcement', label: 'Announcement text', col: 'col-md-8' },
      { key: 'topbar.link', label: 'Announcement link (optional)', col: 'col-md-6', placeholder: '/news' },
      { key: '__', type: 'heading', label: 'Footer' },
      { key: 'footer.about', label: 'Footer about text', type: 'textarea', rows: 3 },
      { key: 'footer.copyright', label: 'Copyright line (leave empty for automatic)' },
      { key: '___', type: 'heading', label: 'Search engines' },
      { key: 'seo.description', label: 'Site description', type: 'textarea', rows: 2 },
    ],
  },
];
